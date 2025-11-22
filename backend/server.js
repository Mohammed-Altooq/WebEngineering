require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase from default 100kb to 10mb
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Also increase urlencoded limit

// -------------------
//  MongoDB Connection
// -------------------
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("❌ MONGODB_URI is not set in .env");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// -------------------
//  Schemas & Models
// -------------------

// Users: updated for authentication + phone field
const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'seller'], required: true },
    phone: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "users" }
);
const User = mongoose.model("User", userSchema);

// Sellers
const sellerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: String,
    type: String,
    description: String,
    location: String,
    image: String,
    contactEmail: String,
    contactPhone: String,
    rating: Number,
    totalSales: Number
  },
  { collection: "sellers" }
);
const Seller = mongoose.model("Seller", sellerSchema);

// Products
const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: String,
    price: Number,
    category: String,
    image: String,
    description: String,
    sellerId: String,
    sellerName: String,
    stock: Number,
    rating: Number
  },
  { collection: "products" }
);
const Product = mongoose.model("Product", productSchema);

// Reviews
const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    productId: String,
    customerId: String,
    customerName: String,
    rating: Number,
    comment: String,
    date: String
  },
  { collection: "reviews" }
);
const Review = mongoose.model("Review", reviewSchema);

// Orders
const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    customerId: String,
    customerName: String,
    items: [
      {
        productId: String,
        productName: String,
        quantity: Number,
        price: Number
      }
    ],
    total: Number,
    status: String,
    date: String,
    shippingAddress: String
  },
  { collection: "orders" }
);
const Order = mongoose.model("Order", orderSchema);

// UPDATED Cart Schema - One cart per user with items array
const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true }, // One cart per user
    items: [
      {
        productId: String,
        name: String,
        price: Number,
        image: String,
        sellerName: String,
        quantity: Number,
        stock: Number
      }
    ],
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: "cartItems" }
);
const Cart = mongoose.model("Cart", cartSchema);

// -------------------
//  Helper: ID generator
// -------------------
function generateId(prefix) {
  return prefix + Date.now().toString();
}

// -------------------
//  Authentication Routes
// -------------------

// Register endpoint
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userId = generateId("u");

    const user = await User.create({
      id: userId,
      name,
      email,
      password: hashedPassword,
      role
    });

    if (role === 'seller') {
      const sellerId = generateId("s");
      await Seller.create({
        id: sellerId,
        name,
        type: "artisan",
        description: "",
        location: "",
        image: "",
        contactEmail: email,
        contactPhone: "",
        rating: 0,
        totalSales: 0
      });
    }

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

// -------------------
//  USER PROFILE Routes
// -------------------

// Get user profile by ID
app.get("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ id: userId }).lean();
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...userResponse } = user;
    res.json(userResponse);

  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Update user profile by ID
app.put("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone } = req.body;

    const updateData = { name, email };
    if (phone) updateData.phone = phone;

    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...userResponse } = updatedUser;
    res.json(userResponse);

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// -------------------
//  Routes
// -------------------

// Simple health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Marketplace API is running" });
});

// ----- PRODUCTS -----

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get a single product by custom id
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id }).lean();
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create a new product
app.post("/api/products", async (req, res) => {
  try {
    const newId = generateId("p");
    const product = await Product.create({
      ...req.body,
      id: newId
    });
    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update product by custom id
app.patch("/api/products/:id", async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product by custom id
app.delete("/api/products/:id", async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ id: req.params.id }).lean();
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ----- SELLERS -----

// Get all sellers
app.get("/api/sellers", async (req, res) => {
  try {
    const sellers = await Seller.find().lean();
    res.json(sellers);
  } catch (err) {
    console.error("Error fetching sellers:", err);
    res.status(500).json({ error: "Failed to fetch sellers" });
  }
});

// Get one seller by id
app.get("/api/sellers/:id", async (req, res) => {
  try {
    const seller = await Seller.findOne({ id: req.params.id }).lean();
    if (!seller) return res.status(404).json({ error: "Seller not found" });
    res.json(seller);
  } catch (err) {
    console.error("Error fetching seller:", err);
    res.status(500).json({ error: "Failed to fetch seller" });
  }
});

// Products by seller
app.get("/api/sellers/:id/products", async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.params.id }).lean();
    res.json(products);
  } catch (err) {
    console.error("Error fetching seller products:", err);
    res.status(500).json({ error: "Failed to fetch seller products" });
  }
});

