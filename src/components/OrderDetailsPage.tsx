// src/components/OrderDetailsPage.tsx
import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Package, MapPin } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  sellerName?: string;
  sellerId?: string;
  itemStatus?: string;
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: OrderItem[];
  customerName: string;
  shippingAddress?: string;
  paymentMethod?: string;
}

interface OrderDetailsPageProps {
  orderId: string;
  currentUser?: { id: string; name: string; role: 'customer' | 'seller'; email: string } | null;
  onNavigate: (page: string, idOrParam?: string) => void;
}

export function OrderDetailsPage({ orderId, currentUser, onNavigate }: OrderDetailsPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Delivered': { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
      'Shipped': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Shipped' },
      'Confirmed': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Confirmed' },
      'Processing': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Processing' },
      'Pending': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' },
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
    return <Badge className={`${config.bg} ${config.text} border-0`}>{config.label}</Badge>;
  };

  const getItemStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusConfig = {
      'Delivered': { bg: 'bg-green-50', text: 'text-green-700', label: 'Delivered' },
      'Shipped': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Shipped' },
      'Processing': { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Processing' },
      'Ready to Ship': { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Ready to Ship' },
      'Being Prepared': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Being Prepared' },
      'Confirmed': { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Confirmed' },
      'Pending': { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
      'Cancelled': { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
    return (
      <Badge variant="outline" className={`${config.bg} ${config.text} border-current text-xs`}>
        {config.label}
      </Badge>
    );
  };

  useEffect(() => {
    if (!currentUser?.id) {
      setError('You must be logged in to view order details.');
      setLoading(false);
      return;
    }

    async function loadOrder() {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Loading order details for:', orderId);
        console.log('Current user:', currentUser.id);

        // Load all user orders and find this specific one
        const userOrdersRes = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/orders`);
        
        console.log('Orders response status:', userOrdersRes.status);
        
        if (!userOrdersRes.ok) {
          throw new Error(`Failed to load orders: ${userOrdersRes.status}`);
        }
        
        const allOrders = await userOrdersRes.json();
        console.log('All orders loaded:', allOrders.length);
        
        const found = allOrders.find((o: any) => o.id === orderId);
        
        if (!found) {
          console.log('Available order IDs:', allOrders.map((o: any) => o.id));
          throw new Error(`Order ${orderId} not found`);
        }
        
        console.log('✅ Order found:', found);

        // Process order items to add seller names
        const processedItems = await Promise.all(
          found.items.map(async (item: any) => {
            let sellerName = item.sellerName || 'Unknown Seller';
            
            try {
              // Fetch product details to get seller info if missing
              if (!sellerName || sellerName === 'Unknown Seller') {
                const productRes = await fetch(`${API_BASE_URL}/api/products/${item.productId}`);
                if (productRes.ok) {
                  const product = await productRes.json();
                  sellerName = product.sellerName || 'Unknown Seller';
                }
              }
            } catch (err) {
              console.warn('Failed to fetch seller for product:', item.productId);
            }
            
            return {
              ...item,
              sellerName
            };
          })
        );

        const processedOrder = {
          ...found,
          items: processedItems
        };
        
        setOrder(processedOrder);
        
      } catch (err: any) {
        console.error('Error loading order details:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId, currentUser?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => onNavigate('customer-profile')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <Card className="p-6 bg-white border border-border">
            <p>Loading order details...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => onNavigate('customer-profile')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <Card className="p-6 bg-white border border-border">
            <p className="text-red-600 mb-2">Failed to load order details.</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button 
              onClick={() => onNavigate('customer-profile')} 
              className="mt-4"
              variant="outline"
            >
              Return to Orders
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-cream py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => onNavigate('customer-profile')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>

        <Card className="p-8 bg-white border border-border">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-['Poppins'] text-3xl mb-1">Order Details</h1>
              <p className="text-sm text-foreground/70">Order ID: {order.id}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-foreground/70">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(order.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {order.items.length} items
                </span>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(order.status)}
              <p className="font-['Poppins'] text-2xl text-primary mt-2">
                BD {order.total.toFixed(3)}
              </p>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg flex gap-3">
              <MapPin className="w-5 h-5 mt-0.5 text-primary" />
              <div>
                <p className="text-sm font-medium mb-1">Shipping Address</p>
                <p className="text-sm text-foreground/70">
                  {order.shippingAddress}
                </p>
              </div>
            </div>
          )}

          {/* Payment Method */}
          {order.paymentMethod && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">Payment Method</p>
              <p className="text-sm text-foreground/70">{order.paymentMethod}</p>
            </div>
          )}

          <Separator className="my-6" />

          {/* Items */}
          <div className="space-y-4 mb-6">
            <h3 className="font-['Lato'] text-lg">Order Items</h3>
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{item.productName}</p>
                    {getItemStatusBadge(item.itemStatus)}
                  </div>
                  {item.sellerName && (
                    <p className="text-sm text-foreground/70">
                      Sold by <span className="font-medium">{item.sellerName}</span>
                    </p>
                  )}
                  <p className="text-xs text-foreground/60 mt-1">
                    Product ID: {item.productId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/70">Qty: {item.quantity}</p>
                  <p className="font-medium">BD {item.price.toFixed(3)} each</p>
                  <p className="font-bold text-primary">
                    BD {(item.price * item.quantity).toFixed(3)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <Separator className="my-6" />
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span>Subtotal ({order.items.length} items)</span>
              <span>BD {(order.total - 3.5).toFixed(3)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Shipping</span>
              <span>BD 3.500</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">BD {order.total.toFixed(3)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <Button 
              onClick={() => onNavigate('customer-profile')}
              className="bg-primary hover:bg-primary/90"
            >
              Back to All Orders
            </Button>
            {order.status === 'Delivered' && (
              <Button 
                variant="outline"
                onClick={() => {
                  // TODO: Implement review functionality
                  alert('Review functionality coming soon!');
                }}
              >
                Write a Review
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}