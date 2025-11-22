import { useState } from 'react';
import { Leaf, User, Store } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface RegisteredUser {
  id: string;
  name: string;
  role: 'customer' | 'seller';
  email: string;
}

interface RegisterPageProps {
  onNavigate: (page: string) => void;
  onLogin: (user: RegisteredUser) => void;
  isLoggedIn?: boolean;
  currentUserRole?: 'customer' | 'seller';
}

export function RegisterPage({ 
  onNavigate, 
  onLogin, 
  isLoggedIn = false, 
  currentUserRole 
}: RegisterPageProps) {
  const [userType, setUserType] = useState<'customer' | 'seller'>('customer'); // default to customer


  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Validation functions
  const validateName = (name: string): string | null => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (trimmedName.length > 50) {
      return 'Name must be less than 50 characters';
    }
    if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address';
    }
    if (trimmedEmail.length > 100) {
      return 'Email must be less than 100 characters';
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (password.length > 128) {
      return 'Password must be less than 128 characters';
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return 'Password must contain at least one letter';
    }
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Comprehensive validation
      const nameError = validateName(name);
      if (nameError) {
        setError(nameError);
        return;
      }

      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // If customer is logged in, force seller role
      const role: 'customer' | 'seller' = (isLoggedIn && currentUserRole === 'customer') ? 'seller' : userType;

      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim().toLowerCase(), 
          password, 
          role 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error cases
        if (res.status === 400 && data.error?.includes('already exists')) {
          setError('An account with this email already exists. Please use a different email or try logging in.');
        } else {
          setError(data.error || 'Failed to register. Please try again.');
        }
        return;
      }

      // Show success message
      setSuccess(`Welcome ${data.name}! Your account has been created successfully.`);

      // Auto-login the user
      onLogin({
        id: data.id,
        name: data.name,
        role: data.role,
        email: data.email,
      });

      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Navigate to appropriate page after a short delay
      setTimeout(() => {
        if (role === 'seller') {
          onNavigate('seller-dashboard');
        } else {
          onNavigate('home');
        }
      }, 1500);

    } catch (err) {
      console.error('Register error:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else {
        setError('Something went wrong. Please try again later.');
      }
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
            {/* IF STATEMENT: Check user status */}
            {isLoggedIn && currentUserRole === 'customer' ? (
              /* CUSTOMER LOGGED IN - ONLY SELLER FORM */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="font-['Poppins'] text-2xl mb-2">Become a Seller</h2>
                  <p className="text-sm text-foreground/70">Upgrade your account to start selling</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                    {success}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="seller-name">Business / Seller Name</Label>
                  <Input
                    id="seller-name"
                    type="text"
                    placeholder="Your business name"
                    className="bg-input-background"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    maxLength={50}
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
                    disabled={loading}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seller-password">Password</Label>
                  <Input
                    id="seller-password"
                    type="password"
                    placeholder="Create a password (min. 6 characters)"
                    className="bg-input-background"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    minLength={6}
                    maxLength={128}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seller-confirm-password">Confirm Password</Label>
                  <Input
                    id="seller-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    className="bg-input-background"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    minLength={6}
                    maxLength={128}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading || success !== null}
                >
                  {loading ? 'Submitting...' : success ? 'Account created!' : 'Apply as Seller'}
                </Button>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                  <p className="text-sm text-foreground/80">
                    After registering, you can complete your seller profile in the dashboard.
                  </p>
                </div>
              </form>
            ) : (
              /* GUEST USER - SHOW BOTH TABS */
              <Tabs
                defaultValue="customer"
                onValueChange={(value) => {
                  setUserType(value as 'customer' | 'seller');
                  setError(null);
                  setSuccess(null);
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
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                        {success}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="customer-name">Full Name</Label>
                      <Input
                        id="customer-name"
                        type="text"
                        placeholder="Your full name"
                        className="bg-input-background"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        maxLength={50}
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
                        disabled={loading}
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer-password">Password</Label>
                      <Input
                        id="customer-password"
                        type="password"
                        placeholder="Create a password (min. 6 characters)"
                        className="bg-input-background"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        minLength={6}
                        maxLength={128}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer-confirm-password">Confirm Password</Label>
                      <Input
                        id="customer-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        className="bg-input-background"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        minLength={6}
                        maxLength={128}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={loading || success !== null}
                    >
                      {loading ? 'Creating account...' : success ? 'Account created!' : 'Create Account'}
                    </Button>

                    <div className="text-center pt-4">
                      <p className="text-sm text-foreground/70">
                        Already have an account?{' '}
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => onNavigate('login')}
                          disabled={loading}
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
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                        {success}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="seller-name">Business / Seller Name</Label>
                      <Input
                        id="seller-name"
                        type="text"
                        placeholder="Your business name"
                        className="bg-input-background"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        maxLength={50}
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
                        disabled={loading}
                        maxLength={100}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seller-password">Password</Label>
                      <Input
                        id="seller-password"
                        type="password"
                        placeholder="Create a password (min. 6 characters)"
                        className="bg-input-background"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        minLength={6}
                        maxLength={128}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seller-confirm-password">Confirm Password</Label>
                      <Input
                        id="seller-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        className="bg-input-background"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        minLength={6}
                        maxLength={128}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={loading || success !== null}
                    >
                      {loading ? 'Submitting...' : success ? 'Account created!' : 'Apply as Seller'}
                    </Button>

                    <div className="text-center pt-4">
                      <p className="text-sm text-foreground/70">
                        Already a seller?{' '}
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => onNavigate('login')}
                          disabled={loading}
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
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}