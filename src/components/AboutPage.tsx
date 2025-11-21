import { Card } from './ui/card';

interface AboutPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 space-y-8">
      <h1 className="text-3xl font-bold mb-2">About Local Harvest</h1>
      <p className="text-muted-foreground">
        Local Harvest is a marketplace that connects farmers and artisans in Bahrain
        with customers who value fresh, local, and sustainable products. Our goal is
        to make it easy to discover and support small local businesses.
      </p>

      <Card className="p-6 space-y-3">
        <h2 className="text-xl font-semibold">Our Mission</h2>
        <p className="text-sm text-muted-foreground">
          We want to empower local producers by giving them a modern, digital storefront,
          while giving customers access to high-quality products with transparent origins.
        </p>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="text-xl font-semibold">What You&apos;ll Find</h2>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Fresh produce from local farms</li>
          <li>Handmade crafts and artisan products</li>
          <li>Honey, preserves, and other speciality foods</li>
          <li>Sellers who care about quality and community</li>
        </ul>
      </Card>

      <button
        onClick={() => onNavigate('products')}
        className="text-primary text-sm underline"
      >
        Browse the marketplace →
      </button>
    </div>
  );
}
