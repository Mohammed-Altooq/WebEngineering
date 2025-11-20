import { useState } from 'react';
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
import { Product } from './lib/mockData';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { RegisterPage } from './components/RegisterPage';

type UserRole = 'customer' | 'seller';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  sellerName: string;
  quantity: number;
  stock: number;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const [user, setUser] = useState<User | null>(null);

  const isLoggedIn = !!user;
  const isSeller = user?.role === 'seller';

  // Called by LoginPage / RegisterPage
  const handleLogin = (role: UserRole) => {
    // For now we create a simple demo user object.
    // Later you can replace this with real backend auth.
    const demoUser: User = {
      id: '1',
      name: role === 'seller' ? 'Demo Seller' : 'Demo Customer',
      email: role === 'seller' ? 'seller@example.com' : 'customer@example.com',
      role,
    };
    setUser(demoUser);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
    // If you want to clear cart on logout, uncomment:
    // setCartItems([]);
  };

  const handleNavigate = (page: string, idOrCategory?: string) => {
    setCurrentPage(page);

    // used for product details & seller profile
    if (page === 'product-details' || page === 'seller-profile') {
      setSelectedProductId(idOrCategory);
    } else {
      setSelectedProductId(undefined);
    }

    // used for marketplace filter
    if (page === 'products') {
      setSelectedCategory(idOrCategory); // can be undefined (means "all")
    } else {
      setSelectedCategory(undefined);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item,
        ),
      );
      toast.success(`Updated ${product.name} quantity in cart`);
    } else {
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          sellerName: product.sellerName,
          quantity,
          stock: product.stock,
        },
      ]);
      toast.success(`Added ${product.name} to cart`);
    }
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === itemId
          ? { ...item, quantity: newQuantity }
          : item,
      ),
    );
  };

  const handleRemoveItem = (itemId: string) => {
    const item = cartItems.find((i) => i.id === itemId);
    setCartItems(cartItems.filter((item) => item.id !== itemId));
    if (item) {
      toast.success(`Removed ${item.name} from cart`);
    }
  };

  const cartTotal =
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) +
    (cartItems.length > 0 ? 3.5 : 0);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />;

      case 'login':
        return (
          <LoginPage
            onNavigate={handleNavigate}
            onLogin={handleLogin}
          />
        );

      case 'register':
        return (
          <RegisterPage
            onNavigate={handleNavigate}
            onLogin={handleLogin}
          />
        );

      case 'products':
        return (
          <ProductListingPage
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            initialCategory={selectedCategory}
          />
        );

      case 'product-details':
        return selectedProductId ? (
          <ProductDetailsPage
            productId={selectedProductId}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            isLoggedIn={isLoggedIn}
          />
        ) : (
          <HomePage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />
        );

      case 'cart':
        return (
          <CartPage
            cartItems={cartItems}
            onNavigate={handleNavigate}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        );

      case 'checkout':
        return (
          <CheckoutPage
            cartItems={cartItems}
            cartTotal={cartTotal}
            onNavigate={handleNavigate}
          />
        );

      case 'seller-dashboard':
        return isSeller ? (
          <SellerDashboard onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />
        );

      case 'seller-profile':
        return (
          <SellerProfilePage
            sellerId={selectedProductId}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
          />
        );

      case 'reviews':
        return <ReviewPage onNavigate={handleNavigate} />;

      case 'style-guide':
        return <StyleGuide />;

      default:
        return <HomePage onNavigate={handleNavigate} onAddToCart={handleAddToCart} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onNavigate={handleNavigate}
        currentPage={currentPage}
        cartItemCount={cartItems.length}
        isLoggedIn={isLoggedIn}
        isSeller={isSeller}
        onLogout={handleLogout}
      />

      <main>{renderPage()}</main>

      <Footer />

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
