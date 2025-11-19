// Mock data for the marketplace

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  sellerId?: string;
  sellerName?: string;
  stock?: number;
  rating?: number;
  reviews?: { rating: number; comment?: string }[];
}

export interface Seller {
  id: string;
  name: string;
  type: 'farmer' | 'artisan';
  description: string;
  location: string;
  image: string;
  contactEmail: string;
  contactPhone: string;
  rating: number;
  totalSales: number;
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'Pending' | 'Confirmed' | 'On Delivery' | 'Received';
  date: string;
  shippingAddress: string;
}

export const sellers: Seller[] = [
  {
    id: '1',
    name: 'Ahmed\'s Fresh Farm',
    type: 'farmer',
    description: 'Organic vegetables and fruits grown with love in the heart of Bahrain',
    location: 'Saar, Bahrain',
    image: 'https://images.unsplash.com/photo-1618496899001-b58ebcbeef26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXIlMjBwb3J0cmFpdCUyMGhhcHB5fGVufDF8fHx8MTc2MjE1NzY1NHww&ixlib=rb-4.1.0&q=80&w=1080',
    contactEmail: 'ahmed@freshfarm.bh',
    contactPhone: '+973 3333 4444',
    rating: 4.8,
    totalSales: 156
  },
  {
    id: '2',
    name: 'Fatima\'s Pottery Studio',
    type: 'artisan',
    description: 'Handcrafted pottery with traditional Bahraini designs',
    location: 'Manama, Bahrain',
    image: 'https://images.unsplash.com/photo-1761410403735-108d974d9a76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwY3JhZnRzcGVyc29uJTIwd29ya2luZ3xlbnwxfHx8fDE3NjIxNTc2NTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    contactEmail: 'fatima@pottery.bh',
    contactPhone: '+973 3333 5555',
    rating: 4.9,
    totalSales: 89
  },
  {
    id: '3',
    name: 'Al Khaleej Honey',
    type: 'farmer',
    description: 'Pure, natural honey from local beekeepers',
    location: 'Riffa, Bahrain',
    image: 'https://images.unsplash.com/photo-1618496899001-b58ebcbeef26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXIlMjBwb3J0cmFpdCUyMGhhcHB5fGVufDF8fHx8MTc2MjE1NzY1NHww&ixlib=rb-4.1.0&q=80&w=1080',
    contactEmail: 'info@alkhaleeghoney.bh',
    contactPhone: '+973 3333 6666',
    rating: 4.7,
    totalSales: 203
  }
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Fresh Organic Tomatoes',
    price: 2.50,
    category: 'Fresh Produce',
    image: 'https://images.unsplash.com/photo-1549248581-cf105cd081f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHZlZ2V0YWJsZXMlMjBmYXJtZXJzJTIwbWFya2V0fGVufDF8fHx8MTc2MjExMDU5NXww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Locally grown organic tomatoes, fresh from the farm. Perfect for salads and cooking.',
    sellerId: '1',
    sellerName: 'Ahmed\'s Fresh Farm',
    stock: 50,
    rating: 4.8,
    reviews: [
      {
        id: 'r1',
        customerId: 'c1',
        customerName: 'Sara Ali',
        rating: 5,
        comment: 'Best tomatoes I\'ve ever tasted! So fresh and flavorful.',
        date: '2025-10-28'
      }
    ]
  },
  {
    id: '2',
    name: 'Handmade Ceramic Bowl Set',
    price: 45.00,
    category: 'Handmade Crafts',
    image: 'https://images.unsplash.com/photo-1678791673777-57274271e434?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMHBvdHRlcnklMjBjcmFmdHN8ZW58MXx8fHwxNzYyMTU3NjUyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Beautiful set of 4 handcrafted ceramic bowls with traditional Bahraini patterns.',
    sellerId: '2',
    sellerName: 'Fatima\'s Pottery Studio',
    stock: 12,
    rating: 4.9,
    reviews: [
      {
        id: 'r2',
        customerId: 'c2',
        customerName: 'Mohammed Hassan',
        rating: 5,
        comment: 'Absolutely stunning craftsmanship!',
        date: '2025-10-25'
      }
    ]
  },
  {
    id: '3',
    name: 'Pure Natural Honey',
    price: 18.00,
    category: 'Fresh Produce',
    image: 'https://images.unsplash.com/photo-1645549826194-1956802d83c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob25leSUyMGphciUyMG9yZ2FuaWN8ZW58MXx8fHwxNzYyMTU3NjUzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Raw, unfiltered honey from local beehives. 500g jar of pure golden goodness.',
    sellerId: '3',
    sellerName: 'Al Khaleej Honey',
    stock: 30,
    rating: 4.7,
    reviews: []
  },
  {
    id: '4',
    name: 'Organic Mixed Vegetables',
    price: 8.50,
    category: 'Fresh Produce',
    image: 'https://images.unsplash.com/photo-1626132661848-cc00e454c2c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2NhbCUyMGZhcm0lMjBwcm9kdWNlfGVufDF8fHx8MTc2MjE1Mzc2NHww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Fresh seasonal vegetables bundle including carrots, zucchini, and bell peppers.',
    sellerId: '1',
    sellerName: 'Ahmed\'s Fresh Farm',
    stock: 25,
    rating: 4.6,
    reviews: []
  },
  {
    id: '5',
    name: 'Handwoven Basket',
    price: 32.00,
    category: 'Handmade Crafts',
    image: 'https://images.unsplash.com/photo-1743485754062-b6ad79fd3278?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwaGFuZG1hZGUlMjBiYXNrZXR8ZW58MXx8fHwxNzYyMTU3NjUzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Artisan handwoven basket made from natural palm leaves.',
    sellerId: '2',
    sellerName: 'Fatima\'s Pottery Studio',
    stock: 8,
    rating: 4.8,
    reviews: []
  },
  {
    id: '6',
    name: 'Fresh Dates Premium',
    price: 12.50,
    category: 'Fresh Produce',
    image: 'https://images.unsplash.com/photo-1629139195238-3c7c784fdd2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGRhdGVzJTIwZnJ1aXR8ZW58MXx8fHwxNzYyMTU3NjU0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Premium quality Bahraini dates, naturally sweet and nutritious.',
    sellerId: '1',
    sellerName: 'Ahmed\'s Fresh Farm',
    stock: 40,
    rating: 4.9,
    reviews: []
  }
];

export const orders: Order[] = [
  {
    id: 'ORD001',
    customerId: 'c1',
    customerName: 'Sara Ali',
    items: [
      {
        productId: '1',
        productName: 'Fresh Organic Tomatoes',
        quantity: 3,
        price: 2.50
      },
      {
        productId: '4',
        productName: 'Organic Mixed Vegetables',
        quantity: 1,
        price: 8.50
      }
    ],
    total: 16.00,
    status: 'Confirmed',
    date: '2025-11-01',
    shippingAddress: 'Building 123, Road 45, Manama, Bahrain'
  },
  {
    id: 'ORD002',
    customerId: 'c2',
    customerName: 'Mohammed Hassan',
    items: [
      {
        productId: '2',
        productName: 'Handmade Ceramic Bowl Set',
        quantity: 1,
        price: 45.00
      }
    ],
    total: 45.00,
    status: 'On Delivery',
    date: '2025-10-30',
    shippingAddress: 'Villa 67, Saar, Bahrain'
  }
];
