import { ShoppingCart, User, Menu, Leaf, LogOut, Settings, Package, UserCircle } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  cartItemCount?: number;

  // auth state
  isLoggedIn: boolean;
  isSeller?: boolean; // optional, only matters for seller dashboard
  onLogout: () => void;
}

export function Navbar({
  onNavigate,
  currentPage,
  cartItemCount = 0,
  isLoggedIn,
  isSeller = false,
  onLogout,
}: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ✅ Top navigation links
  // - No "How It Works" here
  // - "Become a Seller" only if NOT a seller
  const navLinks = [
    { name: 'Home', page: 'home' },
    { name: 'Marketplace', page: 'products' },
    { name: 'About', page: 'about' },
    // Become a Seller only visible if the user is NOT a seller
    ...(isSeller ? [] : [{ name: 'Become a Seller', page: 'register' as const }]),
    { name: 'FAQs', page: 'faqs' },
  ];

  return (
    <motion.nav
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-secondary/50 flex items-center justify-center shadow-md shadow-primary/20">
              <Leaf className="w-5 h-5 text-primary" />
            </div>
            <span className="font-['Poppins'] text-xl text-foreground">
              Local Harvest
            </span>
          </motion.button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((item) => (
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
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* 🛒 Cart – only for customers, not sellers */}
            {isLoggedIn && !isSeller && (
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
                      className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    >
                      {cartItemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}

            {/* 🏪 Seller Dashboard – only if logged in AND seller */}
            {isLoggedIn && isSeller && (
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => onNavigate('seller-dashboard')}
                  size="sm"
                  className="hidden sm:inline-flex bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </motion.div>
            )}

            {/* Profile Dropdown */}
            {isLoggedIn ? (
              <div className="relative">
                <motion.button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-secondary/50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <UserCircle className="w-5 h-5 text-foreground" />
                  <span className="hidden sm:inline text-sm">
                    {isSeller ? 'Seller' : 'Profile'}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border z-50"
                    >
                      <div className="py-2">
                        <button
                          onClick={() => {
                            onNavigate(isSeller ? 'seller-profile-edit' : 'customer-profile');
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-secondary/50 transition-colors flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>{isSeller ? 'Edit Profile' : 'My Profile'}</span>
                        </button>

                        <div className="border-t border-border my-1"></div>

                        <button
                          onClick={() => {
                            onLogout();
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-secondary/50 transition-colors flex items-center space-x-2 text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
            )}

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
