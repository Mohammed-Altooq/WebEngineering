import { useEffect, useState } from 'react';
import { Star, ShoppingCart, Heart, Share2, MapPin, Mail, Phone, ArrowLeft, Plus, Minus } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { Product } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface Review {
  id: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

interface Seller {
  id: string;
  name: string;
  type: string;
  rating: number;
  description: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  image?: string;
}

interface ProductDetailsPageProps {
  productId: string;
  onNavigate: (page: string, productId?: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
}

export function ProductDetailsPage({
  productId,
  onNavigate,
  onAddToCart,
}: ProductDetailsPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch product
        const prodRes = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        if (!prodRes.ok) throw new Error('Failed to load product');
        const prodData: Product = await prodRes.json();
        setProduct(prodData);

        // Fetch seller info if sellerId exists
        if (prodData.sellerId) {
          try {
            const sellerRes = await fetch(`${API_BASE_URL}/api/sellers/${prodData.sellerId}`);
            if (sellerRes.ok) {
              const sellerData: Seller = await sellerRes.json();
              setSeller(sellerData);
            }
          } catch (err) {
            console.log('Seller info not available');
          }
        }

        // Fetch reviews
        const reviewsRes = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`);
        if (reviewsRes.ok) {
          const reviewsData: Review[] = await reviewsRes.json();
          setReviews(reviewsData);
        } else {
          setReviews([]);
        }
      } catch (err: any) {
        console.error('Error loading product details:', err);
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadData();
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      onAddToCart(product, quantity);
    }
  };

  const handleBack = () => {
    onNavigate('products');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
          <Card className="p-6 bg-white border border-border">Loading product details...</Card>
        </div>
      </div>
    );
  }

  // Error / Not Found
  if (error || !product) {
    return (
      <div className="min-h-screen bg-soft-cream py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
          <Card className="p-6 bg-white border border-border text-red-500">
            Failed to load product details: {error ?? 'Unknown error'}
          </Card>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : product?.rating ?? 0;

  return (
    <div className="min-h-screen bg-soft-cream py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>

        {/* Product Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Product Image */}
          <div>
            <div className="relative rounded-2xl overflow-hidden bg-white border border-border shadow-lg">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full aspect-square object-cover"
              />
              <button className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-lg hover:bg-secondary transition-colors">
                <Heart className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-3 bg-secondary text-secondary-foreground">
                {product.category}
              </Badge>
              <h1 className="font-['Poppins'] text-3xl mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < Math.floor(avgRating) 
                          ? 'fill-golden-harvest text-golden-harvest' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                  <span className="ml-2">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
              </div>
            </div>

            <div className="flex items-baseline space-x-3">
              <span className="font-['Poppins'] text-4xl text-primary">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-muted-foreground">per unit</span>
            </div>

            <p className="text-foreground/80 leading-relaxed">
              {product.description || 'No description provided for this product.'}
            </p>

            {/* Stock Info */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                typeof product.stock === 'number' && product.stock > 10 
                  ? 'bg-olive-green' 
                  : 'bg-golden-harvest'
              }`} />
              <span className="text-sm">
                {typeof product.stock === 'number' 
                  ? product.stock > 10 
                    ? 'In Stock' 
                    : product.stock > 0 
                      ? `Only ${product.stock} left` 
                      : 'Out of stock'
                  : 'In Stock'
                }
              </span>
            </div>

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="font-['Lato']">Quantity</label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-border rounded-lg bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-secondary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 font-['Roboto_Mono']">{quantity}</span>
                  <button
                    onClick={() => setQuantity(
                      typeof product.stock === 'number' 
                        ? Math.min(product.stock, quantity + 1)
                        : quantity + 1
                    )}
                    className="p-3 hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground">
                  Total: ${(product.price * quantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90 h-12"
                onClick={handleAddToCart}
                disabled={typeof product.stock === 'number' && product.stock === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" className="h-12">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Seller Info Card */}
            {seller && (
              <Card className="p-6 bg-white border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <ImageWithFallback
                        src={seller.image}
                        alt={seller.name}
                        className="w-full h-full object-cover"
                      />
                      <AvatarFallback>{seller.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-['Lato']">{seller.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{seller.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-golden-harvest text-golden-harvest" />
                    <span>{seller.rating}</span>
                  </div>
                </div>
                
                <p className="text-sm text-foreground/70 mb-4">{seller.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{seller.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{seller.contactEmail}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{seller.contactPhone}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => onNavigate('seller-profile', seller.id)}
                >
                  View Seller Profile
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <Card className="p-8 bg-white border border-border">
          <h2 className="font-['Poppins'] text-2xl mb-6">Customer Reviews</h2>
          
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-['Lato']">{review.customerName}</h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
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
                  </div>
                  <p className="text-foreground/80">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-foreground/70 mb-4">No reviews yet</p>
              <Button 
                variant="outline"
                onClick={() => onNavigate('reviews')}
              >
                Be the first to review
              </Button>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full mt-6"
            onClick={() => onNavigate('reviews')}
          >
            Write a Review
          </Button>
        </Card>
      </div>
    </div>
  );
}