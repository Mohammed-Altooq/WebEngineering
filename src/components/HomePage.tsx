import { useEffect, useState } from 'react';
import { Search, Leaf, Package, Award, Users, ArrowRight, Star, Quote } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { products } from '../lib/mockData';
import { ProductCard } from './ProductCard';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface HomePageProps {
  onNavigate: (page: string, productId?: string) => void;
  onAddToCart: (product: any) => void;
  /** Current logged in user - if null, user is not logged in */
  currentUser?: { id: string; name: string; role: 'customer' | 'seller'; email: string } | null;
}

type CategoryIcon = typeof Leaf;

interface CategoryInfo {
  name: string;
  icon: CategoryIcon;
  color: string;
}

// 🔒 Fixed list of categories shown on the homepage
const CORE_CATEGORIES: CategoryInfo[] = [
  { name: 'Fresh Produce', icon: Leaf,    color: 'bg-olive-green' },
  { name: 'Handmade Crafts', icon: Package, color: 'bg-deep-terracotta' },
  { name: 'Dairy Products', icon: Package,  color: 'bg-primary' },
  { name: 'Honey & Preserves', icon: Award, color: 'bg-golden-harvest' },
];

export function HomePage({ onNavigate, onAddToCart, currentUser }: HomePageProps) {
  const [topRated, setTopRated] = useState<any[]>([]);
  const [sellerCount, setSellerCount] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // search state

  // FIXED: Better logic for cart functionality
  const isCustomer = currentUser?.role === 'customer';
  const isSeller = currentUser?.role === 'seller';
  const isLoggedIn = !!currentUser;

  console.log('=== HOMEPAGE CART DEBUG ===');
  console.log('Current User:', currentUser);
  console.log('Is Customer:', isCustomer);
  console.log('Is Seller:', isSeller);
  console.log('Is Logged In:', isLoggedIn);
  console.log('OnAddToCart function exists:', !!onAddToCart);

  // --- Load sellers for the "150+ Local Sellers" card ---
  useEffect(() => {
    async function loadSellers() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/sellers`);
        if (!res.ok) {
          console.error('Failed to fetch sellers', res.status);
          return;
        }
        const data = await res.json();
        setSellerCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        console.error('Error loading sellers:', err);
      }
    }

    loadSellers();
  }, []);

  // ❌ REMOVED: loading categories from /api/products
  // Homepage now always shows CORE_CATEGORIES only.

  // --- Load top 3 highest-rated products from DB ---
  useEffect(() => {
    async function loadTopRated() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const data = await res.json();

        // Sort by rating (highest → lowest)
        const sorted = [...data].sort((a, b) => (b.rating || 0) - (a.rating || 0));

        // Take top 3
        setTopRated(sorted.slice(0, 3));
        console.log('✅ Loaded top rated products:', sorted.slice(0, 3));
      } catch (err) {
        console.error("Error loading top rated products:", err);
      }
    }

    loadTopRated();
  }, []);

  const featuredProducts = topRated.length > 0 ? topRated : products.slice(0, 3);

  // central search handler
  const handleSearch = () => {
    const q = searchTerm.trim();
    if (!q) {
      onNavigate('products'); // if empty, just go to products
      return;
    }
    onNavigate('products', `search:${q}`);
  };

  // FIXED: Proper cart handler with debugging and error handling
  const handleAddToCart = (product: any) => {
    console.log('🛒 HomePage handleAddToCart called with:', product);
    console.log('User check - isCustomer:', isCustomer, 'currentUser:', currentUser);
    
    // Check if product is valid
    if (!product) {
      console.error('❌ Product is undefined in HomePage handleAddToCart');
      return;
    }
    
    if (!product.id) {
      console.error('❌ Product is missing ID:', product);
      return;
    }
    
    if (!isCustomer) {
      console.log('❌ Not a customer, blocking add to cart');
      return;
    }
    
    console.log('✅ Calling parent onAddToCart function with product:', product);
    onAddToCart(product);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-soft-cream via-warm-sand/30 to-soft-cream py-20 px-4 overflow-hidden">
        {/* Animated background elements */}
        <motion.div
          className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-golden-harvest/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <motion.h1
                className="font-['Poppins'] text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Support Local
                <motion.span
                  className="block text-primary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Farmers & Artisans
                </motion.span>
              </motion.h1>
              <motion.p
                className="text-lg text-foreground/70 max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Discover fresh, handmade, and sustainable products from your local
                community in Bahrain. Every purchase supports local businesses and
                traditional craftsmanship.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                className="flex gap-2 max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="flex-1 relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    placeholder="Search for products..."
                    className="pl-10 h-12 bg-white border-border transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    className="h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                    onClick={handleSearch}
                  >
                    Search
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all"
                    onClick={() => onNavigate('products')}
                  >
                    {isSeller ? 'Browse Products' : 'Shop Now'}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
                {!isSeller && (
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="hover:bg-primary/5 transition-all"
                      onClick={() => onNavigate('login')}
                    >
                      Become a Seller
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.div
                className="relative rounded-2xl overflow-hidden shadow-2xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1549248581-cf105cd081f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHZlZ2V0YWJsZXMlMjBmYXJtZXJzJTIwbWFya2V0fGVufDF8fHx8MTc2MjExMDU5NXww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Fresh vegetables at farmers market"
                  className="w-full h-[500px] object-cover"
                />
              </motion.div>
              {/* Floating Stats */}
              <motion.div
                className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 border border-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                whileHover={{ y: -4, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
              >
                <div className="flex items-center space-x-3">
                  <motion.div
                    className="bg-primary/10 p-3 rounded-lg"
                    animate={{ rotate: [0, 5, 0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Users className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div>
                    <motion.p
                      className="font-['Roboto_Mono'] text-2xl text-primary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1, delay: 1.4 }}
                    >
                      {sellerCount !== null ? `${sellerCount}+` : '150+'}
                    </motion.p>
                    <p className="text-sm text-muted-foreground">Local Sellers</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-['Poppins'] text-3xl mb-4">Shop by Category</h2>
            <p className="text-foreground/70">
              Explore our curated selection of local products
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {CORE_CATEGORIES.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="p-6 text-center hover:shadow-xl transition-all cursor-pointer group border border-border bg-white"
                    onClick={() => onNavigate('products', category.name)}
                  >
                    <motion.div
                      className={`${category.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="font-['Lato']">{category.name}</h3>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4 bg-soft-cream">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex justify-between items-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="font-['Poppins'] text-3xl mb-2">Featured Products</h2>
              <p className="text-foreground/70">
                Handpicked selections from our best sellers
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => onNavigate('products')}
                className="hover:bg-primary/5 transition-all"
              >
                View All
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <style>{`
              .featured-products img {
                max-height: 200px !important;
                height: 200px !important;
                object-fit: cover !important;
                width: 100% !important;
              }
            `}</style>
            {featuredProducts.map((product, index) => {
              console.log(`🔄 Rendering product ${product.id}:`, product);
              
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="featured-products"
                >
                  <ProductCard
                    product={product}
                    onViewDetails={(id: string) => onNavigate('product-details', id)}
                    onAddToCart={isCustomer ? () => handleAddToCart(product) : undefined}
                    onViewSeller={(sellerId: string) =>
                      onNavigate('seller-profile', sellerId)
                    }
                    isLoggedIn={isLoggedIn}
                    showAddToCart={isCustomer} // Only show for customers
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-['Poppins'] text-3xl mb-4">How It Works</h2>
            <p className="text-foreground/70">Simple steps to support local businesses</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Browse Products',
                description:
                  'Explore our marketplace filled with fresh produce and handmade crafts from local sellers.',
                icon: Search,
              },
              {
                step: '02',
                title: isSeller ? 'Manage Inventory' : 'Add to Cart',
                description: isSeller 
                  ? 'Manage your products and connect with customers in your community.'
                  : 'Select your favorite items and add them to your cart. Shop from multiple sellers.',
                icon: Package,
              },
              {
                step: '03',
                title: 'Support Local',
                description:
                  'Complete your order and support local farmers and artisans in your community.',
                icon: Award,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="p-8 text-center border border-border bg-white hover:shadow-xl transition-all">
                  <motion.div
                    className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <item.icon className="w-8 h-8 text-primary" />
                  </motion.div>
                  <div className="text-primary font-['Roboto_Mono'] mb-2">
                    {item.step}
                  </div>
                  <h3 className="font-['Lato'] mb-3">{item.title}</h3>
                  <p className="text-sm text-foreground/70">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/5 to-soft-cream">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-['Poppins'] text-3xl mb-4">What Our Community Says</h2>
            <p className="text-foreground/70">Real stories from real customers</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sara Al-Khalifa',
                role: 'Regular Customer',
                content:
                  'The quality of produce is exceptional! I love knowing exactly where my food comes from.',
                rating: 5,
              },
              {
                name: 'Ahmed Abdullah',
                role: 'Artisan Supporter',
                content:
                  'Supporting local artisans has never been easier. Beautiful handmade products delivered to my door.',
                rating: 5,
              },
              {
                name: 'Fatima Hassan',
                role: 'Community Member',
                content:
                  'This platform has connected me with amazing local businesses I never knew existed in Bahrain.',
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className="p-6 bg-white border border-border hover:shadow-xl transition-all">
                  <Quote className="w-8 h-8 text-primary/30 mb-4" />
                  <p className="text-sm text-foreground/80 mb-4 italic font-['Playfair_Display']">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                      >
                        <Star className="w-4 h-4 fill-golden-harvest text-golden-harvest" />
                      </motion.div>
                    ))}
                  </div>
                  <div>
                    <p className="font-['Lato']">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Only show for non-sellers */}
      {!isSeller && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="bg-primary text-white p-12 text-center border-0 shadow-2xl shadow-primary/20">
                <h2 className="font-['Poppins'] text-3xl mb-4">
                  Ready to Start Selling?
                </h2>
                <p className="mb-8 text-white/90 max-w-2xl mx-auto">
                  Join our community of local farmers and artisans. Share your
                  products with customers who value quality and sustainability.
                </p>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 shadow-lg"
                    onClick={() => onNavigate('login')}
                  >
                    Register as Seller
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}