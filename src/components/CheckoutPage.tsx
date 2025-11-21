import { useState, useEffect } from 'react';
import { CreditCard, MapPin, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface CheckoutPageProps {
  cartItems: any[];
  cartTotal: number;
  onNavigate: (page: string) => void;
  currentUser?: { 
    id: string; 
    name: string; 
    role: string;
    email: string;
    phone?: string; 
  } | null;
  // 🔴 NEW: let parent clear cart state
  onCartCleared?: () => void;
}

export function CheckoutPage({
  cartItems,
  cartTotal,
  onNavigate,
  currentUser,
  onCartCleared,
}: CheckoutPageProps) {
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [isPlacing, setIsPlacing] = useState(false);

  // ---------- AUTOFILL LOGIC ----------
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNum, setPhoneNum] = useState('');

  // Address fields
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Manama');
  const [postalCode, setPostalCode] = useState('');

  useEffect(() => {
    if (currentUser) {
      const nameParts = currentUser.name.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(currentUser.email || '');
      setPhoneNum(currentUser.phone || '');
    }
  }, [currentUser]);

  // ---------- PRICES ----------
  const shipping = 3.5;
  const subtotal = cartTotal;
  const totalWithShipping = subtotal + shipping;

  // ---------- PLACE ORDER ----------
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error('Please log in to place an order');
      onNavigate('login');
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setIsPlacing(true);

      const shippingAddress = `${address}, ${city}${postalCode ? ` ${postalCode}` : ''}`;

      // 1) CREATE ORDER
      const orderPayload = {
        customerName: `${firstName} ${lastName}`.trim() || currentUser.name,
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: totalWithShipping,
        status: 'Pending',
        date: new Date().toISOString(),
        shippingAddress,
      };

      const orderRes = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        const txt = await orderRes.text();
        console.error('Order create error:', txt);
        throw new Error('Failed to create order');
      }

      const createdOrder = await orderRes.json();
      console.log('✅ Order created:', createdOrder);

      // 2) UPDATE PRODUCTS STOCK + ACCUMULATE SELLER REVENUE
      const sellerRevenue: Record<string, number> = {};

      await Promise.all(
        cartItems.map(async (item) => {
          try {
            if (!item.productId) return;

            const prodRes = await fetch(`${API_BASE_URL}/api/products/${item.productId}`);
            if (!prodRes.ok) {
              console.warn('Could not load product to update stock:', item.productId);
              return;
            }

            const product = await prodRes.json();
            const currentStock = typeof product.stock === 'number' ? product.stock : 0;
            const newStock = Math.max(0, currentStock - (item.quantity || 0));

            await fetch(`${API_BASE_URL}/api/products/${item.productId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stock: newStock }),
            });

            if (product.sellerId) {
              const revenue = (item.price || 0) * (item.quantity || 0);
              sellerRevenue[product.sellerId] =
                (sellerRevenue[product.sellerId] || 0) + revenue;
            }
          } catch (err) {
            console.error('Error updating product stock:', err);
          }
        })
      );

      // 3) UPDATE SELLERS totalSales
      await Promise.all(
        Object.entries(sellerRevenue).map(async ([sellerId, revenue]) => {
          try {
            const sellerRes = await fetch(`${API_BASE_URL}/api/sellers/${sellerId}`);
            if (!sellerRes.ok) {
              console.warn('Could not load seller to update totalSales:', sellerId);
              return;
            }

            const seller = await sellerRes.json();
            const currentTotal =
              typeof seller.totalSales === 'number' ? seller.totalSales : 0;

            await fetch(`${API_BASE_URL}/api/sellers/${sellerId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ totalSales: currentTotal + revenue }),
            });
          } catch (err) {
            console.error('Error updating seller totalSales:', err);
          }
        })
      );

      // 4) CLEAR CART IN BACKEND
      const clearRes = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/cart`, {
        method: 'DELETE',
      });

      if (!clearRes.ok) {
        const txt = await clearRes.text();
        console.warn('Failed to clear cart:', txt);
      } else {
        console.log('✅ Cart cleared in backend');
      }

      // 5) TELL PARENT TO CLEAR FRONTEND CART STATE
      if (onCartCleared) {
        onCartCleared();
      }

      toast.success('Order placed successfully!');
      setIsOrderPlaced(true);
    } catch (err) {
      console.error('❌ Error placing order:', err);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  // ---------- SUCCESS VIEW ----------
  if (isOrderPlaced) {
    return (
      <div className="min-h-screen bg-soft-cream py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center bg-white border border-border">
          <div className="bg-olive-green/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-olive-green" />
          </div>
          <h2 className="font-['Poppins'] text-2xl mb-3 text-foreground">
            Order Placed Successfully!
          </h2>
          <p className="text-foreground/70 mb-6">
            Thank you for supporting local farmers and artisans.
          </p>

          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => onNavigate('home')}
          >
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  // ---------- MAIN FORM ----------
  return (
    <div className="min-h-screen bg-soft-cream py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handlePlaceOrder}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* FORM */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-white border border-border">
                <div className="flex items-center space-x-2 mb-6">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="font-['Poppins'] text-xl">Shipping Information</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={phoneNum}
                    onChange={(e) => setPhoneNum(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Street Address</Label>
                  <Input
                    placeholder="House / Road / Block"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="Manama"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input
                      placeholder="Optional"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white border border-border">
                <div className="flex items-center space-x-2 mb-6">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="font-['Poppins'] text-xl">Payment</h2>
                </div>

                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(val) => setPaymentMethod(val as 'card' | 'cod')}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 border border-border rounded-lg p-4">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1">
                      Credit / Debit Card
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border border-border rounded-lg p-4">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1">
                      Cash on Delivery
                    </Label>
                  </div>
                </RadioGroup>
              </Card>
            </div>

            {/* ORDER SUMMARY */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white border border-border sticky top-24">
                <h2 className="font-['Poppins'] text-xl mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <div>
                        <p className="text-foreground line-clamp-1">{item.name}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-['Roboto_Mono']">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between mb-2 text-sm text-foreground/80">
                  <span>Subtotal</span>
                  <span className="font-['Roboto_Mono']">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between mb-4 text-sm text-foreground/80">
                  <span>Shipping</span>
                  <span className="font-['Roboto_Mono']">
                    ${shipping.toFixed(2)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between mb-6 items-center">
                  <span className="font-['Lato'] text-base">Total</span>
                  <span className="font-['Poppins'] text-2xl text-primary">
                    ${totalWithShipping.toFixed(2)}
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={isPlacing}
                  className="w-full h-12 bg-primary hover:bg-primary/90"
                >
                  {isPlacing ? 'Placing Order...' : 'Place Order'}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  By placing your order, you agree to our terms and conditions.
                </p>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
