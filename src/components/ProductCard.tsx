import { Star, ShoppingCart, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  image?: string;
  description?: string;
  sellerId?: string;
  sellerName?: string;
  stock?: number;
  rating?: number;
}

interface User {
  id: string;
  name: string;
  role: 'customer' | 'seller';
  email: string;
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  onAddToCart?: () => void;
  onViewDetails?: (id: string) => void;
  onViewSeller?: (sellerId: string) => void;
  showAddToCart?: boolean;
  currentUser?: User | null;
  isLoggedIn?: boolean;
  onNavigate?: (page: string) => void;
}

/**
 * Map backend category values → nice labels.
 * Keep this in sync with ProductListingPage CATEGORY_LABELS.
 */
const CATEGORY_LABELS: Record<string, string> = {
  // Fresh Produce
  'Fresh Produce': 'Fresh Produce',
  'fresh-produce': 'Fresh Produce',
  'fresh produce': 'Fresh Produce',
  Vegetables: 'Fresh Produce',

  // Handmade Crafts
  'Handmade Crafts': 'Handmade Crafts',
  'handmade-crafts': 'Handmade Crafts',

  // Dairy Products
  'Dairy Products': 'Dairy Products',
  'dairy-products': 'Dairy Products',
  'Dairy & Eggs': 'Dairy Products',

  // Honey & Preserves
  'Honey & Preserves': 'Honey & Preserves',
  Honey: 'Honey & Preserves',
  honey: 'Honey & Preserves',
  'honey-preserves': 'Honey & Preserves',
};

const getCategoryLabel = (raw?: string) => {
  if (!raw) return '';
  return CATEGORY_LABELS[raw] ?? raw;
};

export function ProductCard({
  product,
  onClick,
  onAddToCart,
  onViewDetails,
  onViewSeller,
  showAddToCart = true,
  currentUser,
  isLoggedIn,
  onNavigate,
}: ProductCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (onViewDetails) {
      onViewDetails(product.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onAddToCart) {
      onAddToCart();
    }
  };

  const handleViewSeller = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onViewSeller && product.sellerId) {
      onViewSeller(product.sellerId);
    }
  };

  const categoryLabel = getCategoryLabel(product.category);

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
            No Image
          </div>
        )}
        
        {/* Stock badge */}
        {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
            Only {product.stock} left
          </div>
        )}
        
        {/* Out of stock badge */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Category */}
        {categoryLabel && (
          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
            {categoryLabel}
          </span>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating!)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.rating})
            </span>
          </div>
        )}

        {/* Seller Info */}
        {product.sellerName && (
          <button
            onClick={handleViewSeller}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-primary transition-colors"
          >
            <User className="w-3 h-3" />
            <span>by {product.sellerName}</span>
          </button>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            BD {product.price.toFixed(3)}
          </span>
          
          {/* Stock info */}
          {product.stock !== undefined && product.stock > 5 && (
            <span className="text-xs text-green-600 font-medium">
              In Stock ({product.stock})
            </span>
          )}
        </div>

        {/* Action Buttons - FIXED TO USE isLoggedIn LIKE PRODUCT DETAILS */}
        <div className="flex gap-2 pt-2">
          {/* Add to Cart Button - Show ONLY if user is logged in AND has onAddToCart function */}
          {isLoggedIn && onAddToCart && product.stock !== 0 && (
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              size="sm"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Add to Cart
            </Button>
          )}

          {/* Login Button - Show ONLY if user is NOT logged in */}
          {!isLoggedIn && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigate) {
                  onNavigate('login');
                }
              }}
              variant="outline"
              className="flex-1 border-primary text-primary hover:bg-primary/5"
              size="sm"
            >
              Login to Add
            </Button>
          )}

          {/* Seller Account - Show if logged in but no onAddToCart (seller) */}
          {isLoggedIn && !onAddToCart && (
            <Button
              disabled
              variant="outline"
              className="flex-1"
              size="sm"
            >
              Seller Account
            </Button>
          )}

          {/* Out of Stock */}
          {product.stock === 0 && (
            <Button
              disabled
              variant="outline"
              className="flex-1"
              size="sm"
            >
              Out of Stock
            </Button>
          )}
        </div>

        {/* User Status Message - UPDATED TO USE isLoggedIn */}
        {!isLoggedIn && (
          <p className="text-xs text-center text-gray-500 pt-1">
            Login as customer to add items to cart
          </p>
        )}
        {isLoggedIn && !onAddToCart && (
          <p className="text-xs text-center text-gray-500 pt-1">
            Seller accounts cannot purchase items
          </p>
        )}
      </div>
    </Card>
  );
}
