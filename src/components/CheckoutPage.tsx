// src/components/CheckoutPage.tsx
import { useState, useEffect } from 'react';
import { CreditCard, MapPin, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner';
import { authFetch } from '../lib/api'; // ✅ use authFetch so JWT is sent

interface CheckoutPageProps {
  cartItems: any[];
  cartTotal: number;
  onNavigate: (page: string) => void;
  currentUser?:
    | {
        id: string;
        name: string;
        role: string;
        email: string;
        phone?: string;
      }
    | null;
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

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Address fields
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Manama');
  const [postalCode, setPostalCode] = useState('');

  // Credit card fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    if (currentUser) {
      const nameParts = currentUser.name.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(currentUser.email || '');
      setPhoneNum(currentUser.phone || '');
      setCardName(currentUser.name || '');
    }
  }, [currentUser]);

  // Phone number validation
  const validatePhoneNumber = (phone: string) => {
    // Bahrain phone number format: +973 XXXX XXXX or 8 digits
    const bahrainPhoneRegex = /^(\+973\s?)?[0-9]{8}$/;
    return bahrainPhoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNum(value);
    if (value && !validatePhoneNumber(value)) {
      setPhoneError(
        'Please enter a valid Bahrain phone number (8 digits or +973 XXXXXXXX)',
      );
    } else {
      setPhoneError('');
    }
  };

  // Credit card number formatting
  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value.replace(/[^0-9]/g, ''));
    if (formatted.length <= 19) {
      // 16 digits + 3 spaces
      setCardNumber(formatted);
    }
  };

  // Expiry date formatting (MM/YY)
  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length >= 2) {
      const formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
      setExpiryDate(formatted);
    } else {
      setExpiryDate(cleaned);
    }
  };

  // CVV validation
  const handleCvvChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length <= 4) {
      setCvv(cleaned);
    }
  };

  const shipping = 3.5;
  const subtotal = cartTotal;
  const totalWithShipping = subtotal + shipping;

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

    // Validation
    if (phoneError) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber || !expiryDate || !cvv || !cardName) {
        toast.error('Please fill in all card details');
        return;
      }
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (cvv.length < 3) {
        toast.error('Please enter a valid CVV');
        return;
      }
    }

    try {
      setIsPlacing(true);

      const shippingAddress = `${address}, ${city}${
        postalCode ? ` ${postalCode}` : ''
      }`;

      // 1) CREATE ORDER  ✅ now using authFetch (sends Bearer token)
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
        paymentMethod: paymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery',
      };

      const orderRes = await authFetch(`/api/users/${currentUser.id}/orders`, {
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

            const prodRes = await authFetch(
              `/api/products/${item.productId}`,
            );
            if (!prodRes.ok) {
              console.warn(
                'Could not load product to update stock:',
                item.productId,
              );
              return;
            }

            const product = await prodRes.json();
            const currentStock =
              typeof product.stock === 'number' ? product.stock : 0;
            const newStock = Math.max(0, currentStock - (item.quantity || 0));

            await authFetch(`/api/products/${item.productId}`, {
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
        }),
      );

      // 3) UPDATE SELLERS totalSales
      await Promise.all(
        Object.entries(sellerRevenue).map(async ([sellerId, revenue]) => {
          try {
            const sellerRes = await authFetch(`/api/sellers/${sellerId}`);
            if (!sellerRes.ok) {
              console.warn(
                'Could not load seller to update totalSales:',
                sellerId,
              );
              return;
            }

            const seller = await sellerRes.json();
            const currentTotal =
              typeof seller.totalSales === 'number'
                ? seller.totalSales
                : 0;

            await authFetch(`/api/sellers/${sellerId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ totalSales: currentTotal + revenue }),
            });
          } catch (err) {
            console.error('Error updating seller totalSales:', err);
          }
        }),
      );

      // 4) CLEAR CART IN BACKEND
      const clearRes = await authFetch(
        `/api/users/${currentUser.id}/cart`,
        {
          method: 'DELETE',
        },
      );

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

  // Success view
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
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+973 XXXX XXXX or 8 digits"
                    required
                    className={phoneError ? 'border-red-500' : ''}
                  />
                  {phoneError && (
                    <p className="text-sm text-red-600">{phoneError}</p>
                  )}
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

                {/* Credit Card Form */}
                {paymentMethod === 'card' && (
                  <div className="mt-6 p-4 border border-border rounded-lg bg-gray-50">
                    <h3 className="font-['Lato'] text-lg mb-4">Card Details</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Cardholder Name</Label>
                        <Input
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Full name on card"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Card Number</Label>
                        <Input
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Expiry Date</Label>
                          <Input
                            value={expiryDate}
                            onChange={(e) => handleExpiryChange(e.target.value)}
                            placeholder="MM/YY"
                            maxLength={5}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input
                            value={cvv}
                            onChange={(e) => handleCvvChange(e.target.value)}
                            placeholder="123"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                        BD {(item.price * item.quantity).toFixed(3)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between mb-2 text-sm text-foreground/80">
                  <span>Subtotal</span>
                  <span className="font-['Roboto_Mono']">
                    BD {subtotal.toFixed(3)}
                  </span>
                </div>

                <div className="flex justify-between mb-4 text-sm text-foreground/80">
                  <span>Shipping</span>
                  <span className="font-['Roboto_Mono']">
                    BD {shipping.toFixed(3)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between mb-6 items-center">
                  <span className="font-['Lato'] text-base">Total</span>
                  <span className="font-['Poppins'] text-2xl text-primary">
                    BD {totalWithShipping.toFixed(3)}
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