app.patch("/api/sellers/:id", async (req, res) => {
  try {
    const updated = await Seller.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: "Seller not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating seller:", err);
    res.status(500).json({ error: "Failed to update seller" });
  }
});

// ----- REVIEWS -----

// Reviews for a product (one per customerId, show latest)
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const productId = req.params.id;

    // get all, newest first
    const raw = await Review.find({ productId })
      .sort({ date: -1 })
      .lean();

    // keep only the latest review per customerId
    const map = new Map(); // customerId -> review
    for (const r of raw) {
      if (!map.has(r.customerId)) {
        map.set(r.customerId, r);
      }
    }

    const reviews = Array.from(map.values());
    res.json(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});


// Create OR update a review for a product (one review per user)
// and keep Product.rating as the average of unique (latest) reviews
app.post("/api/products/:id/reviews", async (req, res) => {
  try {
    const productId = req.params.id;
    const { rating, comment, customerId, customerName } = req.body;

    // basic validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    if (!customerId) {
      return res.status(400).json({ error: "customerId is required" });
    }

    // 1) check if this user already reviewed this product
    let existing = await Review.findOne({ productId, customerId });

    let review;
    if (existing) {
      // update existing review
      existing.rating = rating;
      existing.comment = comment;
      existing.customerName = customerName || existing.customerName;
      existing.date = new Date().toISOString();
      await existing.save();
      review = existing;
    } else {
      // create new review
      const newId = generateId("r");
      review = await Review.create({
        id: newId,
        productId,
        customerId,
        customerName,
        rating,
        comment,
        date: new Date().toISOString(),
      });
    }

    // 2) recompute average rating using ONLY the latest review per customer
    const raw = await Review.find({ productId })
      .sort({ date: -1 })  // newest first
      .lean();

    const map = new Map(); // customerId -> latest review
    for (const r of raw) {
      if (!map.has(r.customerId)) {
        map.set(r.customerId, r);
      }
    }

    const uniqueReviews = Array.from(map.values());
    const avgRating =
      uniqueReviews.length > 0
        ? uniqueReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
          uniqueReviews.length
        : 0;

    // 3) store the new average on the product
    await Product.findOneAndUpdate(
      { id: productId },
      { rating: avgRating },
      { new: true }
    );

    // 4) send back review + new average
    res.status(existing ? 200 : 201).json({ review, avgRating });
  } catch (err) {
    console.error("Error creating/updating review:", err);
    res.status(500).json({ error: "Failed to save review" });
  }
});




// ----- ORDERS -----

