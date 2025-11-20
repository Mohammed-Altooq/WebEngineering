import { useEffect, useState } from 'react';
import { ArrowLeft, Star, Share2, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import type { Product } from '../lib/mockData'; // keep using this type for now

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface Review {
  id: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1) product
        const prodRes = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        if (!prodRes.ok) throw new Error('Failed to load product');
        const prodData: Product = await prodRes.json();
        setProduct(prodData);

        // 2) reviews
        const reviewsRes = await fetch(
          `${API_BASE_URL}/api/products/${productId}/reviews`
        );
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

  const handleBack = () => {
    onNavigate('products');
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : product?.rating ?? 0;

  const reviewCount = reviews.length;

  if (loading) {
    return (
      <div className="px-6 py-4">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>
        <Card className="p-6">Loading product details...</Card>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="px-6 py-4">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>
        <Card className="p-6 text-red-500">
          Failed to load product details: {error ?? 'Unknown error'}
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 flex flex-col gap-6">
      {/* Back link */}
      <Button variant="ghost" onClick={handleBack} className="w-fit">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Marketplace
      </Button>

      <div className="grid gap-6 lg:grid-cols-[2fr,3fr] items-start">
        {/* Image */}
        <Card className="overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </Card>

        {/* Right side: details */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 mb-2">
                {product.category || 'Product'}
              </div>
              <h1 className="text-2xl font-semibold mb-1">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-current text-yellow-500" />
                <span>{avgRating.toFixed(1)}</span>
                <span>({reviewCount} reviews)</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-2xl font-bold">
            {product.price.toFixed(2)} BHD
            <span className="text-sm font-normal text-muted-foreground ml-1">
              per unit
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {product.description || 'No description provided for this product.'}
          </p>

          <div className="text-sm text-emerald-700 font-medium">
            • In Stock
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setQuantity((q) => Math.max(1, q - 1))
                }
              >
                −
              </Button>
              <div className="px-4 py-2 text-sm">{quantity}</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setQuantity((q) =>
                    product.stock ? Math.min(product.stock, q + 1) : q + 1
                  )
                }
              >
                +
              </Button>
            </div>

            <Button
              className="flex-1"
              onClick={() => onAddToCart(product, quantity)}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews yet for this product.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.customerName}</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    {r.rating.toFixed(1)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {r.date}
                </div>
                <p className="text-sm">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
