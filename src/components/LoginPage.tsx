import { useState } from 'react';
import { Leaf, User, Store } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [userType, setUserType] = useState<'customer' | 'seller'>('customer');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === 'seller') {
      onNavigate('seller-dashboard');
    } else {
      onNavigate('home');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-cream via-warm-sand/30 to-soft-cream py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-full p-3">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <span className="font-['Poppins'] text-3xl text-foreground">
                Local Harvest
              </span>
            </div>
            
            <h1 className="font-['Poppins'] text-4xl text-foreground">
              Welcome Back to
              <span className="block text-primary">Your Marketplace</span>
            </h1>
            
            <p className="text-lg text-foreground/70">
              Join our community of local farmers, artisans, and customers who believe in supporting sustainable, local businesses in Bahrain.
            </p>

            <div className="space-y-4 pt-6">
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-['Lato'] mb-1">For Sellers</h3>
                  <p className="text-sm text-foreground/70">
                    Manage your products, track orders, and grow your local business
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-['Lato'] mb-1">For Customers</h3>
                  <p className="text-sm text-foreground/70">
                    Discover fresh, handmade products from your local community
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <Card className="p-8 bg-white border border-border shadow-xl">
            <Tabs defaultValue="customer" onValueChange={(value) => setUserType(value as 'customer' | 'seller')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="customer">Customer</TabsTrigger>
                <TabsTrigger value="seller">Seller</TabsTrigger>
              </TabsList>

              <TabsContent value="customer">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="font-['Poppins'] text-2xl mb-2">Customer Login</h2>
                    <p className="text-sm text-foreground/70">Sign in to start shopping</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Email Address</Label>
                    <Input 
                      id="customer-email" 
                      type="email" 
                      placeholder="your@email.com"
                      className="bg-input-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-password">Password</Label>
                    <Input 
                      id="customer-password" 
                      type="password" 
                      placeholder="Enter your password"
                      className="bg-input-background"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="text-primary hover:underline">Forgot password?</a>
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    Sign In
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-sm text-foreground/70">
                      Don't have an account?{' '}
                      <button
  type="button"
  onClick={() => onNavigate("register")}
  className="text-primary hover:underline"
>
  Register here
</button>

                    </p>
                  </div>

                  <div className="text-center pt-4 border-t border-border">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => onNavigate('products')}
                    >
                      Continue as Guest
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="seller">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="font-['Poppins'] text-2xl mb-2">Seller Login</h2>
                    <p className="text-sm text-foreground/70">Access your seller dashboard</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seller-email">Email Address</Label>
                    <Input 
                      id="seller-email" 
                      type="email" 
                      placeholder="seller@email.com"
                      className="bg-input-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seller-password">Password</Label>
                    <Input 
                      id="seller-password" 
                      type="password" 
                      placeholder="Enter your password"
                      className="bg-input-background"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="text-primary hover:underline">Forgot password?</a>
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                    Sign In to Dashboard
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-sm text-foreground/70">
                      New seller?{' '}
                      <button
  type="button"
  onClick={() => onNavigate("register")}
  className="text-primary hover:underline"
>
  Apply to Sell
</button>

                    </p>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                    <p className="text-sm text-foreground/80">
                      <strong>Seller Benefits:</strong> Easy product management, order tracking, 
                      direct customer communication, and analytics dashboard.
                    </p>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
