import { Star, MapPin, Mail, Phone, Package, Award, TrendingUp, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ProductCard } from './ProductCard';
import { sellers, products, Product } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SellerProfilePageProps {
  sellerId?: string;
  onNavigate: (page: string, productId?: string) => void;
  onAddToCart: (product: Product) => void;
}

export function SellerProfilePage({ sellerId, onNavigate, onAddToCart }: SellerProfilePageProps) {
  const seller = sellers.find(s => s.id === sellerId) || sellers[0];
  const sellerProducts = products.filter(p => p.sellerId === seller.id);
  
  // Mock reviews for the seller
  const sellerReviews = [
    {
      id: '1',
      customerName: 'Sara Al-Khalifa',
      rating: 5,
      comment: 'Amazing quality and excellent customer service! Always fresh products.',
      date: '2025-10-28',
      productName: 'Fresh Organic Tomatoes'
    },
    {
      id: '2',
      customerName: 'Mohammed Hassan',
      rating: 5,
      comment: 'Best local seller in Bahrain. Highly recommend!',
      date: '2025-10-25',
      productName: 'Organic Mixed Vegetables'
    },
    {
      id: '3',
      customerName: 'Fatima Ahmed',
      rating: 4,
      comment: 'Great products, fast delivery. Will order again.',
      date: '2025-10-20',
      productName: 'Fresh Dates Premium'
    }
  ];

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
                  <ImageWithFallback
                    src={seller.image}
                    alt={seller.name}
                    className="w-full h-full object-cover"
                  />
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
                            i < Math.floor(seller.rating) 
                              ? 'fill-golden-harvest text-golden-harvest' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="font-['Lato']">{seller.rating}</span>
                    <span className="text-muted-foreground">({sellerReviews.length} reviews)</span>
                  </div>

                  <p className="text-foreground/80 leading-relaxed mb-6">
                    {seller.description}
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-foreground/70">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span>{seller.location}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-foreground/70">
                      <Mail className="w-5 h-5 text-primary" />
                      <a href={`mailto:${seller.contactEmail}`} className="hover:text-primary transition-colors">
                        {seller.contactEmail}
                      </a>
                    </div>
                    <div className="flex items-center space-x-3 text-foreground/70">
                      <Phone className="w-5 h-5 text-primary" />
                      <a href={`tel:${seller.contactPhone}`} className="hover:text-primary transition-colors">
                        {seller.contactPhone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button className="bg-primary hover:bg-primary/90">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Seller
                </Button>
                <Button variant="outline">
                  <Package className="w-4 h-4 mr-2" />
                  View All Products
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground/70">Total Sales</p>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <p className="font-['Poppins'] text-3xl text-primary mb-1">{seller.totalSales}</p>
                <p className="text-sm text-foreground/70">Completed Orders</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-golden-harvest/10 to-golden-harvest/5 border-golden-harvest/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground/70">Products</p>
                  <Package className="w-5 h-5 text-golden-harvest" />
                </div>
                <p className="font-['Poppins'] text-3xl text-golden-harvest mb-1">{sellerProducts.length}</p>
                <p className="text-sm text-foreground/70">Active Listings</p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-olive-green/10 to-olive-green/5 border-olive-green/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground/70">Response Rate</p>
                  <Award className="w-5 h-5 text-olive-green" />
                </div>
                <p className="font-['Poppins'] text-3xl text-olive-green mb-1">98%</p>
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
              Products ({sellerProducts.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({sellerReviews.length})
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
                {sellerProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={(id) => onNavigate('product-details', id)}
                    onAddToCart={onAddToCart}
                    onViewSeller={(sellerId) => onNavigate('seller-profile', sellerId)}
                  />
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

            {/* Rating Summary */}
            <Card className="p-6 bg-white border border-border">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <p className="font-['Poppins'] text-6xl text-primary mb-2">{seller.rating}</p>
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-6 h-6 ${
                          i < Math.floor(seller.rating) 
                            ? 'fill-golden-harvest text-golden-harvest' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="text-foreground/70">Based on {sellerReviews.length} reviews</p>
                </div>

                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = sellerReviews.filter(r => r.rating === stars).length;
                    const percentage = (count / sellerReviews.length) * 100;
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
                  <div className="text-sm text-muted-foreground">
                    Product: <span className="text-foreground">{review.productName}</span>
                  </div>
                </Card>
              ))}
            </div>

            <Button variant="outline" className="w-full">
              Load More Reviews
            </Button>
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
                }
              }}
            >
              Shop {seller.name}'s Products
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
