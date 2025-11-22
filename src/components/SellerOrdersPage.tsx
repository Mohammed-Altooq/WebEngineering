import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { TrendingUp, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch, API_BASE_URL } from '../lib/api';

interface SellerOrdersPageProps {
  currentUser?: any;
  onNavigate: (page: string) => void;
}

interface Seller {
  id: string;
  name: string;
  type: string;
  description: string;
  location: string;
  image?: string;
  contactEmail: string;
  contactPhone: string;
  rating: number;
  totalSales: number;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  sellerId?: string;
  itemStatus?: string;
  isSellerItem?: boolean;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  sellerTotal?: number;
  status: string;
  date: string;
  shippingAddress?: string;
}

export function SellerOrdersPage({ currentUser, onNavigate }: SellerOrdersPageProps) {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- helpers reused from dashboard ---

  const getSellerItems = (order: Order) => {
    if (!seller?.id) return [];
    return order.items.filter(
      (item) => item.isSellerItem || item.sellerId === seller.id
    );
  };

  const getSellerOrderStatus = (order: Order): string => {
    const sellerItems = getSellerItems(order);
    if (sellerItems.length === 0) return 'Pending';

    const statuses = sellerItems.map((i) => i.itemStatus || 'Pending');

    if (statuses.every((s) => s === 'Shipped' || s === 'Delivered')) {
      return 'Completed';
    }
    if (statuses.some((s) => s === 'Being Prepared' || s === 'Ready to Ship')) {
      return 'Being Prepared';
    }
    if (statuses.some((s) => s === 'Confirmed')) {
      return 'Confirmed';
    }
    if (statuses.some((s) => s === 'Cancelled')) {
      return 'Cancelled';
    }
    return 'Pending';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'Confirmed': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'Being Prepared': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'Ready to Ship': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      'Shipped': { bg: 'bg-green-100', text: 'text-green-800' },
      'Delivered': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      'Completed': { bg: 'bg-green-100', text: 'text-green-800' },
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {status}
      </Badge>
    );
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleUpdateItemStatus = async (orderId: string, productId: string, newItemStatus: string) => {
    if (!seller?.id) {
      toast.error('Seller information not found');
      return;
    }

    try {
      const response = await authFetch(`/api/orders/${orderId}/items/${productId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemStatus: newItemStatus, sellerId: seller.id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update item status');
      }

      const updatedOrder = await response.json();

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? updatedOrder : order
        )
      );

      toast.success('Item status updated successfully!');
    } catch (err) {
      console.error('Error updating item status:', err);
      toast.error('Failed to update item status');
    }
  };

  // --- fetch all seller orders (all time) ---

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.id) {
        setError('No user logged in');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1) find current seller by email
        const sellersResponse = await fetch(`${API_BASE_URL}/api/sellers`);
        if (!sellersResponse.ok) throw new Error('Failed to fetch sellers');
        const allSellers = await sellersResponse.json();
        const currentSeller = allSellers.find(
          (s: Seller) => s.contactEmail === currentUser.email
        );
        if (!currentSeller) throw new Error('Seller profile not found');

        setSeller(currentSeller);

        // 2) fetch seller products (to know which order items belong to this seller)
        const productsResponse = await authFetch(`/api/sellers/${currentSeller.id}/products`);
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        const sellerProducts = await productsResponse.json();

        // 3) fetch all orders that contain this seller's products
        const ordersResponse = await authFetch(`/api/sellers/${currentSeller.id}/orders`);
        if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
        const sellerOrders = await ordersResponse.json();

        const processedOrders: Order[] = sellerOrders.map((order: Order) => {
          const updatedItems = order.items.map((item: OrderItem) => ({
            ...item,
            isSellerItem:
              sellerProducts.some((p: any) => p.id === item.productId) ||
              item.sellerId === currentSeller.id,
          }));

          return { ...order, items: updatedItems };
        });

        setOrders(processedOrders);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // --- derived stats ---

  const completedOrders = orders.filter(o => getSellerOrderStatus(o) === 'Completed');
  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + (order.sellerTotal || order.total),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <p>Seller profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-cream py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-['Poppins'] text-3xl mb-1">All Orders</h1>
            <p className="text-foreground/70">
              All orders containing your products, from the beginning of time.
            </p>
          </div>
          <Button onClick={() => onNavigate('seller-dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* quick stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-4 bg-white border border-border">
            <p className="text-sm text-foreground/70 mb-1">Total Orders</p>
            <p className="font-['Poppins'] text-2xl">{orders.length}</p>
          </Card>
          <Card className="p-4 bg-white border border-border">
            <p className="text-sm text-foreground/70 mb-1">Completed Orders</p>
            <p className="font-['Poppins'] text-2xl">{completedOrders.length}</p>
          </Card>
          <Card className="p-4 bg-white border border-border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-foreground/70">Total Revenue</p>
              <TrendingUp className="w-5 h-5 text-golden-harvest" />
            </div>
            <p className="font-['Poppins'] text-2xl">BD {totalRevenue.toFixed(3)}</p>
          </Card>
        </div>

        {/* orders table */}
        <Card className="bg-white border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total (Your Items)</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => {
                const sellerItems = getSellerItems(order);
                const sellerTotal = sellerItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                );
                const currentItemStatus = sellerItems[0]?.itemStatus || 'Pending';

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-['Roboto_Mono'] text-xs">
                      {order.id}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{getStatusBadge(getSellerOrderStatus(order))}</TableCell>
                    <TableCell className="font-['Roboto_Mono']">
                      BD {sellerTotal.toFixed(3)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View details"
                          onClick={() => handleViewOrderDetails(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* same status progression as dashboard */}
                        {sellerItems.length > 0 && (
                          <>
                            {currentItemStatus === 'Pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs bg-blue-50 hover:bg-blue-100"
                                onClick={() =>
                                  sellerItems.forEach(item =>
                                    handleUpdateItemStatus(order.id, item.productId, 'Confirmed')
                                  )
                                }
                              >
                                Confirm Items
                              </Button>
                            )}
                            {currentItemStatus === 'Confirmed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs bg-purple-50 hover:bg-purple-100"
                                onClick={() =>
                                  sellerItems.forEach(item =>
                                    handleUpdateItemStatus(order.id, item.productId, 'Being Prepared')
                                  )
                                }
                              >
                                Start Preparing
                              </Button>
                            )}
                            {currentItemStatus === 'Being Prepared' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs bg-green-50 hover:bg-green-100"
                                onClick={() =>
                                  sellerItems.forEach(item =>
                                    handleUpdateItemStatus(order.id, item.productId, 'Shipped')
                                  )
                                }
                              >
                                Mark Shipped
                              </Button>
                            )}
                            {currentItemStatus === 'Shipped' && (
                              <span className="text-xs text-green-600 font-medium">
                                Items Shipped ✓
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {orders.length === 0 && (
            <div className="text-center py-10 text-foreground/70">
              <TrendingUp className="w-10 h-10 mx-auto mb-4 opacity-50" />
              <p>No orders yet. When customers buy your products, they will appear here.</p>
            </div>
          )}
        </Card>

        {/* order details dialog */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-['Poppins']">Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-['Roboto_Mono'] text-lg">{selectedOrder.id}</p>
                    <p className="text-sm text-foreground/70">
                      Customer: {selectedOrder.customerName}
                    </p>
                    <p className="text-sm text-foreground/70">
                      Date:{' '}
                      {new Date(selectedOrder.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(getSellerOrderStatus(selectedOrder))}
                  </div>
                </div>

                {selectedOrder.shippingAddress && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Shipping Address:</p>
                    <p className="text-sm text-foreground/70">
                      {selectedOrder.shippingAddress}
                    </p>
                  </div>
                )}

                <div>
                  <p className="font-medium mb-3">Your Items in this Order:</p>
                  <div className="space-y-2">
                    {getSellerItems(selectedOrder).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-foreground/70">
                            Qty: {item.quantity} · BD {item.price.toFixed(3)} each
                          </p>
                          {item.itemStatus && (
                            <Badge className="mt-1 text-xs bg-yellow-100 text-yellow-800">
                              {item.itemStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="font-['Poppins']">
                          BD {(item.price * item.quantity).toFixed(3)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setShowOrderDetails(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
