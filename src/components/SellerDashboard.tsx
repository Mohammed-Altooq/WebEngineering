import { useState } from 'react';
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
import { sellers, products, orders } from '../lib/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SellerDashboardProps {
  onNavigate: (page: string) => void;
}

export function SellerDashboard({ onNavigate }: SellerDashboardProps) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const seller = sellers[0]; // Simulating logged-in seller
  const sellerProducts = products.filter(p => p.sellerId === seller.id);
  const sellerOrders = orders.filter(o => 
    o.items.some(item => sellerProducts.some(p => p.id === item.productId))
  );

  // Mock sales data
  const salesData = [
    { month: 'Oct', sales: 45 },
    { month: 'Nov', sales: 67 },
    { month: 'Dec', sales: 89 },
    { month: 'Jan', sales: 102 },
    { month: 'Feb', sales: 156 }
  ];

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
              <p className="text-sm text-foreground/70">Total Sales</p>
              <div className="bg-primary/10 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="font-['Poppins'] text-3xl text-foreground">$2,845</p>
            <p className="text-sm text-olive-green mt-1">+12% from last month</p>
          </Card>

          <Card className="p-6 bg-white border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground/70">Products Listed</p>
              <div className="bg-accent/10 p-2 rounded-lg">
                <Package className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="font-['Poppins'] text-3xl text-foreground">{sellerProducts.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Active listings</p>
          </Card>

          <Card className="p-6 bg-white border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground/70">Orders</p>
              <div className="bg-golden-harvest/10 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-golden-harvest" />
              </div>
            </div>
            <p className="font-['Poppins'] text-3xl text-foreground">{seller.totalSales}</p>
            <p className="text-sm text-olive-green mt-1">23 this month</p>
          </Card>

          <Card className="p-6 bg-white border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground/70">Rating</p>
              <div className="bg-olive-green/10 p-2 rounded-lg">
                <Users className="w-5 h-5 text-olive-green" />
              </div>
            </div>
            <p className="font-['Poppins'] text-3xl text-foreground">{seller.rating}</p>
            <p className="text-sm text-muted-foreground mt-1">Customer rating</p>
          </Card>
        </div>

        {/* Sales Chart */}
        <Card className="p-6 bg-white border border-border mb-8">
          <h2 className="font-['Poppins'] text-xl mb-6">Sales Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9CBA7" />
              <XAxis dataKey="month" stroke="#2E2E2E" />
              <YAxis stroke="#2E2E2E" />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#3D8A4F" 
                strokeWidth={3}
                dot={{ fill: '#3D8A4F', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

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
                  <form className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="productName">Product Name</Label>
                      <Input id="productName" placeholder="e.g., Fresh Organic Tomatoes" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input id="price" type="number" step="0.01" placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input id="stock" type="number" placeholder="0" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select>
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">Product Image URL</Label>
                      <Input id="image" type="url" placeholder="https://..." />
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

            <div className="space-y-4">
              {sellerProducts.map(product => (
                <Card key={product.id} className="p-4 bg-white border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-['Lato'] mb-1">{product.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-foreground/70">
                        <span className="font-['Roboto_Mono']">${product.price.toFixed(2)}</span>
                        <span>Stock: {product.stock}</span>
                        <Badge variant={product.stock > 10 ? 'default' : 'secondary'} className="bg-secondary text-secondary-foreground">
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
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
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellerOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-['Roboto_Mono']">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            order.status === 'Confirmed' ? 'bg-olive-green text-white' :
                            order.status === 'On Delivery' ? 'bg-golden-harvest text-white' :
                            order.status === 'Pending' ? 'bg-secondary text-secondary-foreground' :
                            'bg-primary text-white'
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-['Roboto_Mono']">${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <div className="mt-6">
              <Button variant="outline" className="w-full">
                View All Orders
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
