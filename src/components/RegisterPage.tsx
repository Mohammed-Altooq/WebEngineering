import { useState } from 'react';
import { Leaf, User, Store } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface RegisteredUser {
  id: string;
  name: string;
  role: 'customer' | 'seller';
  email: string;
}

interface RegisterPageProps {
  onNavigate: (page: string) => void;
  onLogin: (user: RegisteredUser) => void;
}

export function RegisterPage({ onNavigate, onLogin }: RegisterPageProps) {
  const [userType, setUserType] = useState<'customer' | 'seller'>('customer');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const role: 'customer' | 'seller' = userType;

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to register');
        return;
      }

      onLogin({
        id: data.id,
        name: data.name,
        role: data.role,
        email: data.email,
      });

      if (role === 'seller') {
        onNavigate('seller-dashboard');
      } else {
        onNavigate('home');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-cream via-warm-sand/30 to-soft-cream py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding (same as login) */}
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
              Join
              <span className="block text-primary">Your Marketplace</span>
            </h1>
            
            <p className="text-lg text-foreground/70">
              Create an account to start selling or shopping from local businesses in Bahrain.
            </p>

            <div className="space-y-4 pt-6">
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-['Lato'] mb-1">For Sellers</h3>
                  <p className="text-sm text-foreground/70">
                    Showcase your products, reach new customers, and manage your business online.
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
                    Explore fresh and handmade products from trusted local vendors.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Register Form */}
          <Card className="p-8 bg-white border border-border shadow-xl">
            <Tabs
              defaultValue="customer"
              onValueChange={(value) => {
                setUserType(value as 'customer' | 'seller');
                setError(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="customer">Customer</TabsTrigger>
                <TabsTrigger value="seller">Seller</TabsTrigger>
              </TabsList>

              <TabsContent value="customer">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="font-['Poppins'] text-2xl mb-2">Create Customer Account</h2>
                    <p className="text-sm text-foreground/70">Start shopping local products</p>
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 text-center mb-2">
                      {error}
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Full Name</Label>
                    <Input
                      id="customer-name"
                      type="text"
                      placeholder="Your name"
                      className="bg-input-background"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Email Address</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="your@email.com"
                      className="bg-input-background"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-password">Password</Label>
                    <Input
                      id="customer-password"
                      type="password"
                      placeholder="Create a password"
                      className="bg-input-background"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-sm text-foreground/70">
                      Already have an account?{' '}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => onNavigate('login')}
                      >
                        Login here
                      </button>
                    </p>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="seller">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="font-['Poppins'] text-2xl mb-2">Seller Registration</h2>
                    <p className="text-sm text-foreground/70">Apply to become a seller</p>
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 text-center mb-2">
                      {error}
                    </p>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="seller-name">Business / Seller Name</Label>
                    <Input
                      id="seller-name"
                      type="text"
                      placeholder="Your shop name"
                      className="bg-input-background"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seller-email">Email Address</Label>
                    <Input
                      id="seller-email"
                      type="email"
                      placeholder="seller@email.com"
                      className="bg-input-background"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seller-password">Password</Label>
                    <Input
                      id="seller-password"
                      type="password"
                      placeholder="Create a password"
                      className="bg-input-background"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Apply as Seller'}
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-sm text-foreground/70">
                      Already a seller?{' '}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => onNavigate('login')}
                      >
                        Login here
                      </button>
                    </p>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                    <p className="text-sm text-foreground/80">
                      After registering, you can complete your seller profile in the dashboard:
                      add a description, contact info, and products.
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
