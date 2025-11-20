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

  // NEW: to hide Add to Cart
  isLoggedIn: boolean;
}

export function ProductCard({ product, onClick, onAddToCart, isLoggedIn }: ProductCardProps) {
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  // 👇 Your original exact height — untouched
  const IMAGE_HEIGHT = "430px";

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/products/${product.id}/reviews`
        );
        if (!res.ok) return;

        const reviews: { rating?: number }[] = await res.json();
        setReviewCount(reviews.length);

        if (reviews.length > 0) {
          const total = reviews.reduce(
            (sum, r) => sum + (r.rating ?? 0),
            0
          );
          setAvgRating(total / reviews.length);
        }
      } catch (err) {
        console.error('Error loading reviews:', err);
      }
    }

    loadReviews();
  }, [product.id]);

  const ratingToShow = avgRating ?? product.rating ?? 0;
  const reviewCountToShow = reviewCount ?? 0;
  const stockLabel =
    typeof product.stock === 'number'
      ? product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'
      : '';

  const categoryLabel =
    product.category?.trim().length ? product.category : 'Category';

  return (
    <Card
      className="
        group flex flex-col overflow-hidden rounded-2xl border bg-white
        shadow-sm hover:shadow-md hover:-translate-y-1
        transition-all duration-200 cursor-pointer
      "
    >
      {/* TOP (CLICKABLE AREA) */}
      <div onClick={onClick} className="flex-1 flex flex-col">
        
        {/* SINGLE UNIFIED IMAGE BLOCK */}
        <div
          className="w-full overflow-hidden bg-muted"
          style={{ height: IMAGE_HEIGHT }}   // ⬅ your original dimension
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
              }}
              className="group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
              No Image
            </div>
          )}
        </div>

        {/* CONTENT */}
        <CardContent className="p-4 space-y-3 flex-1 flex flex-col">

          <h3 className="font-semibold text-base md:text-lg line-clamp-2 leading-snug">
            {product.name}
          </h3>

          <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            <span>{ratingToShow.toFixed(1)}</span>
            <span>•</span>
            <span>{reviewCountToShow} reviews</span>
          </div>

          <div className="text-lg md:text-xl font-bold">
            {product.price.toFixed(2)} BHD
          </div>

          <div className="flex items-center justify-between text-xs md:text-sm mt-auto">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 font-medium"
              style={{ backgroundColor: '#FDE68A', color: '#92400E' }}
            >
              {categoryLabel}
            </span>
            {stockLabel && <span className="text-muted-foreground">{stockLabel}</span>}
          </div>

        </CardContent>
      </div>

      {/* ADD TO CART */}
      <CardFooter className="p-4 pt-0 mt-auto">

        {isLoggedIn ? (
          <Button className="w-full" size="sm" onClick={onAddToCart}>
            Add to cart
          </Button>
        ) : (
          <Button className="w-full opacity-60 cursor-not-allowed" disabled>
            Login to add
          </Button>
        )}

      </CardFooter>
    </Card>
  );
}
