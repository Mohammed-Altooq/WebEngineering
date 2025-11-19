import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Leaf, ShoppingCart, User } from 'lucide-react';

export function StyleGuide() {
  return (
    <div className="min-h-screen bg-soft-cream py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="font-['Poppins'] text-4xl mb-4">Style Guide</h1>
          <p className="text-foreground/70 text-lg">
            Design system for Local Farmers & Artisans Marketplace
          </p>
        </div>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="font-['Poppins'] text-3xl mb-6">Color Palette</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Fresh Green', var: '--fresh-green', hex: '#3D8A4F', usage: 'Primary buttons, highlights' },
              { name: 'Warm Sand', var: '--warm-sand', hex: '#E9CBA7', usage: 'Backgrounds, accents' },
              { name: 'Deep Terracotta', var: '--deep-terracotta', hex: '#C36A2D', usage: 'Icons, hover states' },
              { name: 'Golden Harvest', var: '--golden-harvest', hex: '#E8B23C', usage: 'CTA highlights' },
              { name: 'Soft Cream', var: '--soft-cream', hex: '#F9F5EF', usage: 'Page backgrounds' },
              { name: 'Charcoal Gray', var: '--charcoal-gray', hex: '#2E2E2E', usage: 'Text, contrast' },
              { name: 'Olive Green', var: '--olive-green', hex: '#6B8E23', usage: 'Success states' },
              { name: 'Clay Red', var: '--clay-red', hex: '#B43F3F', usage: 'Error states' }
            ].map((color) => (
              <Card key={color.name} className="p-6 bg-white border border-border">
                <div 
                  className="w-full h-24 rounded-lg mb-4 shadow-md"
                  style={{ backgroundColor: color.hex }}
                />
                <h3 className="font-['Lato'] mb-1">{color.name}</h3>
                <p className="text-sm font-['Roboto_Mono'] text-foreground/70 mb-2">{color.hex}</p>
                <p className="text-xs text-foreground/60">{color.usage}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="font-['Poppins'] text-3xl mb-6">Typography</h2>
          <Card className="p-8 bg-white border border-border space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Heading 1 - Poppins 600</p>
              <h1 className="font-['Poppins']">Support Local Farmers & Artisans</h1>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Heading 2 - Poppins 600</p>
              <h2 className="font-['Poppins']">Fresh Products from Your Community</h2>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Heading 3 - Lato 500</p>
              <h3 className="font-['Lato']">Handmade with Care</h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Body Text - Open Sans 400</p>
              <p className="font-['Open_Sans']">
                Discover fresh, handmade, and sustainable products from your local community in Bahrain. 
                Every purchase supports local businesses and traditional craftsmanship.
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Accent Text - Playfair Display 500 Italic</p>
              <p className="font-['Playfair_Display'] italic">
                "The quality of produce is exceptional! I love knowing exactly where my food comes from."
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Numeric - Roboto Mono 400</p>
              <p className="font-['Roboto_Mono'] text-2xl">$24.99</p>
            </div>
          </Card>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="font-['Poppins'] text-3xl mb-6">Buttons</h2>
          <Card className="p-8 bg-white border border-border">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-3">Primary Button</p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-primary hover:bg-primary/90">
                    Shop Now
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90" size="sm">
                    Small Button
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90" size="lg">
                    Large Button
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-3">Secondary/Outline Button</p>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline">
                    Learn More
                  </Button>
                  <Button variant="outline" size="sm">
                    Small
                  </Button>
                  <Button variant="outline" size="lg">
                    Large
                  </Button>
                  <Button variant="outline" disabled>
                    Disabled
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-3">Buttons with Icons</p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-primary hover:bg-primary/90">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button variant="outline">
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button className="bg-accent hover:bg-accent/90">
                    <Leaf className="w-4 h-4 mr-2" />
                    Shop Local
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Form Elements */}
        <section className="mb-16">
          <h2 className="font-['Poppins'] text-3xl mb-6">Form Elements</h2>
          <Card className="p-8 bg-white border border-border">
            <div className="space-y-6 max-w-md">
              <div>
                <p className="text-sm text-muted-foreground mb-3">Input Field</p>
                <Input placeholder="Enter your email" className="bg-input-background" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">Search Input</p>
                <div className="relative">
                  <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input placeholder="Search products..." className="pl-10 bg-input-background" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-3">Disabled Input</p>
                <Input placeholder="Disabled input" disabled className="bg-input-background" />
              </div>
            </div>
          </Card>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="font-['Poppins'] text-3xl mb-6">Cards</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white border border-border">
              <h3 className="font-['Lato'] mb-2">Default Card</h3>
              <p className="text-sm text-foreground/70">
                Cards with subtle shadows and beige backgrounds
              </p>
            </Card>

            <Card className="p-6 bg-white border border-border hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-['Lato'] mb-2">Hoverable Card</h3>
              <p className="text-sm text-foreground/70">
                Interactive cards with hover effects
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-primary to-olive-green text-white border-0">
              <h3 className="font-['Lato'] mb-2">Gradient Card</h3>
              <p className="text-sm text-white/90">
                For call-to-action sections
              </p>
            </Card>
          </div>
        </section>

        {/* Badges */}
        <section className="mb-16">
          <h2 className="font-['Poppins'] text-3xl mb-6">Badges</h2>
          <Card className="p-8 bg-white border border-border">
            <div className="flex flex-wrap gap-4">
              <Badge className="bg-primary text-white">Primary</Badge>
              <Badge className="bg-secondary text-secondary-foreground">Secondary</Badge>
              <Badge className="bg-olive-green text-white">Success</Badge>
              <Badge className="bg-golden-harvest text-white">Warning</Badge>
              <Badge className="bg-destructive text-white">Error</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </Card>
        </section>

        {/* Icons */}
        <section className="mb-16">
          <h2 className="font-['Poppins'] text-3xl mb-6">Icons</h2>
          <Card className="p-8 bg-white border border-border">
            <p className="text-sm text-muted-foreground mb-4">Using Lucide React Icons</p>
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col items-center space-y-2">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <Leaf className="w-8 h-8 text-primary" />
                </div>
                <span className="text-sm">Leaf</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="bg-accent/10 p-4 rounded-lg">
                  <ShoppingCart className="w-8 h-8 text-accent" />
                </div>
                <span className="text-sm">Cart</span>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="bg-golden-harvest/10 p-4 rounded-lg">
                  <User className="w-8 h-8 text-golden-harvest" />
                </div>
                <span className="text-sm">User</span>
              </div>
            </div>
          </Card>
        </section>

        {/* Layout */}
        <section className="mb-16">
          <h2 className="font-['Poppins'] text-3xl mb-6">Layout Guidelines</h2>
          <Card className="p-8 bg-white border border-border">
            <div className="space-y-4 text-foreground/80">
              <div>
                <h4 className="font-['Lato'] mb-2">Grid System</h4>
                <p className="text-sm">12-column grid, 1200px max width for desktop</p>
              </div>
              <div>
                <h4 className="font-['Lato'] mb-2">Spacing</h4>
                <p className="text-sm">Consistent spacing using Tailwind's spacing scale (4px base unit)</p>
              </div>
              <div>
                <h4 className="font-['Lato'] mb-2">Border Radius</h4>
                <p className="text-sm">12px (0.75rem) for cards and buttons</p>
              </div>
              <div>
                <h4 className="font-['Lato'] mb-2">Shadows</h4>
                <p className="text-sm">Subtle drop shadows (0px 2px 6px rgba(0,0,0,0.08))</p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
