import { useState, useEffect } from 'react';
import { Star, MapPin, Mail, Phone, Package, User, Edit, Save, X, ArrowLeft, Calendar, Truck } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ImageWithFallback } from './figma/ImageWithFallback';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface CustomerProfileProps {
  currentUser?: { id: string; name: string; role: 'customer' | 'seller'; email: string } | null;
  onNavigate: (page: string, idOrParam?: string) => void;
}


interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    sellerName?: string;
    sellerId?: string;
    itemStatus?: string; // Individual item status
  }[];
  customerName: string;
  shippingAddress?: string;
  sellerStatuses?: {
    sellerId: string;
    sellerName: string;
    items: any[];
    sellerOrderStatus: string;
  }[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinDate: string;
}

export function CustomerProfile({ currentUser, onNavigate }: CustomerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh when needed
  
  const [profileData, setProfileData] = useState<UserProfile>({
    id: currentUser?.id || '',
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    joinDate: ''
  });
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Function to refresh orders
  const refreshOrders = () => {
    console.log('🔄 Manual refresh triggered...');
    setRefreshKey(prev => prev + 1);
  };

  // Load user profile and orders from database
  useEffect(() => {
    async function loadUserData() {
      if (!currentUser?.id) {
        console.log('No current user ID, skipping data load');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Loading data for user:', currentUser.id);
        console.log('API Base URL:', API_BASE_URL);

        // Fetch user profile (only on initial load, not on refresh)
        if (refreshKey === 0) {
          const profileUrl = `${API_BASE_URL}/api/users/${currentUser.id}`;
          console.log('Fetching profile from:', profileUrl);
          
          const profileRes = await fetch(profileUrl);
          console.log('Profile response status:', profileRes.status);
          
          if (profileRes.ok) {
            const profile = await profileRes.json();
            console.log('Profile data received:', profile);
            
            setProfileData({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone || '',
              joinDate: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              }) : 'Recently'
            });
          } else {
            console.log('Profile fetch failed, using current user data');
            // Use current user data as fallback
            setProfileData(prev => ({
              ...prev,
              name: currentUser.name,
              email: currentUser.email
            }));
          }
        }

        // Always fetch fresh orders (including on refresh)
        const ordersUrl = `${API_BASE_URL}/api/users/${currentUser.id}/orders?timestamp=${Date.now()}`;        console.log('🔄 Fetching fresh orders from:', ordersUrl);
        
        const ordersRes = await fetch(ordersUrl, {
          cache: 'no-cache', // Force fresh data
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        console.log('Orders response status:', ordersRes.status);
        
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          console.log('📦 Raw orders data received:', ordersData);
          
          // Process orders to add seller names - item statuses come directly from DB
          const processedOrders = await Promise.all(
            ordersData.map(async (order: any) => {
              console.log(`🔄 Processing order ${order.id} with status: ${order.status}`);
              console.log(`Items in order:`, order.items.map((item: any) => ({
                product: item.productName,
                status: item.itemStatus
              })));
              
              const processedItems = await Promise.all(
                order.items.map(async (item: any) => {
                  console.log(`📦 Processing item ${item.productName} with status: ${item.itemStatus}`);
                  
                  let sellerName = 'Unknown Seller';
                  let sellerId = null;
                  
                  try {
                    // Fetch product details to get seller info
                    const productRes = await fetch(`${API_BASE_URL}/api/products/${item.productId}`);
                    if (productRes.ok) {
                      const product = await productRes.json();
                      sellerName = product.sellerName || 'Unknown Seller';
                      sellerId = product.sellerId;
                    }
                  } catch (err) {
                    console.warn('Failed to fetch seller for product:', item.productId);
                  }
                  
                  const processedItem = {
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price,
                    sellerName: sellerName,
                    sellerId: sellerId, // Add seller ID
                    itemStatus: item.itemStatus || 'Pending' // Keep individual item status for reference
                  };
                  
                  console.log('✅ Processed item:', processedItem);
                  return processedItem;
                })
              );
              
              // Now fetch seller-specific order statuses
              const sellerGroups = processedItems.reduce((acc, item) => {
                if (item.sellerId) {
                  if (!acc[item.sellerId]) {
                    acc[item.sellerId] = {
                      sellerId: item.sellerId,
                      sellerName: item.sellerName,
                      items: [],
                      sellerOrderStatus: 'Pending' // Default
                    };
                  }
                  acc[item.sellerId].items.push(item);
                }
                return acc;
              }, {} as Record<string, any>);
              
              // Fetch seller-specific order status for each seller
              for (const sellerId of Object.keys(sellerGroups)) {
                try {
                  const sellerOrdersRes = await fetch(`${API_BASE_URL}/api/sellers/${sellerId}/orders`);
                  if (sellerOrdersRes.ok) {
                    const sellerOrders = await sellerOrdersRes.json();
                    // Find this specific order in seller's orders
                    const sellerOrder = sellerOrders.find((so: any) => so.id === order.id);
                    if (sellerOrder) {
                      // Use the seller's view of this order status
                      sellerGroups[sellerId].sellerOrderStatus = sellerOrder.status;
                      console.log(`✅ Found seller order status for ${sellerId}: ${sellerOrder.status}`);
                    } else {
                      // Fallback 1: Use main order status if seller-specific order not found
                      console.log(`⚠️ Seller order not found for ${sellerId}, using main order status: ${order.status}`);
                      sellerGroups[sellerId].sellerOrderStatus = order.status;
                    }
                  } else {
                    // Fallback 2: Use main order status if API call fails
                    console.log(`⚠️ Failed to fetch seller orders for ${sellerId} (${sellerOrdersRes.status}), using main order status: ${order.status}`);
                    sellerGroups[sellerId].sellerOrderStatus = order.status;
                  }
                } catch (err) {
                  console.warn('Failed to fetch seller order status for seller:', sellerId, err);
                  // Fallback 3: Use main order status if there's a network error
                  sellerGroups[sellerId].sellerOrderStatus = order.status;
                }
              }
              
              const processedOrder = {
                ...order,
                items: processedItems,
                sellerStatuses: Object.values(sellerGroups) // Add seller-specific statuses
              };
              
              console.log(`✅ Processed order ${order.id} with overall status: ${order.status}`);
              return processedOrder;
            })
          );
          
          console.log('✅ Processed orders with seller info and live statuses:', processedOrders);
          setOrders(processedOrders);
          setLastRefresh(new Date());
          console.log('🕐 Orders updated at:', new Date().toLocaleTimeString());
        } else {
          console.log('Orders fetch failed, using empty array');
          setOrders([]);
        }

      } catch (err: any) {
        console.error('Error loading user data:', err);
        setError('Failed to load profile data');
        // Use current user data as fallback
        setProfileData(prev => ({
          ...prev,
          name: currentUser.name,
          email: currentUser.email
        }));
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [currentUser?.id, refreshKey]); // Added refreshKey for force refresh

  // Auto-refresh orders every 30 seconds to get latest status updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing orders...');
      setRefreshKey(prev => prev + 1);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentUser?.id]);

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
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    );
  };

  // FIXED: Order status logic that considers seller-specific statuses
  const getOrderStatusSummary = (order: Order) => {
    // If we have seller-specific statuses, use them
    if (order.sellerStatuses && order.sellerStatuses.length > 0) {
      const sellerStatuses = order.sellerStatuses.map(s => s.sellerOrderStatus);
      const uniqueSellerStatuses = [...new Set(sellerStatuses)];
      
      // If all sellers have the same status
      if (uniqueSellerStatuses.length === 1) {
        return uniqueSellerStatuses[0];
      }
      
      // Mixed seller statuses
      return `Mixed (${uniqueSellerStatuses.join(', ')})`;
    }
    
    // Fallback to order status
    return order.status;
  };

  const getDetailedOrderBadge = (order: Order) => {
    const summary = getOrderStatusSummary(order);
    const isMixed = summary.includes('Mixed');
    
    if (isMixed) {
      return (
        <div className="flex gap-2 items-center">
          {getStatusBadge(order.status)}
          <Badge className="bg-orange-100 text-orange-800 border-0 text-xs" title={summary}>
            Mixed Sellers
          </Badge>
        </div>
      );
    }
    
    return getStatusBadge(summary);
  };

  const getItemStatusBadge = (status: string) => {
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

  const handleSaveProfile = async () => {
    if (!currentUser?.id) {
      console.error('No current user ID available');
      setError('Unable to save: No user ID available');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData = {
        name: profileData.name,
        email: profileData.email,
        ...(profileData.phone && { phone: profileData.phone })
      };

      const updateUrl = `${API_BASE_URL}/api/users/${currentUser.id}`;
      
      console.log('=== SAVE PROFILE DEBUG ===');
      console.log('User ID:', currentUser.id);
      console.log('Update URL:', updateUrl);
      console.log('Update data:', updateData);
      console.log('API Base URL:', API_BASE_URL);

      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch {
          errorText = `HTTP ${response.status}`;
        }
        console.error('Response error:', errorText);
        throw new Error(`Failed to update profile: ${response.status} - ${errorText}`);
      }

      let updatedProfile;
      try {
        updatedProfile = await response.json();
        console.log('Updated profile received:', updatedProfile);
      } catch {
        console.log('No JSON response, assuming success');
        updatedProfile = updateData; // Use sent data as fallback
      }
      
      // Update local state with response
      setProfileData(prev => ({
        ...prev,
        name: updatedProfile.name || updateData.name,
        email: updatedProfile.email || updateData.email,
        phone: updatedProfile.phone || updateData.phone || ''
      }));

      setIsEditing(false);
      console.log('Profile updated successfully!');

    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(`Failed to save changes: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    console.log('Cancelling edit, reverting changes');
    // Reset to current user data
    if (currentUser) {
      setProfileData(prev => ({
        ...prev,
        name: currentUser.name,
        email: currentUser.email
      }));
    }
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => onNavigate('home')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Card className="p-6 bg-white border border-border">
            <p className="text-center">Loading profile...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-cream py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => onNavigate('home')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
            <p className="text-red-500 text-xs mt-2">
              Check browser console for detailed logs
            </p>
          </Card>
        )}

        {/* Profile Header */}
        <Card className="p-8 bg-white border border-border mb-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="md:col-span-2">
              <div className="flex items-start space-x-6 mb-6">
                <Avatar className="w-24 h-24">
                  {profileData.name ? (
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {profileData.name[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="text-2xl">U</AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h1 className="font-['Poppins'] text-3xl mb-2">{profileData.name}</h1>
                      <Badge className="bg-blue-100 text-blue-800 capitalize mb-3">
                        Customer
                      </Badge>
                    </div>
                    
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSaveProfile} 
                          size="sm"
                          disabled={saving}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="phone">Phone Number (Optional)</Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            placeholder="+973 XXXX XXXX"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-foreground/70">
                        <Mail className="w-5 h-5 text-primary" />
                        <span>{profileData.email}</span>
                      </div>
                      {profileData.phone && (
                        <div className="flex items-center space-x-3 text-foreground/70">
                          <Phone className="w-5 h-5 text-primary" />
                          <span>{profileData.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground/70">Total Orders</p>
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <p className="font-['Poppins'] text-3xl text-primary mb-1">{orders.length}</p>
                <p className="text-sm text-foreground/70">All Time</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-golden-harvest/10 to-golden-harvest/5 border-golden-harvest/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground/70">Total Spent</p>
                  <Star className="w-5 h-5 text-golden-harvest" />
                </div>
                <p className="font-['Poppins'] text-3xl text-golden-harvest mb-1">
                  BD {orders.reduce((sum, order) => sum + order.total, 0).toFixed(3)}
                </p>
                <p className="text-sm text-foreground/70">All Time</p>
              </Card>

              <Card className="p-4 bg-soft-cream border-primary/20">
                <p className="text-sm text-foreground/80">
                  <strong>Member since:</strong> {profileData.joinDate}
                </p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="orders">
              My Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="profile">
              Profile Settings
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Poppins'] text-2xl mb-1">Order History</h2>
                <p className="text-foreground/70">Track your orders and view purchase history</p>
              </div>
              <div className="text-right">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshOrders}
                  disabled={loading}
                  className="mb-2"
                >
                  <Package className="w-4 h-4 mr-2" />
                  {loading ? 'Loading...' : 'Refresh Orders'}
                </Button>
                {lastRefresh && (
                  <p className="text-xs text-foreground/60">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="p-6 bg-white border border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-['Lato'] text-lg">{order.id}</h3>
                          {/* Show primary order status */}
                          {getDetailedOrderBadge(order)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-foreground/70">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(order.date).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Package className="w-4 h-4" />
                            <span>{order.items.length} items</span>
                          </div>
                        </div>
                        {/* Seller order status summary */}
                        {order.sellerStatuses && order.sellerStatuses.length > 1 && (
                          <div className="mt-2">
                            <p className="text-xs text-foreground/60 mb-1">Order Status by Seller:</p>
                            <div className="flex flex-wrap gap-1">
                              {order.sellerStatuses.map((sellerStatus) => (
                                <span key={sellerStatus.sellerId} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                                  {sellerStatus.sellerName}: {sellerStatus.items.length} item{sellerStatus.items.length > 1 ? 's' : ''} - {sellerStatus.sellerOrderStatus}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-['Poppins'] text-xl text-primary">
                          BD {order.total.toFixed(3)}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{item.productName}</p>
                              {/* Show actual itemStatus from database */}
                              {(() => {
                                // Prioritize individual item status from database
                                if (item.itemStatus) {
                                  return getItemStatusBadge(item.itemStatus);
                                }
                                // Fallback: Try to get seller-specific status
                                if (order.sellerStatuses) {
                                  const sellerStatus = order.sellerStatuses.find(s => s.sellerId === item.sellerId);
                                  if (sellerStatus && sellerStatus.sellerOrderStatus) {
                                    return getItemStatusBadge(sellerStatus.sellerOrderStatus);
                                  }
                                }
                                // Final fallback: Use main order status
                                return getItemStatusBadge(order.status);
                              })()}
                            </div>
                            <p className="text-foreground/70 text-sm">by {item.sellerName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">Qty: {item.quantity}</p>
                            <p className="font-medium">BD {(item.price * item.quantity).toFixed(3)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-4">
  <Button
    variant="outline"
    size="sm"
    onClick={() => onNavigate('order-details', order.id)}
  >
    View Details
  </Button>
  {order.status === 'Delivered' && (
    <Button variant="ghost" size="sm">
      <Star className="w-4 h-4 mr-1" />
      Write Review
    </Button>
  )}
</div>

                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center bg-white border border-border">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-['Poppins'] text-xl mb-2">No Orders Yet</h3>
                <p className="text-foreground/70 mb-4">You haven't placed any orders yet. Start shopping to support local businesses!</p>
                <Button onClick={() => onNavigate('products')}>
                  Browse Marketplace
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div>
              <h2 className="font-['Poppins'] text-2xl mb-1">Profile Settings</h2>
              <p className="text-foreground/70">Manage your account information and preferences</p>
            </div>

            <Card className="p-6 bg-white border border-border">
              <h3 className="font-['Lato'] text-lg mb-4">Account Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input
                      id="profile-name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="profile-phone">Phone Number (Optional)</Label>
                    <Input
                      id="profile-phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+973 XXXX XXXX"
                    />
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}