import { useState } from 'react';
import { Star, MapPin, Mail, Phone, Package, Upload, Edit, Save, X, ArrowLeft, TrendingUp, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SellerProfileProps {
  currentUser?: { id: string; name: string; role: 'customer' | 'seller'; email: string } | null;
  onNavigate: (page: string) => void;
}

export function SellerProfile({ currentUser, onNavigate }: SellerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "Ahmed's Fresh Farm",
    email: currentUser?.email || 'ahmed@freshfarm.bh',
    phone: '+973 3333 5678',
    address: 'Farm Road 789, Sitra, Bahrain',
    description: 'Family-owned farm providing fresh, organic produce grown with traditional methods and modern sustainability practices.',
    type: 'Farmer',
    joinDate: 'January 2024',
    image: '',
  });

  // Mock seller statistics
  const sellerStats = {
    totalSales: 156,
    totalRevenue: 12450.500,
    activeProducts: 12,
    avgRating: 4.8,
    responseRate: 98,
    reviews: 47
  };

  // Mock recent orders for seller
  const recentOrders = [
    {
      id: 'ORD-2024-045',
      date: '2024-11-20',
      customer: 'Sara Al-Khalifa',
      products: ['Fresh Organic Tomatoes', 'Mixed Vegetables'],
      total: 28.750,
      status: 'completed'
    },
    {
      id: 'ORD-2024-044',
      date: '2024-11-19',
      customer: 'Mohammed Hassan',
      products: ['Organic Lettuce', 'Fresh Herbs'],
      total: 15.500,
      status: 'shipped'
    },
    {
      id: 'ORD-2024-043',
      date: '2024-11-18',
      customer: 'Fatima Ahmed',
      products: ['Premium Dates', 'Organic Cucumbers'],
      total: 42.250,
      status: 'processing'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      shipped: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Shipped' },
      processing: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Processing' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing;
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const handleSaveProfile = () => {
    // Here you would typically save to your backend
    console.log('Saving seller profile:', profileData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    // Reset to original data
    setProfileData({
      name: currentUser?.name || "Ahmed's Fresh Farm",
      email: currentUser?.email || 'ahmed@freshfarm.bh',
      phone: '+973 3333 5678',
      address: 'Farm Road 789, Sitra, Bahrain',
      description: 'Family-owned farm providing fresh, organic produce grown with traditional methods and modern sustainability practices.',
      type: 'Farmer',
      joinDate: 'January 2024',
      image: '',
    });
    setIsEditing(false);
  };

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

        {/* Seller Header */}
        <Card className="p-8 bg-white border border-border mb-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Seller Info */}
            <div className="md:col-span-2">
              <div className="flex items-start space-x-6 mb-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <ImageWithFallback
                      src={profileData.image}
                      alt={profileData.name}
                      className="w-full h-full object-cover"
                    />
                    <AvatarFallback className="text-2xl">{profileData.name[0]}</AvatarFallback>
                  </Avatar>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h1 className="font-['Poppins'] text-3xl mb-2">{profileData.name}</h1>
                      <Badge className="bg-secondary text-secondary-foreground capitalize mb-3">
                        {profileData.type}
                      </Badge>
                    </div>
                    
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleSaveProfile} size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${
                            i < Math.floor(sellerStats.avgRating) 
                              ? 'fill-golden-harvest text-golden-harvest' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="font-['Lato']">{sellerStats.avgRating}</span>
                    <span className="text-muted-foreground">({sellerStats.reviews} reviews)</span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Business Name</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Business Type</Label>
                          <Input
                            id="type"
                            value={profileData.type}
                            onChange={(e) => setProfileData({ ...profileData, type: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Contact Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Contact Phone</Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="address">Business Address</Label>
                          <Input
                            id="address"
                            value={profileData.address}
                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="description">Business Description</Label>
                          <Textarea
                            id="description"
                            value={profileData.description}
                            onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-foreground/80 leading-relaxed mb-6">
                        {profileData.description}
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 text-foreground/70">
                          <Mail className="w-5 h-5 text-primary" />
                          <span>{profileData.email}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-foreground/70">
                          <Phone className="w-5 h-5 text-primary" />
                          <span>{profileData.phone}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-foreground/70">
                          <MapPin className="w-5 h-5 text-primary" />
                          <span>{profileData.address}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground/70">Total Sales</p>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <p className="font-['Poppins'] text-3xl text-primary mb-1">{sellerStats.totalSales}</p>
                <p className="text-sm text-foreground/70">Completed Orders</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-golden-harvest/10 to-golden-harvest/5 border-golden-harvest/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground/70">Revenue</p>
                  <Package className="w-5 h-5 text-golden-harvest" />
                </div>
                <p className="font-['Poppins'] text-3xl text-golden-harvest mb-1">
                  BD {sellerStats.totalRevenue.toFixed(3)}
                </p>
                <p className="text-sm text-foreground/70">This Year</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-olive-green/10 to-olive-green/5 border-olive-green/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground/70">Response Rate</p>
                  <Award className="w-5 h-5 text-olive-green" />
                </div>
                <p className="font-['Poppins'] text-3xl text-olive-green mb-1">{sellerStats.responseRate}%</p>
                <p className="text-sm text-foreground/70">Within 24 hours</p>
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
              Recent Orders ({recentOrders.length})
            </TabsTrigger>
            <TabsTrigger value="profile">
              Profile Settings
            </TabsTrigger>
          </TabsList>

          {/* Recent Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Poppins'] text-2xl mb-1">Recent Orders</h2>
                <p className="text-foreground/70">Track customer orders and manage fulfillment</p>
              </div>
              <Button onClick={() => onNavigate('seller-dashboard')}>
                View Dashboard
              </Button>
            </div>

            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <Card key={order.id} className="p-6 bg-white border border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-['Lato'] text-lg">{order.id}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-foreground/70 mb-1">Customer: {order.customer}</p>
                        <p className="text-sm text-foreground/70">{order.products.join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-['Poppins'] text-xl text-primary">
                          BD {order.total.toFixed(3)}
                        </p>
                        <p className="text-sm text-foreground/70">
                          {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {order.status === 'processing' && (
                        <Button size="sm">
                          Update Status
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center bg-white border border-border">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-['Poppins'] text-xl mb-2">No Recent Orders</h3>
                <p className="text-foreground/70">New orders will appear here when customers make purchases.</p>
              </Card>
            )}
          </TabsContent>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div>
              <h2 className="font-['Poppins'] text-2xl mb-1">Profile Settings</h2>
              <p className="text-foreground/70">Update your business information and profile</p>
            </div>

            <Card className="p-6 bg-white border border-border">
              <h3 className="font-['Lato'] text-lg mb-4">Business Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profile-name">Business Name</Label>
                    <Input
                      id="profile-name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-type">Business Type</Label>
                    <Input
                      id="profile-type"
                      value={profileData.type}
                      onChange={(e) => setProfileData({ ...profileData, type: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-email">Contact Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-phone">Contact Phone</Label>
                    <Input
                      id="profile-phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="profile-address">Business Address</Label>
                    <Input
                      id="profile-address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="profile-description">Business Description</Label>
                    <Textarea
                      id="profile-description"
                      value={profileData.description}
                      onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                      rows={4}
                      placeholder="Tell customers about your business, products, and what makes you special..."
                    />
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>

            {/* Public Profile Preview */}
            <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/30 border-primary/20">
              <div className="text-center">
                <h3 className="font-['Poppins'] text-xl mb-3">Public Profile Preview</h3>
                <p className="text-foreground/70 mb-6">
                  This is how your business profile appears to customers visiting your seller page.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => onNavigate('seller-profile')}
                >
                  View Public Profile
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}