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
import { toast } from 'sonner';
import { RegisterPage } from './components/RegisterPage';
import { AboutPage } from './components/AboutPage';
import { FaqPage } from './components/FaqPage';
import { authFetch } from './lib/api';
import { SellerOrdersPage } from './components/SellerOrdersPage';
import { OrderDetailsPage } from './components/OrderDetailsPage';

// Using Vite proxy - requests will be forwarded to Express server
const API_BASE_URL = '';

type UserRole = 'customer' | 'seller';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  sellerId?: string;
  sellerName?: string;
  itemStatus?: string;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: string;
  date: string;
  shippingAddress?: string;
  paymentMethod?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
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
        // ✅ use authFetch so Authorization header is included
        const response = await authFetch(`/api/users/${user.id}/cart`);
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
    setSelectedOrderId(undefined);
    localStorage.removeItem('user');
    setCurrentPage('home');
  };

  const handleNavigate = (page: string, idOrCategory?: string) => {
    console.log('🧭 Navigating to:', page, 'with param:', idOrCategory);

    setCurrentPage(page);

    if (
      page === 'product-details' ||
      page === 'seller-profile' ||
      page === 'reviews'
    ) {
      setSelectedProductId(idOrCategory);
      setSelectedOrderId(undefined);
    } else if (page === 'order-details' || page === 'track-order') {
      setSelectedOrderId(idOrCategory);
      setSelectedProductId(undefined);
    } else {
      setSelectedProductId(undefined);
      setSelectedOrderId(undefined);
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
        stock: product.stock,
      };

      console.log('📦 Cart item to add:', cartItem);

      const apiUrl = `/api/users/${user.id}/cart`;
      console.log('🔗 API URL:', apiUrl);

      // ✅ use authFetch so Authorization header is included
      const addResponse = await authFetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartItem),
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
        const updatedCartResponse = await authFetch(`/api/users/${user.id}/cart`);
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

  const refreshOrders = async () => {
    console.log('🔄 Refreshing orders...');
    // Placeholder – order state is managed inside profile/dashboard components
  };

  const handleOrderStatusUpdate = (orderId: string, newStatus: string) => {
    console.log('📋 Order status updated:', orderId, '→', newStatus);
    toast.success('Order status updated successfully!');
  };

  const handleItemStatusUpdate = (orderId: string, productId: string, newStatus: string) => {
    console.log('📦 Item status updated:', orderId, productId, '→', newStatus);
    toast.success('Item status updated successfully!');
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
        return <CartPage onNavigate={handleNavigate} currentUser={user} />;

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
              setCartItemCount(0);
            }}
          />
        );
      }

      case 'seller-dashboard':
        return isSeller ? (
          <SellerDashboard
            onNavigate={handleNavigate}
            currentUser={user}
            onOrderStatusUpdate={handleOrderStatusUpdate}
            onItemStatusUpdate={handleItemStatusUpdate}
          />
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
      case 'customer-orders':
        return <CustomerProfile currentUser={user} onNavigate={handleNavigate} />;

      case 'order-details':
  return selectedOrderId ? (
    <OrderDetailsPage
      orderId={selectedOrderId}
      currentUser={user}
      onNavigate={handleNavigate}
    />
  ) : (
    <CustomerProfile currentUser={user} onNavigate={handleNavigate} />
  );


      case 'track-order':
        return selectedOrderId ? (
          <div className="min-h-screen bg-soft-cream py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="font-['Poppins'] text-3xl mb-6">Track Your Order</h1>
              <p className="text-foreground/70 mb-4">Tracking Order: {selectedOrderId}</p>
              <p className="text-sm text-foreground/60">
                Order tracking component would go here. This would show:
                <br />• Real-time status updates
                <br />• Timeline of order progress
                <br />• Expected delivery dates per item
                <br />• Carrier tracking info
                <br />• Contact seller options
              </p>
              <div className="mt-6">
                <button
                  onClick={() => handleNavigate('customer-profile')}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
                >
                  Back to Orders
                </button>
              </div>
            </div>
          </div>
        ) : (
          <CustomerProfile currentUser={user} onNavigate={handleNavigate} />
        );

      case 'seller-order-management':
        return isSeller ? (
          <SellerOrdersPage currentUser={user} onNavigate={handleNavigate} />
        ) : (
          <HomePage
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            currentUser={user}
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading marketplace...</p>
        </div>
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
