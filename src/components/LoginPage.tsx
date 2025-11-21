import { useState } from 'react';
import { Leaf, User, Store } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

type UserType = 'customer' | 'seller';

interface RegisteredUser {
  id: string;
  name: string;
  role: 'customer' | 'seller';
  email: string;
}

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onLogin: (user: RegisteredUser) => void;
}

export function LoginPage({ onNavigate, onLogin }: LoginPageProps) {
  const [userType, setUserType] = useState<UserType>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Check if user role matches selected tab
      if (data.role !== userType) {
        setError(`This account is registered as a ${data.role}, not a ${userType}. Please select the correct login type.`);
        return;
      }

      // Login successful
      onLogin({
        id: data.id,
        name: data.name,
        role: data.role,
        email: data.email,
      });

      // Clear form
      setEmail('');
      setPassword('');

      // Navigate based on role
      if (data.role === 'seller') {
        onNavigate('seller-dashboard');
      } else {
        onNavigate('home');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
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
            <Tabs 
              defaultValue="customer" 
              onValueChange={(value) => {
                setUserType(value as 'customer' | 'seller');
                setError(null); // Clear error when switching tabs
              }}
            >
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

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Email Address</Label>
                    <Input 
                      id="customer-email" 
                      type="email" 
                      placeholder="your@email.com"
                      className="bg-input-background"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-password">Password</Label>
                    <Input 
                      id="customer-password" 
                      type="password" 
                      placeholder="Enter your password"
                      className="bg-input-background"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="text-primary hover:underline">Forgot password?</a>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-sm text-foreground/70">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => onNavigate("register")}
                        className="text-primary hover:underline"
                        disabled={loading}
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
                      disabled={loading}
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

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="seller-email">Email Address</Label>
                    <Input 
                      id="seller-email" 
                      type="email" 
                      placeholder="seller@email.com"
                      className="bg-input-background"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seller-password">Password</Label>
                    <Input 
                      id="seller-password" 
                      type="password" 
                      placeholder="Enter your password"
                      className="bg-input-background"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-border" />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="text-primary hover:underline">Forgot password?</a>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-sm text-foreground/70">
                      New seller?{' '}
                      <button
                        type="button"
                        onClick={() => onNavigate("register")}
                        className="text-primary hover:underline"
                        disabled={loading}
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