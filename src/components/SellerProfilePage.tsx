import { useState, useEffect } from 'react';
import { Star, MapPin, Mail, Phone, Package, Award, TrendingUp, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ProductCard } from './ProductCard';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface SellerProfilePageProps {
  sellerId?: string;
  onNavigate: (page: string, productId?: string) => void;
  onAddToCart: (product: any) => void;
  currentUser?: { id: string; name: string; role: 'customer' | 'seller'; email: string } | null;
}

export function SellerProfilePage({ sellerId, onNavigate, onAddToCart, currentUser }: SellerProfilePageProps) {
  const [seller, setSeller] = useState<any>(null);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSellerData = async () => {
      if (!sellerId) {
        setError('No seller ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch seller details
        const sellerResponse = await fetch(`${API_BASE_URL}/api/sellers/${sellerId}`);
        if (!sellerResponse.ok) throw new Error('Failed to fetch seller');
        
        const sellerData = await sellerResponse.json();
        setSeller(sellerData);

        // Check if current user is this seller - if so, redirect to profile edit page
        if (currentUser?.role === 'seller' && currentUser.email === sellerData.contactEmail) {
          onNavigate('seller-profile-edit');
          return;
        }

        // Fetch products for this seller
        const productsResponse = await fetch(`${API_BASE_URL}/api/sellers/${sellerId}/products`);
        if (productsResponse.ok) {
          const products = await productsResponse.json();
          setSellerProducts(products);
        }

        // Fetch reviews for all products by this seller
        const reviewsPromises = sellerProducts.map(product => 
          fetch(`${API_BASE_URL}/api/products/${product.id}/reviews`)
            .then(res => res.ok ? res.json() : [])
            .catch(() => [])
        );

        const allReviews = await Promise.all(reviewsPromises);
        const flattenedReviews = allReviews.flat();
        setSellerReviews(flattenedReviews);

      } catch (err) {
        console.error('Error fetching seller data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load seller data');
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId, currentUser, onNavigate]);

  // Calculate dynamic stats
  const sellerStats = {
    totalSales: seller?.totalSales || 0,
    activeProducts: sellerProducts.length,
    averageRating: sellerReviews.length > 0 
      ? sellerReviews.reduce((sum, review) => sum + review.rating, 0) / sellerReviews.length 
      : seller?.rating || 0,
    reviewCount: sellerReviews.length,
    responseRate: 98
  };

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

  if (error || !seller) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Seller not found'}</p>
              <Button onClick={() => onNavigate('products')}>Back to Marketplace</Button>
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
          onClick={() => onNavigate('products')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>

        {/* Seller Header */}
        <Card className="p-8 bg-white border border-border mb-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Seller Info */}
            <div className="md:col-span-2">
              <div className="flex items-start space-x-6 mb-6">
                <Avatar className="w-24 h-24">
                  <Avatar className="w-12 h-12">
  {seller.image ? (
    <img 
      src={seller.image} 
      alt={seller.name}
      className="w-full h-full object-cover rounded-full"
      onError={(e) => {
        // Hide the image if it fails to load
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  ) : (
    <AvatarFallback className="bg-primary/10 text-primary">
      {seller.name[0]?.toUpperCase() || 'U'}
    </AvatarFallback>
  )}
</Avatar>
                  <AvatarFallback className="text-2xl">{seller.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h1 className="font-['Poppins'] text-3xl mb-2">{seller.name}</h1>
                      <Badge className="bg-secondary text-secondary-foreground capitalize mb-3">
                        {seller.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${
                            i < Math.floor(sellerStats.averageRating) 
                              ? 'fill-golden-harvest text-golden-harvest' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="font-['Lato']">{sellerStats.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({sellerStats.reviewCount} reviews)</span>
                  </div>

                  <p className="text-foreground/80 leading-relaxed mb-6">
                    {seller.description || 'No description available.'}
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    {seller.location && (
                      <div className="flex items-center space-x-3 text-foreground/70">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span>{seller.location}</span>
                      </div>
                    )}
                    {seller.contactEmail && (
                      <div className="flex items-center space-x-3 text-foreground/70">
                        <Mail className="w-5 h-5 text-primary" />
                        <span>{seller.contactEmail}</span>
                      </div>
                    )}
                    {seller.contactPhone && (
                      <div className="flex items-center space-x-3 text-foreground/70">
                        <Phone className="w-5 h-5 text-primary" />
                        <span>{seller.contactPhone}</span>
                      </div>
                    )}
                  </div>
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
                  <p className="text-sm text-foreground/70">Products</p>
                  <Package className="w-5 h-5 text-golden-harvest" />
                </div>
                <p className="font-['Poppins'] text-3xl text-golden-harvest mb-1">{sellerStats.activeProducts}</p>
                <p className="text-sm text-foreground/70">Active Listings</p>
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
                  <strong>Member since:</strong> January 2024
                </p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products">
              Products ({sellerStats.activeProducts})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({sellerStats.reviewCount})
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Poppins'] text-2xl mb-1">Products by {seller.name}</h2>
                <p className="text-foreground/70">Browse all available products from this seller</p>
              </div>
            </div>

            {sellerProducts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <style>{`
                  .seller-profile-products img {
                    max-height: 200px !important;
                    height: 200px !important;
                    object-fit: cover !important;
                    width: 100% !important;
                  }
                `}</style>
                {sellerProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="seller-profile-products"
                  >
                    <ProductCard
                      product={product}
                      onViewDetails={(id) => onNavigate('product-details', id)}
                      onAddToCart={canAddToCart ? onAddToCart : undefined}
                      onViewSeller={(sellerId) => onNavigate('seller-profile', sellerId)}
                      isLoggedIn={!!currentUser}
                      showAddToCart={!isSeller}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center bg-white border border-border">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-['Poppins'] text-xl mb-2">No Products Available</h3>
                <p className="text-foreground/70">This seller hasn't listed any products yet.</p>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <div>
              <h2 className="font-['Poppins'] text-2xl mb-1">Customer Reviews</h2>
              <p className="text-foreground/70">See what customers are saying about {seller.name}</p>
            </div>

            {sellerReviews.length > 0 ? (
              <>
                {/* Rating Summary */}
                <Card className="p-6 bg-white border border-border">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="text-center">
                      <p className="font-['Poppins'] text-6xl text-primary mb-2">{sellerStats.averageRating.toFixed(1)}</p>
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-6 h-6 ${
                              i < Math.floor(sellerStats.averageRating) 
                                ? 'fill-golden-harvest text-golden-harvest' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <p className="text-foreground/70">Based on {sellerStats.reviewCount} reviews</p>
                    </div>

                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = sellerReviews.filter(r => r.rating === stars).length;
                        const percentage = sellerReviews.length > 0 ? (count / sellerReviews.length) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center space-x-3">
                            <span className="text-sm w-12">{stars} stars</span>
                            <div className="flex-1 bg-secondary/30 rounded-full h-2">
                              <div 
                                className="bg-golden-harvest h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* Reviews List */}
                <div className="space-y-4">
                  {sellerReviews.map((review) => (
                    <Card key={review.id} className="p-6 bg-white border border-border">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-['Lato'] mb-1">{review.customerName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < review.rating 
                                  ? 'fill-golden-harvest text-golden-harvest' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-foreground/80 mb-3">{review.comment}</p>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-12 text-center bg-white border border-border">
                <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-['Poppins'] text-xl mb-2">No Reviews Yet</h3>
                <p className="text-foreground/70">This seller hasn't received any reviews yet.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Additional Info */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-secondary/30 border-primary/20">
          <div className="text-center">
            <h3 className="font-['Poppins'] text-xl mb-3">Support Local Businesses</h3>
            <p className="text-foreground/70 mb-6 max-w-2xl mx-auto">
              By purchasing from {seller.name}, you're supporting local {seller.type}s in Bahrain 
              and contributing to sustainable, community-focused commerce.
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                const firstProduct = sellerProducts[0];
                if (firstProduct) {
                  onNavigate('product-details', firstProduct.id);
                } else {
                  onNavigate('products');
                }
              }}
            >
              {sellerProducts.length > 0 ? `Shop ${seller.name}'s Products` : 'Browse All Products'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}