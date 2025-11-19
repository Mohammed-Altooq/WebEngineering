import { ShoppingCart, User, Menu, Leaf } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  cartItemCount?: number;
}

export function Navbar({ onNavigate, currentPage, cartItemCount = 0 }: NavbarProps) {
  return (
    <motion.nav 
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.button 
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div 
              className="bg-primary rounded-full p-2"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Leaf className="w-5 h-5 text-white" />
            </motion.div>
            <span className="font-['Poppins'] font-semibold text-xl text-foreground">
              Local Harvest
            </span>
          </motion.button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {[
              { name: 'Home', page: 'home' },
              { name: 'Marketplace', page: 'products' },
              { name: 'Style Guide', page: 'style-guide' }
            ].map((item) => (
              <motion.button 
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`relative transition-colors ${
                  currentPage === item.page 
                    ? 'text-primary font-medium' 
                    : 'text-foreground/70 hover:text-primary'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.name}
                {currentPage === item.page && (
                  <motion.div
                    className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary"
                    layoutId="navbar-underline"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <motion.button 
              onClick={() => onNavigate('cart')}
              className="relative p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              aria-label="Shopping cart"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span 
                    className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => onNavigate('login')}
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center space-x-2 hover:bg-primary/5 transition-all"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => onNavigate('seller-dashboard')}
                size="sm"
                className="hidden sm:inline-flex bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
              >
                Seller Dashboard
              </Button>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button 
              className="md:hidden p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              aria-label="Menu"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Menu className="w-5 h-5 text-foreground" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}