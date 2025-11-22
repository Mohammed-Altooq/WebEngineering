import { useState, useEffect } from 'react';
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
import { ProductCard } from './ProductCard';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface SellerProfileProps {
  currentUser?: { id: string; name: string; role: 'customer' | 'seller'; email: string } | null;
  onNavigate: (page: string) => void;
  onAddToCart?: (product: any) => void;
}

export function SellerProfile({ currentUser, onNavigate, onAddToCart }: SellerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sellerData, setSellerData] = useState<any>(null);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [originalProfileData, setOriginalProfileData] = useState<any>(null);
  const [imageUpdateKey, setImageUpdateKey] = useState(0); // Add this to force image refresh
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    type: '',
    joinDate: '',
    image: '',
  });

  // Fetch seller data, products, and orders
  useEffect(() => {
    const fetchSellerData = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Find seller by matching email with contactEmail
        const sellersResponse = await fetch(`${API_BASE_URL}/api/sellers`);
        if (!sellersResponse.ok) throw new Error('Failed to fetch sellers');
        
        const allSellers = await sellersResponse.json();
        const currentSeller = allSellers.find((s: any) => s.contactEmail === currentUser.email);
        
        if (!currentSeller) {
          console.log('Seller profile not found');
          setLoading(false);
          return;
        }

        setSellerData(currentSeller);
        
        // Set profile data from seller
        const profileInfo = {
          name: currentSeller.name || currentUser.name || '',
          email: currentSeller.contactEmail || currentUser.email || '',
          phone: currentSeller.contactPhone || '',
          address: currentSeller.location || '',
          description: currentSeller.description || '',
          type: currentSeller.type || '',
          joinDate: 'January 2024',
          image: currentSeller.image || '',
        };
        
        setProfileData(profileInfo);
        setOriginalProfileData(profileInfo);

        // Fetch products for this seller
        const productsResponse = await fetch(`${API_BASE_URL}/api/sellers/${currentSeller.id}/products`);
        if (productsResponse.ok) {
          const products = await productsResponse.json();
          setSellerProducts(products);
        }

        // Fetch orders
        const ordersResponse = await fetch(`${API_BASE_URL}/api/orders/user/${currentUser.id}`);
        if (ordersResponse.ok) {
          const orders = await ordersResponse.json();
          setSellerOrders(orders);
        }

      } catch (err) {
        console.error('Error fetching seller data:', err);
        toast.error('Failed to load seller data');
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [currentUser]);

  // Handle image upload for profile settings
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setProfileData(prev => ({ ...prev, image: base64 }));
        toast.success('Image selected! Save your profile to update.');
      };
      reader.onerror = () => {
        toast.error('Failed to process image');
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
    }
  };

  const handleSaveProfile = async () => {
    if (!sellerData?.id) {
      toast.error('Seller data not found');
      return;
    }

    try {
      setSaving(true);

      console.log('Saving profile data:', profileData);

      // Update seller profile
      const sellerUpdateData = {
        name: profileData.name,
        contactEmail: profileData.email,
        contactPhone: profileData.phone,
        location: profileData.address,
        description: profileData.description,
        type: profileData.type,
        image: profileData.image,
      };

      console.log('Sending seller update:', sellerUpdateData);

      const sellerResponse = await fetch(`${API_BASE_URL}/api/sellers/${sellerData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sellerUpdateData),
      });

      if (!sellerResponse.ok) {
        const errorText = await sellerResponse.text();
        console.error('Seller update failed:', errorText);
        throw new Error('Failed to update seller profile');
      }

      // Update user profile
      const userUpdateData = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      };

      console.log('Sending user update:', userUpdateData);

      const userResponse = await fetch(`${API_BASE_URL}/api/users/${currentUser?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userUpdateData),
      });

      if (!userResponse.ok) {
        console.warn('Failed to update user profile, but seller profile was updated');
      }

      // Update local state with the latest data
      const updatedSeller = await sellerResponse.json();
      console.log('Updated seller data:', updatedSeller);
      
      setSellerData(updatedSeller);
      
      // Update the profile data to reflect the saved changes
      const updatedProfileData = {
        ...profileData,
        image: updatedSeller.image || profileData.image
      };
      
      setProfileData(updatedProfileData);
      setOriginalProfileData(updatedProfileData);
      
      // Force image refresh by updating the key
      setImageUpdateKey(prev => prev + 1);
      
      setIsEditing(false);
      
      toast.success('Profile updated successfully!');

    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original data
    if (originalProfileData) {
      setProfileData({ ...originalProfileData });
    }
    setIsEditing(false);
  };

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

  // Calculate dynamic stats from actual data
  const sellerStats = {
    totalSales: sellerOrders.length,
    totalRevenue: sellerOrders.reduce((sum, order) => sum + order.total, 0),
    activeProducts: sellerProducts.length,
    avgRating: sellerData?.rating || 0,
    responseRate: 98,
    reviews: 0
  };

  // Same logic as HomePage for cart functionality
  const canAddToCart = currentUser && currentUser.role === 'customer';
  const isSeller = currentUser?.role === 'seller';

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p>Loading seller profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!sellerData) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">Seller profile not found</p>
              <Button onClick={() => onNavigate('home')}>Back to Home</Button>
            </div>
          </div>
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

        {/* Seller Header */}
        <Card className="p-8 bg-white border border-border mb-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Seller Info */}
            <div className="md:col-span-2">
              <div className="flex items-start space-x-6 mb-6">
                <div className="relative">
  <Avatar className="w-24 h-24" key={imageUpdateKey}>
    {profileData.image ? (
      <img 
        src={profileData.image} 
        alt={profileData.name}
        className="w-full h-full object-cover rounded-full"
        onError={(e) => {
          // Hide the image if it fails to load
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    ) : (
      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
        {profileData.name[0]?.toUpperCase() || 'U'}
      </AvatarFallback>
    )}
  </Avatar>
</div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h1 className="font-['Poppins'] text-3xl mb-2">{profileData.name}</h1>
                      <Badge className="bg-secondary text-secondary-foreground capitalize mb-3">
                        {profileData.type}
                      </Badge>
                    </div>
                    
                    {currentUser?.role === 'seller' && !isEditing ? (
                      <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : currentUser?.role === 'seller' && isEditing ? (
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSaveProfile} 
                          size="sm"
                          disabled={saving}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button 
                          onClick={handleCancelEdit} 
                          variant="outline" 
                          size="sm"
                          disabled={saving}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    ) : null}
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

                  {isEditing && currentUser?.role === 'seller' ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Business Name</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Business Type</Label>
                          <Input
                            id="type"
                            value={profileData.type}
                            onChange={(e) => setProfileData({ ...profileData, type: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Contact Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Contact Phone</Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="address">Business Address</Label>
                          <Input
                            id="address"
                            value={profileData.address}
                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="description">Business Description</Label>
                          <Textarea
                            id="description"
                            value={profileData.description}
                            onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                            rows={4}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-foreground/80 leading-relaxed mb-6">
                        {profileData.description || 'No description available.'}
                      </p>

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
                        {profileData.address && (
                          <div className="flex items-center space-x-3 text-foreground/70">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span>{profileData.address}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats - keeping the rest the same */}
            <div className="space-y-4">
              

              <Card className="p-6 bg-gradient-to-br from-olive-green/10 to-olive-green/5 border-olive-green/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground/70">Products</p>
                  <Award className="w-5 h-5 text-olive-green" />
                </div>
                <p className="font-['Poppins'] text-3xl text-olive-green mb-1">{sellerStats.activeProducts}</p>
                <p className="text-sm text-foreground/70">Active Listings</p>
              </Card>

              <Card className="p-4 bg-soft-cream border-primary/20">
                <p className="text-sm text-foreground/80">
                  <strong>Member since:</strong> {profileData.joinDate}
                </p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Products by Seller Section */}
        <section className="py-16 px-4 bg-soft-cream mb-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="flex justify-between items-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
             
              
            </motion.div>

            
          </div>
        </section>

        {/* Tabs Section */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            
            <TabsTrigger value="profile">
              Profile Settings
            </TabsTrigger>
          </TabsList>

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
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-type">Business Type</Label>
                    <Input
                      id="profile-type"
                      value={profileData.type}
                      onChange={(e) => setProfileData({ ...profileData, type: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-email">Contact Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-phone">Contact Phone</Label>
                    <Input
                      id="profile-phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="profile-address">Business Address</Label>
                    <Input
                      id="profile-address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      disabled={saving}
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
                      disabled={saving}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="profile-image">Profile Image</Label>
                    <div className="space-y-3">
                      <Input
                        id="profile-image-url"
                        value={profileData.image}
                        onChange={(e) => setProfileData({ ...profileData, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        disabled={saving}
                      />
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Or upload an image:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload">
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm"
                              disabled={saving}
                              asChild
                            >
                              <span className="cursor-pointer">
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File
                              </span>
                            </Button>
                          </label>
                        </div>
                      </div>
                      {profileData.image && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <img 
                            src={profileData.image} 
                            alt="Preview" 
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="text-sm text-green-600">Image ready to save</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    disabled={saving}
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