import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import type { Product } from '../components/ProductListingPage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onAddToCart: () => void;
}

export function ProductCard({ product, onClick, onAddToCart }: ProductCardProps) {
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/products/${product.id}/reviews`
        );
        if (!res.ok) {
          console.error('Failed to fetch reviews for', product.id, res.status);
          return;
        }

        const reviews: { rating?: number }[] = await res.json();
        const count = reviews.length;
        setReviewCount(count);

        if (count > 0) {
          const total = reviews.reduce(
            (sum, r) => sum + (r.rating ?? 0),
            0
          );
          setAvgRating(total / count);
        } else {
          setAvgRating(null);
        }
      } catch (err) {
        console.error('Error loading reviews for product', product.id, err);
      }
    }

    loadReviews();
  }, [product.id]);

  const ratingToShow = avgRating ?? product.rating ?? 0;
  const reviewCountToShow = reviewCount ?? 0;

  const stockLabel =
    typeof product.stock === 'number'
      ? product.stock > 0
        ? `${product.stock} in stock`
        : 'Out of stock'
      : '';

  // Fallback so we always show *something* in the pill
  const categoryLabel = product.category && product.category.trim().length > 0
    ? product.category
    : 'Category';

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-80">
      <div onClick={onClick}>
        {/* Image */}
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full max-h-40 object-cover"
          />
        ) : (
          <div className="h-40 w-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}

        <CardContent className="p-4 space-y-2">
          {/* Name */}
          <h3 className="font-semibold text-sm line-clamp-2">
            {product.name}
          </h3>

          {/* Rating + reviews */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-current text-yellow-500" />
            <span>{ratingToShow.toFixed(1)}</span>
            <span>•</span>
            <span>{reviewCountToShow} reviews</span>
          </div>

          {/* Price */}
          <div className="text-base font-semibold">
            {product.price.toFixed(2)} BHD
          </div>

          {/* Bottom row: golden category pill + stock */}
          <div className="mt-1 flex items-center justify-between text-[11px]">
            {/* GOLD PILL – forced visible */}
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 font-medium"
              style={{ backgroundColor: '#FDE68A', color: '#92400E' }} // soft gold bg, dark gold text
            >
              {categoryLabel}
            </span>

            {stockLabel && (
              <span className="text-muted-foreground">
                {stockLabel}
              </span>
            )}
          </div>
        </CardContent>
      </div>

      <CardFooter className="p-4 pt-0 mt-auto">
        <Button className="w-full" size="sm" onClick={onAddToCart}>
          Add to cart
        </Button>
      </CardFooter>
    </Card>
  );
}
