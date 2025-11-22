require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

// Orders - FIXED: Added _id: false to prevent _id in items array
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
        price: Number,
        sellerId: String, // Added to track which seller this item belongs to
        itemStatus: { type: String, default: 'Pending' }, // Individual item status
        _id: false  // This prevents Mongoose from adding _id to each item
      }
    ],
    total: Number,
    status: String,
    date: String,
    shippingAddress: String,
    paymentMethod: String  // Added this field
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
//  Auth helpers (JWT, middleware, RBAC)
// -------------------
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email, iat, exp }
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
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
    const token = generateToken(user);

    res.status(201).json({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  token
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

    const token = generateToken(user);

    res.json({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  token
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
app.get("/api/users/:userId", auth, async (req, res) => {
  if (req.user.id !== req.params.userId) {
    return res.status(403).json({ error: "You can only view your own profile" });
  }
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
app.put("/api/users/:userId", auth, async (req, res) => {
  if (req.user.id !== req.params.userId) {
    return res.status(403).json({ error: "You can only update your own profile" });
  }
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
app.post("/api/products", auth, requireRole("seller"), async (req, res) => {

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
app.patch("/api/products/:id", auth, requireRole("seller"), async (req, res) => {
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
app.delete("/api/products/:id", auth, requireRole("seller"), async (req, res) => {
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

// NEW: Get all orders for a user (this is what the frontend expects)
// GET /api/users/:userId/orders
app.get("/api/users/:userId/orders", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // 🔒 Make sure user can only see their OWN orders
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "You can only view your own orders" });
    }

    console.log('📦 Fetching orders for user (customerId):', userId);

    const orders = await Order.find({ customerId: userId }).lean();
    console.log(`📦 Found ${orders.length} orders for user`);

    res.json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});


// Existing: Get all orders for a user (legacy route)
app.get("/api/orders/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.userId }).lean();
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get orders for a seller (orders containing their products)
app.get("/api/sellers/:sellerId/orders", auth, requireRole("seller"), async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    console.log('📦 Fetching orders for seller:', sellerId);
    
    // First get all products by this seller
    const sellerProducts = await Product.find({ sellerId }).lean();
    const sellerProductIds = sellerProducts.map(p => p.id);
    
    console.log('🛍️ Seller products:', sellerProductIds);
    
    if (sellerProductIds.length === 0) {
      console.log('❌ No products found for seller');
      return res.json([]); // No products, no orders
    }
    
    // Find all orders that contain products from this seller
    const orders = await Order.find({
      "items.productId": { $in: sellerProductIds }
    }).lean();
    
    console.log(`📋 Found ${orders.length} orders containing seller's products`);
    
    // Return the COMPLETE orders with ALL item details including itemStatus and sellerId
    const sellerOrders = orders.map(order => {
      console.log(`📦 Processing order ${order.id} with items:`, order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        itemStatus: item.itemStatus,
        sellerId: item.sellerId
      })));
      
      // Return the complete order - don't filter items, show all items but highlight seller's items
      const orderWithSellerInfo = {
        ...order,
        // Keep ALL items so seller can see the complete order context
        items: order.items.map(item => ({
          ...item,
          isSellerItem: sellerProductIds.includes(item.productId) // Flag seller's items
        })),
        // Calculate seller's portion of the order total
        sellerTotal: order.items
          .filter(item => sellerProductIds.includes(item.productId))
          .reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };
      
      console.log(`✅ Processed order ${order.id} for seller view`);
      return orderWithSellerInfo;
    });
    
    console.log('✅ Returning seller orders:', sellerOrders.length);
    res.json(sellerOrders);
  } catch (err) {
    console.error("Error fetching seller orders:", err);
    res.status(500).json({ error: "Failed to fetch seller orders" });
  }
});


// Update order status (for sellers)
app.patch("/api/orders/:orderId/status", auth, requireRole("seller"), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const updatedOrder = await Order.findOneAndUpdate(
      { id: orderId },
      { status },
      { new: true }
    ).lean();
    
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(updatedOrder);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});


// Update individual item status within an order (for sellers)
app.patch("/api/orders/:orderId/items/:productId/status", auth, requireRole("seller"), async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { itemStatus, sellerId } = req.body;
    
    console.log('=== UPDATING ITEM STATUS ===');
    console.log('Order ID:', orderId);
    console.log('Product ID:', productId);
    console.log('New Status:', itemStatus);
    console.log('Seller ID:', sellerId);
    
    const validItemStatuses = ['Pending', 'Confirmed', 'Being Prepared', 'Ready to Ship', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validItemStatuses.includes(itemStatus)) {
      return res.status(400).json({ error: "Invalid item status" });
    }
    
    // Find the order and update the specific item
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    console.log('Found order with items:', order.items.map(item => ({ 
      productId: item.productId, 
      sellerId: item.sellerId, 
      currentStatus: item.itemStatus 
    })));
    
    // Find the item in the order that belongs to this seller
    const itemIndex = order.items.findIndex(item => 
      item.productId === productId && item.sellerId === sellerId
    );
    
    if (itemIndex === -1) {
      console.log('Item not found. Available items:', order.items);
      return res.status(404).json({ error: "Item not found in order or not owned by seller" });
    }
    
    console.log('Found item at index:', itemIndex, 'Current status:', order.items[itemIndex].itemStatus);
    
    // Update the item status
    order.items[itemIndex].itemStatus = itemStatus;
    console.log('Updated item status to:', itemStatus);
    
    // Auto-update overall order status based on item statuses
    const itemStatuses = order.items.map(item => item.itemStatus);
    console.log('All item statuses after update:', itemStatuses);
    
    // Only update overall order status when ALL items reach certain milestones
    if (itemStatuses.every(status => status === 'Delivered')) {
      order.status = 'Delivered';
      console.log('All items delivered, updating order status to Delivered');
    } else if (itemStatuses.every(status => ['Shipped', 'Delivered'].includes(status))) {
      order.status = 'Shipped';
      console.log('All items shipped/delivered, updating order status to Shipped');
    } else if (itemStatuses.every(status => ['Confirmed', 'Being Prepared', 'Ready to Ship', 'Shipped', 'Delivered'].includes(status))) {
      order.status = 'Confirmed';
      console.log('All items confirmed or beyond, updating order status to Confirmed');
    } else if (itemStatuses.some(status => status === 'Cancelled') && itemStatuses.every(status => ['Cancelled', 'Pending'].includes(status))) {
      order.status = 'Cancelled';
      console.log('Items cancelled/pending, updating order status to Cancelled');
    }
    // If items have mixed statuses, keep the order status as is (usually 'Pending' or 'Confirmed')
    
    await order.save();
    console.log('Order saved with new status:', order.status);
    
    res.json(order);
  } catch (err) {
    console.error("Error updating item status:", err);
    res.status(500).json({ error: "Failed to update item status" });
  }
});


// FIXED: Create a new order + update products/sellers + clear cart
// FIXED: Create a new order + update products/sellers + clear cart
app.post("/api/users/:userId/orders", auth, async (req, res) => {
  const { userId } = req.params;

  // 🔒 Ensure the logged-in user is the same as :userId
  if (req.user.id !== userId) {
    return res.status(403).json({ error: "You can only create orders for your own account" });
  }

  try {
    const newId = generateId("o");
    const { 
      status, 
      date, 
      shippingAddress, 
      customerName,
      paymentMethod  // Added this field
    } = req.body;

    // 🔹 1) LOAD CART FROM DB – this is the source of truth for quantities
    const cart = await Cart.findOne({ userId }).lean();
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty, cannot create order" });
    }

    // 🔹 2) ENRICH ITEMS USING CART DATA (correct quantities)
    const enrichedItems = [];
    let totalFromCart = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findOne({ id: cartItem.productId });
      if (!product) continue;

      const qty = Number(cartItem.quantity || 0);
      const price = Number(cartItem.price || product.price || 0);
      const lineTotal = qty * price;
      totalFromCart += lineTotal;

      enrichedItems.push({
        productId: cartItem.productId,
        productName: cartItem.name || product.name,
        quantity: qty,
        price: price,
        sellerId: product.sellerId,
        itemStatus: 'Pending'
      });
    }

    if (!enrichedItems.length) {
      return res.status(400).json({ error: "No valid items in cart" });
    }

    // If frontend sent total, nice, but we trust our own calculation
    const finalTotal = typeof req.body.total === "number" ? req.body.total : totalFromCart;

    // 🔹 3) CREATE ORDER WITH ENRICHED ITEMS
    const order = await Order.create({
      id: newId,
      customerId: userId,
      customerName: customerName || "Unknown",
      items: enrichedItems,
      total: finalTotal,
      status: status || "Pending",
      date: date || new Date().toISOString(),
      shippingAddress: shippingAddress || "",
      paymentMethod: paymentMethod || "Cash on Delivery"
    });

    // 🔹 4) UPDATE PRODUCT STOCK + COLLECT SELLER REVENUE (using correct qty)
    const sellerRevenue = {}; // { sellerId: totalRevenue }

    for (const item of enrichedItems) {
      const { productId, quantity, price, sellerId } = item;
      if (!productId || !quantity) continue;

      const product = await Product.findOne({ id: productId });
      if (!product) continue;

      const currentStock = typeof product.stock === "number" ? product.stock : 0;
      const qty = Number(quantity) || 0;
      const newStock = Math.max(0, currentStock - qty);

      console.log(
        `Updating stock for product ${productId}: current=${currentStock}, qty=${qty}, new=${newStock}`
      );

      product.stock = newStock;
      await product.save();

      if (sellerId) {
        const revenue = (price || 0) * qty;
        sellerRevenue[sellerId] = (sellerRevenue[sellerId] || 0) + revenue;
      }
    }

    // 🔹 5) UPDATE SELLERS' totalSales
    const sellerIds = Object.keys(sellerRevenue);
    for (const sellerId of sellerIds) {
      const seller = await Seller.findOne({ id: sellerId });
      if (!seller) continue;

      const currentTotal = typeof seller.totalSales === "number" ? seller.totalSales : 0;
      seller.totalSales = currentTotal + sellerRevenue[sellerId];
      await seller.save();
    }

    // 🔹 6) CLEAR USER'S CART
    await Cart.findOneAndDelete({ userId });

    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order and updating data:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});



// ----- CART (NEW IMPROVED SCHEMA) -----

// Get cart for a user
app.get("/api/users/:userId/cart", auth, async (req, res) => {
  try {
    console.log('=== CART GET ROUTE HIT ===');
    console.log('User ID:', req.params.userId);

    const { userId } = req.params;

    // 🔒 User can only see their own cart
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "You can only view your own cart" });
    }

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
});


// Add item to cart
app.post("/api/users/:userId/cart", auth, async (req, res) => {
  try {
    console.log('=== CART POST ROUTE HIT ===');
    console.log('User ID:', req.params.userId);
    console.log('Request body:', req.body);
    
    const { userId } = req.params;

    // 🔒 User can only modify their own cart
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "You can only modify your own cart" });
    }

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
app.patch("/api/users/:userId/cart/:productId", auth, async (req, res) => {
  try {
    const { userId, productId } = req.params;

    // 🔒 Only owner can change cart
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "You can only modify your own cart" });
    }

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
app.delete("/api/users/:userId/cart/:productId", auth, async (req, res) => {
  try {
    const { userId, productId } = req.params;

    // 🔒 Only owner can modify
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "You can only modify your own cart" });
    }

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
app.delete("/api/users/:userId/cart", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // 🔒 Only owner can clear their cart
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "You can only clear your own cart" });
    }

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
