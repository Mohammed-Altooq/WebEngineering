import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { ProductListingPage } from './components/ProductListingPage';
import { ProductDetailsPage } from './components/ProductDetailsPage';
import { CartPage } from './components/CartPage';
import { CheckoutPage } from './components/CheckoutPage';
import { SellerDashboard } from './components/SellerDashboard';
import { SellerProfilePage } from './components/SellerProfilePage';
import { ReviewPage } from './components/ReviewPage';
import { StyleGuide } from './components/StyleGuide';
import { CustomerProfile } from './components/customerProfile';
import { SellerProfile } from './components/sellerProfile'; 
import { Product } from './lib/mockData';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { RegisterPage } from './components/RegisterPage';
import { AboutPage } from './components/AboutPage';
import { FaqPage } from './components/FaqPage';

// Using Vite proxy - requests will be forwarded to Express server
const API_BASE_URL = '';

type UserRole = 'customer' | 'seller';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!user;
  const isSeller = user?.role === 'seller';

  // Load user from localStorage on app startup
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (err) {
        console.error('Error loading saved user:', err);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Load cart items & count when user changes
  useEffect(() => {
    async function loadCart() {
      if (!user?.id) {
        setCartItems([]);
        setCartItemCount(0);
        return;
      }

      try {
        console.log('🛒 Loading cart for user:', user.id);
        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/cart`);
        console.log('Cart response status:', response.status);
        
        if (response.ok) {
          const responseText = await response.text();
          console.log('Cart response:', responseText);
          
          try {
            const cartData = JSON.parse(responseText);
            const items = cartData.items || [];
            const totalItems = Array.isArray(items)
              ? items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
              : 0;

            setCartItems(Array.isArray(items) ? items : []);
            setCartItemCount(totalItems);
            console.log('✅ Cart loaded. Items:', items.length, 'Count:', totalItems);
          } catch (parseError) {
            console.error('Error parsing cart response:', parseError);
            setCartItems([]);
            setCartItemCount(0);
          }
        } else {
          console.log('⚠️ Cart not found, setting to empty');
          setCartItems([]);
          setCartItemCount(0);
        }
      } catch (err) {
        console.error('❌ Error loading cart:', err);
        setCartItems([]);
        setCartItemCount(0);
      }
    }

    loadCart();
  }, [user?.id]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setCartItemCount(0);
    setCartItems([]);
    localStorage.removeItem('user');
    setCurrentPage('home');
  };

  const handleNavigate = (page: string, idOrCategory?: string) => {
  setCurrentPage(page);

  if (
    page === 'product-details' ||
    page === 'seller-profile' ||
    page === 'reviews'          // 👈 NEW: keep productId when going to reviews page
  ) {
    setSelectedProductId(idOrCategory);
  } else {
    setSelectedProductId(undefined);
  }

  if (page === 'products') {
    setSelectedCategory(idOrCategory);
  } else {
    setSelectedCategory(undefined);
  }

  const skipScrollToTop = page === 'home' && idOrCategory === 'keepScroll';

  if (!skipScrollToTop) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};


  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    console.log('🛒 === ADD TO CART DEBUG ===');
    console.log('User:', user);
    console.log('Product:', product);
    console.log('API Base URL:', API_BASE_URL);

    if (!user?.id) {
      console.log('❌ No user - redirecting to login');
      setCurrentPage('login');
      toast.error('Please log in to add items to cart');
      return;
    }

    try {
      const cartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        sellerName: product.sellerName,
        quantity,
        stock: product.stock
      };

      console.log('📦 Cart item to add:', cartItem);

      const apiUrl = `${API_BASE_URL}/api/users/${user.id}/cart`;
      console.log('🔗 API URL:', apiUrl);

      const addResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartItem)
      });

      console.log('📡 Response status:', addResponse.status);
      console.log('📡 Response headers:', Object.fromEntries(addResponse.headers.entries()));

      const addText = await addResponse.text();
      console.log('📡 Response text:', addText);

      if (addResponse.ok) {
        console.log('✅ Item added successfully');
        toast.success(`Added ${product.name} to cart`);

        // Try to use the response to update cart state
        try {
          const cartResponse = JSON.parse(addText);
          if (cartResponse.cart && Array.isArray(cartResponse.cart.items)) {
            const items = cartResponse.cart.items;
            const totalItems = items.reduce(
              (sum: number, item: any) => sum + (item.quantity || 0),
              0
            );
            setCartItems(items);
            setCartItemCount(totalItems);
            console.log('✅ Cart updated. Items:', items.length, 'Count:', totalItems);
            return;
          }
        } catch (e) {
          console.log('⚠️ Could not parse cart response for state update, falling back to GET');
        }

        // Fallback: reload cart from backend
        const updatedCartResponse = await fetch(`${API_BASE_URL}/api/users/${user.id}/cart`);
        if (updatedCartResponse.ok) {
          const cartText = await updatedCartResponse.text();
          try {
            const cartData = JSON.parse(cartText);
            const items = cartData.items || [];
            const totalItems = Array.isArray(items)
              ? items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
              : 0;
            setCartItems(Array.isArray(items) ? items : []);
            setCartItemCount(totalItems);
            console.log('✅ Cart reloaded from GET. Count:', totalItems);
          } catch (e) {
            console.error('Error parsing fallback cart response:', e);
          }
        }
      } else {
        console.error('❌ Failed to add to cart:', addResponse.status, addText);
        throw new Error(`Failed to add item to cart: ${addResponse.status} - ${addText}`);
      }

    } catch (error: any) {
      console.error('❌ Error adding to cart:', error);
      toast.error(`Failed to add item to cart: ${error.message}`);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            onNavigate={handleNavigate} 
            onAddToCart={handleAddToCart} 
            currentUser={user}
          />
        );

      case 'login':
        return (
          <LoginPage
            onNavigate={handleNavigate}
            onLogin={handleLogin}
            isLoggedIn={isLoggedIn}           
            currentUserRole={user?.role}
          />
        );

      case 'register':
        return (
          <RegisterPage
            onNavigate={handleNavigate}
            onLogin={handleLogin}
            isLoggedIn={isLoggedIn}
            currentUserRole={user?.role}
          />
        );

      case 'products':
        return (
          <ProductListingPage
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            initialCategory={selectedCategory}
            currentUser={user}
          />
        );

      case 'product-details':
        return selectedProductId ? (
          <ProductDetailsPage
            productId={selectedProductId}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            isLoggedIn={isLoggedIn}
            currentUser={user}
          />
        ) : (
          <HomePage 
            onNavigate={handleNavigate} 
            onAddToCart={handleAddToCart} 
            currentUser={user} 
          />
        );

      case 'cart':
        return (
          <CartPage
            onNavigate={handleNavigate}
            currentUser={user}
          />
        );

      case 'checkout': {
        const items = cartItems;
        const total = items.reduce(
          (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0),
          0
        );

        return (
          <CheckoutPage
            cartItems={items}
            cartTotal={total}
            onNavigate={handleNavigate}
            currentUser={user}
             onCartCleared={() => {
        setCartItems([]);
        setCartTotal(0);
        setCartItemCount(0);
      }}
          />
        );
      }

      case 'seller-dashboard':
        return isSeller ? (
          <SellerDashboard onNavigate={handleNavigate} currentUser={user} />
        ) : (
          <HomePage 
            onNavigate={handleNavigate} 
            onAddToCart={handleAddToCart} 
            currentUser={user} 
          />
        );

      case 'seller-profile':
        return (
          <SellerProfilePage
            sellerId={selectedProductId}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            currentUser={user}
          />
        );

          case 'reviews':
      return selectedProductId ? (
        <ReviewPage
          productId={selectedProductId}
          onNavigate={handleNavigate}
          currentUser={user}
        />
      ) : (
        <HomePage
          onNavigate={handleNavigate}
          onAddToCart={handleAddToCart}
          currentUser={user}
        />
      );


      case 'customer-profile':
        return (
          <CustomerProfile
            currentUser={user}
            onNavigate={handleNavigate}
          />
        );

      case 'customer-orders':
        return (
          <CustomerProfile
            currentUser={user}
            onNavigate={handleNavigate}
          />
        );

      case 'seller-profile-edit':
        return isSeller ? (
          <SellerProfile
            currentUser={user}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <HomePage 
            onNavigate={handleNavigate} 
            onAddToCart={handleAddToCart} 
            currentUser={user} 
          />
        );

      case 'style-guide':
        return <StyleGuide />;
      
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;

      case 'faqs':
        return <FaqPage onNavigate={handleNavigate} />;

      default:
        return (
          <HomePage 
            onNavigate={handleNavigate} 
            onAddToCart={handleAddToCart} 
            currentUser={user} 
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onNavigate={handleNavigate}
        currentPage={currentPage}
        cartItemCount={cartItemCount}
        isLoggedIn={isLoggedIn}
        isSeller={isSeller}
        onLogout={handleLogout}
      />

      <main>{renderPage()}</main>

      <Footer 
        onNavigate={handleNavigate}  
        isLoggedIn={isLoggedIn}
        currentUserRole={user?.role}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#666666',
            color: '#fff',
            border: 'none',
          },
        }}
      />
    </div>
  );
}
