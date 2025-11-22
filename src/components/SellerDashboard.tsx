import { useState, useEffect, ChangeEvent } from 'react';
import { Plus, Package, TrendingUp, DollarSign, Users, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface SellerDashboardProps {
  onNavigate: (page: string) => void;
  currentUser?: any;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  sellerId: string;
  sellerName: string;
  stock: number;
  rating?: number;
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

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    sellerId?: string; // Added to track which seller this item belongs to
    itemStatus?: string; // Individual item status
    isSellerItem?: boolean; // Flag indicating this item belongs to the current seller
  }>;
  total: number;
  sellerTotal?: number; // Added for seller-specific total
  status: string;
  date: string;
  shippingAddress?: string;
}

export function SellerDashboard({ onNavigate, currentUser }: SellerDashboardProps) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for new product
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    image: '' // can be URL or base64 data URL
  });

  // Form states for editing product
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    image: '' // can be URL or base64 data URL
  });

  // ==== IMAGE HANDLERS (BASE64, NO /api/upload) ====

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file); // -> "data:image/png;base64,...."
    });
  };

  const handleAddProductImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setProductForm(prev => ({ ...prev, image: dataUrl }));
      toast.success('Image attached successfully');
    } catch (err) {
      console.error('Error reading image file:', err);
      toast.error('Failed to read image file');
    }
  };

  const handleEditProductImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditProductForm(prev => ({ ...prev, image: dataUrl }));
      toast.success('Image updated successfully');
    } catch (err) {
      console.error('Error reading image file:', err);
      toast.error('Failed to read image file');
    }
  };

  // Helper function to view order details
  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // ==== ORDER STATUS MANAGEMENT ====

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      setOrders(prev => prev.map(order =>
        order.id === orderId ? updatedOrder : order
      ));

      toast.success('Order status updated successfully!');

    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    }
  };

  const handleUpdateItemStatus = async (orderId: string, productId: string, newItemStatus: string) => {
    if (!seller?.id) {
      toast.error('Seller information not found');
      return;
    }

    console.log('🔄 === UPDATE ITEM STATUS DEBUG ===');
    console.log('Order ID:', orderId);
    console.log('Product ID:', productId);
    console.log('New Status:', newItemStatus);
    console.log('Seller ID:', seller.id);

    try {
      const requestBody = {
        itemStatus: newItemStatus,
        sellerId: seller.id
      };

      console.log('📡 Request body:', requestBody);
      console.log('📡 API URL:', `${API_BASE_URL}/api/orders/${orderId}/items/${productId}/status`);

      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/items/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to update item status: ${errorText}`);
      }

      const updatedOrder = await response.json();
      console.log('✅ Updated order received:', updatedOrder);

      // FIXED: Preserve the original total when updating order
      const originalOrder = orders.find(o => o.id === orderId);
      const preservedOrder: Order = {
        ...updatedOrder,
        total: originalOrder?.total || updatedOrder.total, // Keep original total
        sellerTotal: originalOrder?.sellerTotal || updatedOrder.sellerTotal // Keep original seller total
      };

      console.log('🔒 Preserving original totals:', {
        originalTotal: originalOrder?.total,
        originalSellerTotal: originalOrder?.sellerTotal,
        newTotal: updatedOrder.total,
        preservedTotal: preservedOrder.total
      });

      // Update orders list with the new order data
      setOrders(prev => prev.map(order =>
        order.id === orderId ? preservedOrder : order
      ));

      // Force a UI refresh to make sure buttons update
      setTimeout(() => {
        console.log('🔄 Force refreshing orders...');
        setOrders(prev => [...prev]); // This will trigger a re-render
      }, 100);

      toast.success('Item status updated successfully!');

    } catch (err) {
      console.error('❌ Error updating item status:', err);
      toast.error('Failed to update item status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'Confirmed': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'Being Prepared': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'Ready to Ship': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      'Shipped': { bg: 'bg-green-100', text: 'text-green-800' },
      'Delivered': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      'Completed': { bg: 'bg-green-100', text: 'text-green-800' }, // ✅ derived status
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {status}
      </Badge>
    );
  };

  // ==== FETCH SELLER DATA, PRODUCTS, ORDERS ====

  useEffect(() => {
    const fetchSellerData = async () => {
      if (!currentUser?.id) {
        setError('No user logged in');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Find seller by matching email with contactEmail
        const sellersResponse = await fetch(`${API_BASE_URL}/api/sellers`);
        if (!sellersResponse.ok) throw new Error('Failed to fetch sellers');

        const allSellers = await sellersResponse.json();
        const currentSeller = allSellers.find((s: Seller) => s.contactEmail === currentUser.email);

        if (!currentSeller) {
          throw new Error('Seller profile not found');
        }

        setSeller(currentSeller);
        console.log('✅ Current seller loaded:', currentSeller);

        // Fetch products for this seller
        const productsResponse = await fetch(`${API_BASE_URL}/api/sellers/${currentSeller.id}/products`);
        if (!productsResponse.ok) throw new Error('Failed to fetch products');

        const sellerProducts = await productsResponse.json();
        setProducts(sellerProducts);
        console.log('✅ Seller products loaded:', sellerProducts);

        // Fetch orders for this seller (orders containing their products)
        const ordersResponse = await fetch(`${API_BASE_URL}/api/sellers/${currentSeller.id}/orders`);
        if (ordersResponse.ok) {
          const sellerOrders = await ordersResponse.json();
          console.log('🔍 SELLER ORDERS DEBUG:', sellerOrders);
          console.log('🔍 Sample order items:', sellerOrders[0]?.items);
          console.log('🔍 Product IDs owned by seller:', sellerProducts.map((p: Product) => p.id));

          // Process orders to ensure proper seller item identification
          const processedOrders: Order[] = sellerOrders.map((order: Order) => {
            const updatedItems = order.items.map(item => ({
              ...item,
              // Ensure proper seller identification
              isSellerItem: sellerProducts.some((p: Product) => p.id === item.productId) || item.sellerId === currentSeller.id
            }));

            console.log(`📦 Processed order ${order.id} items:`, updatedItems.map(item => ({
              productId: item.productId,
              isSellerItem: item.isSellerItem,
              itemStatus: item.itemStatus,
              sellerId: item.sellerId
            })));

            return {
              ...order,
              items: updatedItems
            };
          });

          setOrders(processedOrders);
        } else {
          console.warn('Failed to fetch seller orders, setting empty array');
          setOrders([]);
        }

      } catch (err) {
        console.error('Error fetching seller data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load seller data');
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [currentUser]);

  // ==== SELLER ORDER STATUS (BASED ON ITEMS) ====

  const getSellerItems = (order: Order) => {
    if (!seller?.id) return [];
    return order.items.filter(
      (item) => item.isSellerItem || item.sellerId === seller.id
    );
  };

  const getSellerOrderStatus = (order: Order): string => {
    const sellerItems = getSellerItems(order);

    // If somehow no items for this seller, treat as pending
    if (sellerItems.length === 0) return 'Pending';

    const statuses = sellerItems.map((i) => i.itemStatus || 'Pending');

    // ✅ If everything is shipped / delivered → Completed
    if (statuses.every((s) => s === 'Shipped' || s === 'Delivered')) {
      return 'Completed';
    }

    // If anything is being prepared / ready to ship
    if (statuses.some((s) => s === 'Being Prepared' || s === 'Ready to Ship')) {
      return 'Being Prepared';
    }

    // If anything is confirmed
    if (statuses.some((s) => s === 'Confirmed')) {
      return 'Confirmed';
    }

    // If anything is cancelled (and not all completed)
    if (statuses.some((s) => s === 'Cancelled')) {
      return 'Cancelled';
    }

    // Default
    return 'Pending';
  };

  const isSellerOrderCompleted = (order: Order) =>
    getSellerOrderStatus(order) === 'Completed';

  // ==== ADD PRODUCT ====

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!seller) {
      toast.error('Seller information not found');
      return;
    }

    try {
      const productData = {
        name: productForm.name,
        price: parseFloat(productForm.price),
        category: productForm.category,
        description: productForm.description,
        image: productForm.image || '',  // base64 or URL
        sellerId: seller.id,
        sellerName: seller.name,
        stock: parseInt(productForm.stock),
        rating: 0
      };

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const newProduct = await response.json();
      setProducts(prev => [...prev, newProduct]);

      // Reset form
      setProductForm({
        name: '',
        price: '',
        stock: '',
        category: '',
        description: '',
        image: ''
      });

      setShowAddProduct(false);
      toast.success('Product added successfully!');

    } catch (err) {
      console.error('Error adding product:', err);
      toast.error('Failed to add product');
    }
  };

  // ==== EDIT PRODUCT ====

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditProductForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      description: product.description || '',
      image: product.image || ''
    });
    setShowEditProduct(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) {
      toast.error('No product selected for editing');
      return;
    }

    try {
      const productData = {
        name: editProductForm.name,
        price: parseFloat(editProductForm.price),
        category: editProductForm.category,
        description: editProductForm.description,
        image: editProductForm.image || '', // base64 or URL
        stock: parseInt(editProductForm.stock),
      };

      const response = await fetch(`${API_BASE_URL}/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      const updatedProduct = await response.json();
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p));

      // Reset form and close dialog
      setEditProductForm({
        name: '',
        price: '',
        stock: '',
        category: '',
        description: '',
        image: ''
      });
      setEditingProduct(null);
      setShowEditProduct(false);
      toast.success('Product updated successfully!');

    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Failed to update product');
    }
  };

  // ==== DELETE PRODUCT ====

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Product deleted successfully!');

    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Failed to delete product');
    }
  };

  // ==== STATS (BASED ON SELLER ITEM STATUS) ====

  const completedOrders = orders.filter(order => isSellerOrderCompleted(order));
  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + (order.sellerTotal || order.total),
    0
  );

  const totalProducts = products.length;
  const totalOrders = orders.length; // All orders for count
  const completedOrdersCount = completedOrders.length;
  const averageRating = seller?.rating || 0;

  // ==== LOADING / ERROR STATES ====

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p>Seller profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  // ==== MAIN UI ====

  return (
    <div className="min-h-screen bg-soft-cream py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-['Poppins'] text-3xl mb-2">Seller Dashboard</h1>
          <p className="text-foreground/70">Welcome back, {seller.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground/70">Total Revenue</p>
              <div className="bg-primary/10 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="font-['Poppins'] text-3xl text-foreground">BD {totalRevenue.toFixed(3)}</p>
            <p className="text-sm text-olive-green mt-1">From {completedOrdersCount} completed orders</p>
            {/* Pending revenue based on seller item completion */}
            {orders.filter(order => !isSellerOrderCompleted(order)).length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                BD {orders
                  .filter(order => !isSellerOrderCompleted(order))
                  .reduce((sum, order) => sum + (order.sellerTotal || order.total), 0)
                  .toFixed(3)} pending
              </p>
            )}
          </Card>

          <Card className="p-6 bg-white border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground/70">Products Listed</p>
              <div className="bg-accent/10 p-2 rounded-lg">
                <Package className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="font-['Poppins'] text-3xl text-foreground">{totalProducts}</p>
            <p className="text-sm text-muted-foreground mt-1">Active listings</p>
          </Card>

          <Card className="p-6 bg-white border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground/70">Total Orders</p>
              <div className="bg-golden-harvest/10 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-golden-harvest" />
              </div>
            </div>
            <p className="font-['Poppins'] text-3xl text-foreground">{totalOrders}</p>
            <p className="text-sm text-olive-green mt-1">All time</p>
          </Card>

          <Card className="p-6 bg-white border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground/70">Rating</p>
              <div className="bg-olive-green/10 p-2 rounded-lg">
                <Users className="w-5 h-5 text-olive-green" />
              </div>
            </div>
            <p className="font-['Poppins'] text-3xl text-foreground">{averageRating.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground mt-1">Customer rating</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Products Management */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-['Poppins'] text-2xl">My Products</h2>
              <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-['Poppins']">Add New Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="productName">Product Name</Label>
                      <Input
                        id="productName"
                        placeholder="e.g., Fresh Organic Tomatoes"
                        value={productForm.name}
                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (BD)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.001"
                          placeholder="0.000"
                          value={productForm.price}
                          onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input
                          id="stock"
                          type="number"
                          placeholder="0"
                          value={productForm.stock}
                          onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={productForm.category}
                        onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fresh-produce">Fresh Produce</SelectItem>
                          <SelectItem value="handmade-crafts">Handmade Crafts</SelectItem>
                          <SelectItem value="dairy">Dairy Products</SelectItem>
                          <SelectItem value="honey">Honey & Preserves</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your product..."
                        rows={4}
                        value={productForm.description}
                        onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageFile">Product Image</Label>
                      <Input
                        id="imageFile"
                        type="file"
                        accept="image/*"
                        onChange={handleAddProductImageChange}
                      />
                      {productForm.image && (
                        <p className="text-xs text-muted-foreground break-all">
                          Image attached
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowAddProduct(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                        Add Product
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit Product Dialog */}
            <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-['Poppins']">Edit Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateProduct} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="editProductName">Product Name</Label>
                    <Input
                      id="editProductName"
                      placeholder="e.g., Fresh Organic Tomatoes"
                      value={editProductForm.name}
                      onChange={(e) => setEditProductForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editPrice">Price (BD)</Label>
                      <Input
                        id="editPrice"
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        value={editProductForm.price}
                        onChange={(e) => setEditProductForm(prev => ({ ...prev, price: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editStock">Stock Quantity</Label>
                      <Input
                        id="editStock"
                        type="number"
                        placeholder="0"
                        value={editProductForm.stock}
                        onChange={(e) => setEditProductForm(prev => ({ ...prev, stock: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editCategory">Category</Label>
                    <Select
                      value={editProductForm.category}
                      onValueChange={(value) => setEditProductForm(prev => ({ ...prev, category: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fresh-produce">Fresh Produce</SelectItem>
                        <SelectItem value="handmade-crafts">Handmade Crafts</SelectItem>
                        <SelectItem value="dairy">Dairy Products</SelectItem>
                        <SelectItem value="honey">Honey & Preserves</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editDescription">Description</Label>
                    <Textarea
                      id="editDescription"
                      placeholder="Describe your product..."
                      rows={4}
                      value={editProductForm.description}
                      onChange={(e) => setEditProductForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editImageFile">Product Image</Label>
                    <Input
                      id="editImageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleEditProductImageChange}
                    />
                    {editProductForm.image && (
                      <p className="text-xs text-muted-foreground break-all">
                        Image attached
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowEditProduct(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                      Update Product
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Order Details Dialog */}
            <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-['Poppins']">Order Details</DialogTitle>
                </DialogHeader>
                {selectedOrder && (
                  <div className="space-y-4 mt-4">
                    {/* Order Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-['Roboto_Mono'] text-lg">{selectedOrder.id}</p>
                        <p className="text-sm text-foreground/70">Customer: {selectedOrder.customerName}</p>
                        <p className="text-sm text-foreground/70">
                          Date: {new Date(selectedOrder.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(getSellerOrderStatus(selectedOrder))}
                        <p className="font-['Poppins'] text-xl text-primary mt-2">
                          BD {(selectedOrder.sellerTotal || selectedOrder.total).toFixed(3)}
                        </p>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {selectedOrder.shippingAddress && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-1">Shipping Address:</p>
                        <p className="text-sm text-foreground/70">{selectedOrder.shippingAddress}</p>
                      </div>
                    )}

                    {/* Items List */}
                    <div>
                      <p className="font-medium mb-3">Your Items in this Order:</p>
                      <div className="space-y-2">
                        {selectedOrder.items
                          .filter(item => item.isSellerItem) // Only show seller's items
                          .map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{item.productName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-sm text-foreground/70">Qty: {item.quantity}</p>
                                  <p className="text-sm text-foreground/70">Price: BD {item.price.toFixed(3)} each</p>
                                  {item.itemStatus && (
                                    <Badge className={`text-xs ${
                                      item.itemStatus === 'Shipped' ? 'bg-green-100 text-green-800' :
                                      item.itemStatus === 'Being Prepared' ? 'bg-purple-100 text-purple-800' :
                                      item.itemStatus === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {item.itemStatus}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">BD {(item.price * item.quantity).toFixed(3)}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Your Items Total:</p>
                        <p className="font-['Poppins'] text-lg text-primary">
                          BD {selectedOrder.items
                            .filter(item => item.isSellerItem)
                            .reduce((sum, item) => sum + (item.price * item.quantity), 0)
                            .toFixed(3)
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={() => setShowOrderDetails(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Product list */}
            <div className="space-y-4">
              {products.map(product => (
                <Card key={product.id} className="p-4 bg-white border border-border">
                  <div className="flex items-center justify-between gap-4">
                    {/* Optional thumbnail */}
                    {product.image && (
                      <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md border border-border">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-['Lato'] mb-1">{product.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-foreground/70">
                        <span className="font-['Roboto_Mono']">BD {product.price.toFixed(3)}</span>
                        <span>Stock: {product.stock}</span>
                        <Badge variant={product.stock > 10 ? 'default' : 'secondary'} className="bg-secondary text-secondary-foreground">
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {products.length === 0 && (
                <div className="text-center py-8 text-foreground/70">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No products yet. Add your first product to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Orders Management */}
          <div>
            <h2 className="font-['Poppins'] text-2xl mb-6">Recent Orders</h2>
            <Card className="bg-white border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-['Roboto_Mono']">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        {getStatusBadge(getSellerOrderStatus(order))}
                      </TableCell>
                      <TableCell className="font-['Roboto_Mono']">
                        BD {(order.sellerTotal || order.total).toFixed(3)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Details"
                            onClick={() => handleViewOrderDetails(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {/* PROPER E-COMMERCE WORKFLOW: Individual item status progression */}
                          {(() => {
                            // Find items that belong to this seller
                            const sellerItems = order.items.filter(item => item.isSellerItem === true);

                            if (sellerItems.length === 0) return null;

                            // Get the current item status for this seller's items
                            const currentItemStatus = sellerItems[0]?.itemStatus || 'Pending';

                            console.log(`🛍️ Order ${order.id} - Seller Item Status: ${currentItemStatus}`);

                            // ITEM STATUS PROGRESSION LOGIC
                            if (currentItemStatus === 'Pending') {
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    console.log('🔄 Confirming seller items in order:', order.id);
                                    sellerItems.forEach(item => {
                                      handleUpdateItemStatus(order.id, item.productId, 'Confirmed');
                                    });
                                  }}
                                  className="text-xs bg-blue-50 hover:bg-blue-100"
                                >
                                  Confirm Items
                                </Button>
                              );
                            }

                            if (currentItemStatus === 'Confirmed') {
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    console.log('🔄 Preparing seller items in order:', order.id);
                                    sellerItems.forEach(item => {
                                      handleUpdateItemStatus(order.id, item.productId, 'Being Prepared');
                                    });
                                  }}
                                  className="text-xs bg-purple-50 hover:bg-purple-100"
                                >
                                  Start Preparing
                                </Button>
                              );
                            }

                            if (currentItemStatus === 'Being Prepared') {
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    console.log('🔄 Shipping seller items in order:', order.id);
                                    sellerItems.forEach(item => {
                                      handleUpdateItemStatus(order.id, item.productId, 'Shipped');
                                    });
                                  }}
                                  className="text-xs bg-green-50 hover:bg-green-100"
                                >
                                  Mark Items as Shipped
                                </Button>
                              );
                            }

                            if (currentItemStatus === 'Shipped') {
                              return (
                                <span className="text-xs text-green-600 font-medium">
                                  Items Shipped ✓
                                </span>
                              );
                            }

                            // Default fallback for any other status
                            return (
                              <span className="text-xs text-gray-500">
                                {currentItemStatus}
                              </span>
                            );
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {orders.length === 0 && (
                <div className="text-center py-8 text-foreground/70">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No orders yet. Orders will appear here when customers purchase your products.</p>
                </div>
              )}
            </Card>

            {orders.length > 0 && (
              <div className="mt-6">
                <Button variant="outline" className="w-full">
                  View All Orders
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
