import { Star, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Product } from '../lib/mockData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onViewDetails: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
  onViewSeller?: (sellerId: string) => void;
}

export function ProductCard({ product, onViewDetails, onAddToCart, onViewSeller }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    onAddToCart?.(product);
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="group overflow-hidden border border-border bg-white hover:shadow-2xl transition-all duration-300 rounded-xl">
        <div 
          className="cursor-pointer" 
          onClick={() => onViewDetails(product.id)}
        >
          {/* Image */}
          <div className="relative overflow-hidden aspect-square bg-secondary/20">
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.4 }}
            >
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div 
              className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <span className="font-['Roboto_Mono']">${product.price.toFixed(2)}</span>
            </motion.div>
            
            {/* Overlay on hover */}
            <motion.div 
              className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-['Lato'] line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewSeller?.(product.sellerId);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                whileHover={{ x: 2 }}
              >
                {product.sellerName}
              </motion.button>
            </div>

            <p className="text-sm text-foreground/70 line-clamp-2">
              {product.description}
            </p>

            {/* Rating */}
            <div className="flex items-center space-x-1">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Star className="w-4 h-4 fill-golden-harvest text-golden-harvest" />
              </motion.div>
              <span className="text-sm">{product.rating}</span>
              <span className="text-xs text-muted-foreground">
                ({product.reviews?.length || 0} reviews)
              </span>
            </div>

            {/* Category Badge */}
            <div className="flex items-center justify-between">
              <motion.span 
                className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                whileHover={{ scale: 1.05 }}
              >
                {product.category}
              </motion.span>
              <span className="text-xs text-muted-foreground">
                {product.stock} in stock
              </span>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="px-4 pb-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleAddToCart}
              className="w-full bg-primary hover:bg-primary/90 hover:shadow-lg shadow-primary/20 transition-all relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                animate={isAdding ? { x: '100%' } : { x: '-100%' }}
                transition={{ duration: 0.6 }}
              />
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isAdding ? 'Added!' : 'Add to Cart'}
            </Button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}