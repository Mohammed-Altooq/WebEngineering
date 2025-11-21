import { Card } from './ui/card';

interface FaqPageProps {
  onNavigate: (page: string, param?: string) => void;
}

const faqs = [
  {
    q: 'How do I place an order?',
    a: 'Browse products, add items to your cart, then proceed to checkout to confirm your order.',
  },
  {
    q: 'How do I become a seller?',
    a: 'Create an account and register as a seller. After approval, you can add and manage your products.',
  },
  {
    q: 'Where are the products sourced from?',
    a: 'Products are provided directly by local farmers and artisans registered on Local Harvest.',
  },
  {
    q: 'How do I contact support?',
    a: 'You can reach us via email at info@localharvest.bh or by phone at +973 3333 7777.',
  },
];

export function FaqPage({ onNavigate }: FaqPageProps) {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 space-y-8">
      <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
      <p className="text-muted-foreground">
        Find answers to common questions about using Local Harvest as a customer or seller.
      </p>

      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <Card key={idx} className="p-4 space-y-2">
            <h2 className="font-semibold">{item.q}</h2>
            <p className="text-sm text-muted-foreground">{item.a}</p>
          </Card>
        ))}
      </div>

      <button
        onClick={() => onNavigate('home')}
        className="text-primary text-sm underline"
      >
        Back to home →
      </button>
    </div>
  );
}
