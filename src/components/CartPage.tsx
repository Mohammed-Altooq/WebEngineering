import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  sellerName: string;
  quantity: number;
  stock: number;
}

interface CartPageProps {
  cartItems: CartItem[];
  onNavigate: (page: string) => void;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export function CartPage({ cartItems, onNavigate, onUpdateQuantity, onRemoveItem }: CartPageProps) {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 3.50 : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-soft-cream py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-['Poppins'] text-3xl mb-2">Shopping Cart</h1>
          <p className="text-foreground/70">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-6 bg-white border border-border">
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
                          onClick={() => onRemoveItem(item.id)}
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
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="p-2 hover:bg-secondary transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-['Roboto_Mono']">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                            className="p-2 hover:bg-secondary transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="font-['Roboto_Mono'] text-lg text-primary">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${item.price.toFixed(2)} each
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
                    <span className="font-['Roboto_Mono']">${subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-foreground/70">
                    <span>Shipping</span>
                    <span className="font-['Roboto_Mono']">${shipping.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <span className="font-['Lato']">Total</span>
                    <span className="font-['Poppins'] text-2xl text-primary">
                      ${total.toFixed(2)}
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
                    <strong>Free shipping</strong> on orders over $50
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
