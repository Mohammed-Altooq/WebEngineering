import { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { authFetch } from '../lib/api';

const API_BASE_URL = 'http://localhost:3000';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  sellerName: string;
  quantity: number;
  stock: number;
}

interface CartPageProps {
  onNavigate: (page: string) => void;
  currentUser?: { id: string; name: string; role: 'customer' | 'seller'; email: string } | null;
}

export function CartPage({ onNavigate, currentUser }: CartPageProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cart items from database
  useEffect(() => {
    async function loadCartItems() {
      if (!currentUser?.id) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await authFetch(`/api/users/${currentUser.id}/cart`);
        if (response.ok) {
          const responseText = await response.text();
          try {
            const cartData = JSON.parse(responseText);
            const items = cartData.items || [];
            setCartItems(Array.isArray(items) ? items : []);
          } catch {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      } catch (err) {
        console.error('Error loading cart items:', err);
        setError('Failed to load cart items');
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadCartItems();
  }, [currentUser?.id]);

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (!currentUser?.id) return;

    try {
      const response = await authFetch(`/api/users/${currentUser.id}/cart/${productId}`, {
  method: 'PATCH',
  body: JSON.stringify({ quantity: newQuantity })
});


      if (response.ok) {
        // Update local state
        setCartItems(items => 
          items.map(item => 
            item.productId === productId ? { ...item, quantity: newQuantity } : item
          )
        );
      } else {
        throw new Error('Failed to update quantity');
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity');
    }
  };

  const removeItem = async (productId: string) => {
    if (!currentUser?.id) return;

    try {
      const response = await authFetch(`/api/users/${currentUser.id}/cart/${productId}`, {
  method: 'DELETE'
});


      if (response.ok) {
        // Update local state
        setCartItems(items => items.filter(item => item.productId !== productId));
      } else {
        throw new Error('Failed to remove item');
      }
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 3.50 : 0;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="p-6 bg-white border border-border text-center">
            <p>Loading cart...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12 text-center bg-white border border-border">
            <div className="max-w-md mx-auto">
              <h2 className="font-['Poppins'] text-2xl mb-3">Please Log In</h2>
              <p className="text-foreground/70 mb-6">
                You need to be logged in to view your cart.
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => onNavigate('login')}
              >
                Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-cream py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-['Poppins'] text-3xl mb-2">Shopping Cart</h1>
          <p className="text-foreground/70">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </Card>
        )}

        {cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.productId} className="p-6 bg-white border border-border">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary/20 flex-shrink-0">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-['Lato'] mb-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.sellerName}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-destructive hover:text-destructive/80 p-2"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-border rounded-lg bg-input-background">
                          <button
                            onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                            className="p-2 hover:bg-secondary transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-['Roboto_Mono']">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, Math.min(item.stock, item.quantity + 1))}
                            className="p-2 hover:bg-secondary transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-['Roboto_Mono'] text-lg text-primary">
                            BD {(item.price * item.quantity).toFixed(3)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            BD {item.price.toFixed(3)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Continue Shopping */}
              <Button 
                variant="outline" 
                onClick={() => onNavigate('products')}
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white border border-border sticky top-24">
                <h2 className="font-['Poppins'] text-xl mb-6">Order Summary</h2>

                <div className="space-y-4">
                  <div className="flex justify-between text-foreground/70">
                    <span>Subtotal</span>
                    <span className="font-['Roboto_Mono']">BD {subtotal.toFixed(3)}</span>
                  </div>

                  <div className="flex justify-between text-foreground/70">
                    <span>Shipping</span>
                    <span className="font-['Roboto_Mono']">BD {shipping.toFixed(3)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <span className="font-['Lato']">Total</span>
                    <span className="font-['Poppins'] text-2xl text-primary">
                      BD {total.toFixed(3)}
                    </span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-6 bg-primary hover:bg-primary/90 h-12"
                  onClick={() => onNavigate('checkout')}
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>

                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-foreground/80">
                    <strong>Free shipping</strong> on orders over BD 20.000
                  </p>
                </div>

                {/* Security Badges */}
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-center text-muted-foreground">
                    Secure checkout • 100% satisfaction guaranteed
                  </p>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center bg-white border border-border">
            <div className="max-w-md mx-auto">
              <div className="bg-secondary/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-['Poppins'] text-2xl mb-3">Your cart is empty</h2>
              <p className="text-foreground/70 mb-6">
                Looks like you haven't added any items to your cart yet. 
                Start shopping to support local farmers and artisans!
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => onNavigate('products')}
              >
                Browse Marketplace
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}