import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { products } from '../lib/mockData';

interface ReviewPageProps {
  onNavigate: (page: string) => void;
}

export function ReviewPage({ onNavigate }: ReviewPageProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Simulate a recent purchase
  const product = products[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onNavigate('product-details');
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-soft-cream py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center bg-white border border-border">
          <div className="bg-olive-green/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-12 h-12 text-golden-harvest fill-golden-harvest" />
          </div>
          <h2 className="font-['Poppins'] text-2xl mb-3 text-foreground">Thank You for Your Review!</h2>
          <p className="text-foreground/70 mb-6">
            Your feedback helps other customers make informed decisions and supports our local sellers.
          </p>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => onNavigate('home')}
          >
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-cream py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-['Poppins'] text-3xl mb-2">Write a Review</h1>
          <p className="text-foreground/70">Share your experience with this product</p>
        </div>

        {/* Product Info */}
        <Card className="p-6 bg-white border border-border mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary/20">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-['Lato'] mb-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.sellerName}</p>
              <p className="text-sm text-primary font-['Roboto_Mono'] mt-1">
                ${product.price.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Review Form */}
        <Card className="p-8 bg-white border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div className="space-y-3">
              <Label>Your Rating</Label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        value <= (hoverRating || rating)
                          ? 'fill-golden-harvest text-golden-harvest'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-4 text-foreground/70">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </span>
                )}
              </div>
              {rating === 0 && (
                <p className="text-sm text-destructive">Please select a rating</p>
              )}
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <Label htmlFor="review">Your Review</Label>
              <Textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tell us about your experience with this product. What did you like? Was the quality good? How was the delivery?"
                rows={6}
                className="bg-input-background"
                required
              />
              <p className="text-sm text-muted-foreground">
                Minimum 20 characters ({review.length}/20)
              </p>
            </div>

            {/* Review Guidelines */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-['Lato'] mb-2">Review Guidelines</h4>
              <ul className="text-sm text-foreground/70 space-y-1">
                <li>• Focus on the product quality and seller service</li>
                <li>• Be honest and helpful to other customers</li>
                <li>• Avoid inappropriate language</li>
                <li>• Don't include personal information</li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => onNavigate('products')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={rating === 0 || review.length < 20}
              >
                Submit Review
              </Button>
            </div>
          </form>
        </Card>

        {/* Existing Reviews */}
        <div className="mt-8">
          <h2 className="font-['Poppins'] text-2xl mb-6">Recent Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((r) => (
              <Card key={r.id} className="p-6 bg-white border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-['Lato']">{r.customerName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(r.date).toLocaleDateString('en-US', {
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
                          i < r.rating
                            ? 'fill-golden-harvest text-golden-harvest'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-foreground/80">{r.comment}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
