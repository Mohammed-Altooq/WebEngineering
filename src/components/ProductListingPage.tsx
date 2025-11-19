import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { ProductCard } from './ProductCard';

// ---- API base (change if needed) ----
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// If you already have this type somewhere, delete this and import that instead.
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  sellerId?: string;
  sellerName?: string;
  stock?: number;
  rating?: number;
}

interface ProductListingPageProps {
  onNavigate: (page: string, productId?: string) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductListingPage({ onNavigate, onAddToCart }: ProductListingPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

  // ---------------------------
  // Load products from backend
  // ---------------------------
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/products`);
        if (!res.ok) {
          throw new Error(`Failed to fetch products (${res.status})`);
        }

        const data: Product[] = await res.json();
        setProducts(data);
      } catch (err: any) {
        console.error('Error loading products:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  // ---------------------------
  // Filtering + sorting logic
  // ---------------------------
  const filtered = products
    .filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    )
    .filter((p) =>
      selectedCategory === 'all' ? true : p.category === selectedCategory
    )
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
      return 0; // default (no sort)
    });

  // Collect categories dynamically from products
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="flex flex-col gap-6">
      {/* Header + search/filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Marketplace
        </h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
            <Input
              className="pl-9"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category */}
          <Select
            value={selectedCategory}
            onValueChange={(val) => setSelectedCategory(val)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(val) => setSortBy(val)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating-desc">Rating</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Content area */}
      {loading && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Loading products from the database...
        </Card>
      )}

      {error && !loading && (
        <Card className="p-6 text-center text-sm text-red-500">
          Failed to load products: {error}
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No products found. Try changing your search or filters.
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => onNavigate('product-details', product.id)}
              onAddToCart={() => onAddToCart(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
