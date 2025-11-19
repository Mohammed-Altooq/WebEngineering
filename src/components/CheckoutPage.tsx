import { useState } from 'react';
import { CreditCard, MapPin, User, Mail, Phone, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface CheckoutPageProps {
  cartItems: any[];
  cartTotal: number;
  onNavigate: (page: string) => void;
}

export function CheckoutPage({ cartItems, cartTotal, onNavigate }: CheckoutPageProps) {
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const subtotal = cartTotal - 3.50;
  const shipping = 3.50;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOrderPlaced(true);
    // Simulate order placement
    setTimeout(() => {
      // In a real app, this would redirect to order confirmation
    }, 2000);
  };

  if (isOrderPlaced) {
    return (
      <div className="min-h-screen bg-soft-cream py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center bg-white border border-border">
          <div className="bg-olive-green/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-olive-green" />
          </div>
          <h2 className="font-['Poppins'] text-2xl mb-3 text-foreground">Order Placed Successfully!</h2>
          <p className="text-foreground/70 mb-6">
            Thank you for supporting local farmers and artisans. Your order confirmation has been sent to your email.
          </p>
          <div className="bg-soft-cream rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground/70 mb-1">Order Number</p>
            <p className="font-['Roboto_Mono'] text-lg text-primary">ORD{Math.floor(Math.random() * 10000)}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onNavigate('products')}
            >
              Continue Shopping
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => onNavigate('home')}
            >
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-cream py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-['Poppins'] text-3xl mb-2">Checkout</h1>
          <p className="text-foreground/70">Complete your order</p>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <Card className="p-6 bg-white border border-border">
                <div className="flex items-center space-x-2 mb-6">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="font-['Poppins'] text-xl">Shipping Information</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      required 
                      className="bg-input-background"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      required 
                      className="bg-input-background"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    className="bg-input-background"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    required 
                    className="bg-input-background"
                    placeholder="+973 XXXX XXXX"
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="address">Street Address</Label>
                  <Input 
                    id="address" 
                    required 
                    className="bg-input-background"
                    placeholder="Building number, Road, Block"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      required 
                      className="bg-input-background"
                      placeholder="Manama"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input 
                      id="postalCode" 
                      className="bg-input-background"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </Card>

              {/* Payment Information */}
              <Card className="p-6 bg-white border border-border">
                <div className="flex items-center space-x-2 mb-6">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="font-['Poppins'] text-xl">Payment Method</h2>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <div className="flex items-center space-x-2 border border-border rounded-lg p-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      Credit / Debit Card
                    </Label>
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex items-center space-x-2 border border-border rounded-lg p-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      Cash on Delivery
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'card' && (
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input 
                        id="cardNumber" 
                        placeholder="1234 5678 9012 3456"
                        className="bg-input-background"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input 
                          id="expiry" 
                          placeholder="MM/YY"
                          className="bg-input-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input 
                          id="cvv" 
                          placeholder="123"
                          className="bg-input-background"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white border border-border sticky top-24">
                <h2 className="font-['Poppins'] text-xl mb-6">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="text-foreground line-clamp-1">{item.name}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-['Roboto_Mono'] text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
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
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full mt-6 bg-primary hover:bg-primary/90 h-12"
                >
                  Place Order
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  By placing your order, you agree to our terms and conditions
                </p>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