// Get all orders for a user
app.get("/api/orders/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.userId }).lean();
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Create a new order + update products/sellers + clear cart
app.post("/api/users/:userId/orders", async (req, res) => {
  const { userId } = req.params;

  try {
    const newId = generateId("o");
    const { items = [], total, status, date, shippingAddress, customerName } = req.body;

    if (!items.length) {
      return res.status(400).json({ error: "Order must contain at least one item" });
    }

    // 1) CREATE ORDER
    const order = await Order.create({
      id: newId,
      customerId: userId,
      customerName: customerName || "Unknown",
      items,
      total,
      status: status || "Pending",
      date: date || new Date().toISOString(),
      shippingAddress: shippingAddress || ""
    });

    // 2) UPDATE PRODUCT STOCK + COLLECT SELLER REVENUE
    const sellerRevenue = {}; // { sellerId: totalRevenue }

    for (const item of items) {
      const { productId, quantity, price } = item;
      if (!productId || !quantity) continue;

      const product = await Product.findOne({ id: productId });
      if (!product) continue;

      // Update stock
      const currentStock = typeof product.stock === "number" ? product.stock : 0;
      const newStock = Math.max(0, currentStock - quantity);
      product.stock = newStock;
      await product.save();

      // Accumulate revenue per seller
      if (product.sellerId) {
        const revenue = (price || 0) * quantity;
        sellerRevenue[product.sellerId] = (sellerRevenue[product.sellerId] || 0) + revenue;
      }
    }

    // 3) UPDATE SELLERS' totalSales
    const sellerIds = Object.keys(sellerRevenue);
    for (const sellerId of sellerIds) {
      const seller = await Seller.findOne({ id: sellerId });
      if (!seller) continue;

      const currentTotal = typeof seller.totalSales === "number" ? seller.totalSales : 0;
      seller.totalSales = currentTotal + sellerRevenue[sellerId];
      await seller.save();
    }

    // 4) CLEAR USER'S CART
    await Cart.findOneAndDelete({ userId });

    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order and updating data:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});


// ----- CART (NEW IMPROVED SCHEMA) -----

// Get cart for a user
app.get("/api/users/:userId/cart", async (req, res) => {
  try {
    console.log('=== CART GET ROUTE HIT ===');
    console.log('User ID:', req.params.userId);
    
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId }).lean();
    console.log('Cart found:', cart);
    
    if (!cart) {
      console.log('No cart found, returning empty items');
      return res.json({ items: [] });
    }
    
    res.json({ items: cart.items || [] });
    
  } catch (err) {
    console.error("❌ Error in cart GET route:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
}); // FIXED: Added missing closing brace

// Add item to cart
app.post("/api/users/:userId/cart", async (req, res) => {
  try {
    console.log('=== CART POST ROUTE HIT ===');
    console.log('User ID:', req.params.userId);
    console.log('Request body:', req.body);
    
    const { userId } = req.params;
    const { productId, name, price, image, sellerName, quantity, stock } = req.body;

    let cart = await Cart.findOne({ userId });
    console.log('Existing cart:', cart);

    if (!cart) {
      // Create new cart for user
      console.log('Creating new cart for user');
      cart = await Cart.create({
        userId,
        items: [{
          productId,
          name,
          price,
          image,
          sellerName,
          quantity,
          stock
        }]
      });
      console.log('New cart created:', cart);
    } else {
      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
      
      if (existingItemIndex > -1) {
        // Update existing item quantity
        console.log('Updating existing item quantity');
        cart.items[existingItemIndex].quantity = Math.min(
          cart.items[existingItemIndex].quantity + quantity,
          stock
        );
      } else {
        // Add new item to cart
        console.log('Adding new item to cart');
        cart.items.push({
          productId,
          name,
          price,
          image,
          sellerName,
          quantity,
          stock
        });
      }

      cart.updatedAt = new Date();
      await cart.save();
      console.log('Cart updated:', cart);
    }

    res.status(201).json({ message: "Item added to cart", cart });
  } catch (err) {
    console.error("❌ Error adding to cart:", err);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

// Update item quantity in cart
app.patch("/api/users/:userId/cart/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: "Cart updated", cart });
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

// Remove item from cart
app.delete("/api/users/:userId/cart/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.updatedAt = new Date();
    await cart.save();

    res.json({ message: "Item removed from cart", cart });
  } catch (err) {
    console.error("Error removing from cart:", err);
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
});

// Clear entire cart
app.delete("/api/users/:userId/cart", async (req, res) => {
  try {
    const { userId } = req.params;
    await Cart.findOneAndDelete({ userId });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("Error clearing cart:", err);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

// -------------------
//  Start server
// -------------------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});