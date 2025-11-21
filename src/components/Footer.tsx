import { Leaf, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export function Footer({ onNavigate }: { onNavigate: (page: string, category?: string) => void }) {
  return (
    <footer className="bg-muted text-foreground mt-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-2">
              <motion.div 
                className="bg-primary rounded-full p-2"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Leaf className="w-5 h-5 text-white" />
              </motion.div>
              <span className="font-['Poppins'] font-semibold text-xl">
                Local Harvest
              </span>
            </div>
            <p className="text-sm text-foreground/80">
              Connecting local farmers and artisans in Bahrain with customers who value quality and sustainability.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="font-['Lato'] mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-foreground/80">
              {['About Us', 'How It Works', 'Become a Seller', 'FAQs'].map((link, index) => (
                <motion.li 
                  key={link}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  whileHover={{ x: 5 }}
                >
                  <a href="#" className="hover:text-primary transition-colors">{link}</a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="font-['Lato'] mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-foreground/80">
              {['Fresh Produce', 'Handmade Crafts', 'Dairy Products', 'Honey & Preserves'].map((category, index) => (
                <motion.li 
                  key={category}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  whileHover={{ x: 5 }}
                >
                  <button
                    onClick={() => onNavigate('products', category)}
                    className="hover:text-primary transition-colors text-left"
                  >
                    {category}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="font-['Lato'] mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-foreground/80">
              {[
                { icon: Mail, text: 'info@localharvest.bh' },
                { icon: Phone, text: '+973 3333 7777' },
                { icon: MapPin, text: 'Manama, Bahrain' }
              ].map((item, index) => (
                <motion.li 
                  key={index}
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                  whileHover={{ x: 5 }}
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  <span>{item.text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div 
          className="border-t border-border mt-8 pt-8 text-center text-sm text-foreground/70"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <p>© 2025 Local Harvest. All rights reserved. Supporting local communities in Bahrain.</p>
        </motion.div>
      </div>
    </footer>
  );
}
