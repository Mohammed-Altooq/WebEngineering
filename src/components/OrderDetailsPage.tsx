// src/components/OrderDetailsPage.tsx
import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Package, MapPin } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
      Delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
      Shipped: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Shipped' },
      Confirmed: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Confirmed' },
      Processing: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Processing' },
      Pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' },
      Cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
    } as const;

    const config = (statusConfig as any)[status] || statusConfig.Pending;
    return <Badge className={`${config.bg} ${config.text} border-0`}>{config.label}</Badge>;
  };

  const getItemStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusConfig = {
      Delivered: { bg: 'bg-green-50', text: 'text-green-700', label: 'Delivered' },
      Shipped: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Shipped' },
      Processing: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Processing' },
      'Ready to Ship': { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Ready to Ship' },
      'Being Prepared': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Being Prepared' },
      Confirmed: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Confirmed' },
      Pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
      Cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
    } as const;

    const config = (statusConfig as any)[status] || statusConfig.Pending;
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

        // 1) Try direct /api/orders/:id
        let orderData: Order | null = null;

        try {
          const directRes = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
          if (directRes.ok) {
            orderData = await directRes.json();
          }
        } catch {
          // ignore, fallback below
        }

        // 2) Fallback: load all user orders and find this one
        if (!orderData) {
          const userOrdersRes = await fetch(`${API_BASE_URL}/api/orders/user/${currentUser.id}`);
          if (!userOrdersRes.ok) {
            throw new Error('Failed to load orders');
          }
          const allOrders = await userOrdersRes.json();
          const found = allOrders.find((o: any) => o.id === orderId);
          if (!found) {
            throw new Error('Order not found');
          }
          orderData = found;
        }

        setOrder(orderData);
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
            <p className="text-red-600 mb-2">Failed to load order.</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
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

          {/* Shipping */}
          {order.shippingAddress && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg flex gap-3">
              <MapPin className="w-5 h-5 mt-0.5 text-primary" />
              <div>
                <p className="text-sm font-medium mb-1">Shipping Address</p>
                <p className="text-sm text-foreground/70 whitespace-pre-line">
                  {order.shippingAddress}
                </p>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Items */}
          <div className="space-y-3 mb-6">
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{item.productName}</p>
                    {getItemStatusBadge(item.itemStatus)}
                  </div>
                  {item.sellerName && (
                    <p className="text-xs text-foreground/70">
                      Sold by <span className="font-medium">{item.sellerName}</span>
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm">Qty: {item.quantity}</p>
                  <p className="font-medium">
                    BD {(item.price * item.quantity).toFixed(3)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <Separator className="my-4" />
          <div className="flex justify-between items-center">
            <p className="font-medium">Order Total</p>
            <p className="font-['Poppins'] text-xl text-primary">
              BD {order.total.toFixed(3)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
