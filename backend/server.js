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
//  Authentication Routes - TRANSACTION SAFE
// -------------------

// Register endpoint - TRANSACTION SAFE
app.post("/api/auth/register", async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const result = await session.withTransaction(async () => {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        throw new Error("All fields are required");
      }

      const existingUser = await User.findOne({ email }).session(session);
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const userId = generateId("u");

      const user = await User.create([{
        id: userId,
        name,
        email,
        password: hashedPassword,
        role
      }], { session });

      if (role === 'seller') {
        const sellerId = generateId("s");
        await Seller.create([{
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
        }], { session });
      }

      return user[0];
    });

    res.status(201).json({
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role
    });

  } catch (err) {
    console.error("Registration error:", err);
    if (err.message.includes("required") || err.message.includes("exists")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to register user" });
  } finally {
    await session.endSession();
  }
});

// Login endpoint (NO TRANSACTION NEEDED - just reading)
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

// Get user profile by ID (NO TRANSACTION NEEDED - just reading)
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

// Update user profile by ID (NO TRANSACTION NEEDED - single collection)
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

// Get all products (NO TRANSACTION NEEDED - just reading)
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get a single product by custom id (NO TRANSACTION NEEDED - just reading)
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

// Create a new product (NO TRANSACTION NEEDED - single collection)
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

// Update product by custom id (NO TRANSACTION NEEDED - single collection)
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

// Delete product by custom id (NO TRANSACTION NEEDED - single collection)
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

// Get all sellers (NO TRANSACTION NEEDED - just reading)
app.get("/api/sellers", async (req, res) => {
  try {
    const sellers = await Seller.find().lean();
    res.json(sellers);
  } catch (err) {
    console.error("Error fetching sellers:", err);
    res.status(500).json({ error: "Failed to fetch sellers" });
  }
});

// Get one seller by id (NO TRANSACTION NEEDED - just reading)
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

// Products by seller (NO TRANSACTION NEEDED - just reading)
app.get("/api/sellers/:id/products", async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.params.id }).lean();
    res.json(products);
  } catch (err) {
    console.error("Error fetching seller products:", err);
    res.status(500).json({ error: "Failed to fetch seller products" });
  }
});

// Update seller (NO TRANSACTION NEEDED - single collection)
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

// Reviews for a product (NO TRANSACTION NEEDED - just reading)
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

// Create OR update a review for a product - TRANSACTION SAFE
app.post("/api/products/:id/reviews", async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const result = await session.withTransaction(async () => {
      const productId = req.params.id;
      const { rating, comment, customerId, customerName } = req.body;

      // basic validation
      if (!rating || rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }
      if (!customerId) {
        throw new Error("customerId is required");
      }

      // 1) check if this user already reviewed this product
      let existing = await Review.findOne({ productId, customerId }).session(session);

      let review;
      if (existing) {
        // update existing review
        existing.rating = rating;
        existing.comment = comment;
        existing.customerName = customerName || existing.customerName;
        existing.date = new Date().toISOString();
        await existing.save({ session });
        review = existing;
      } else {
        // create new review
        const newId = generateId("r");
        const newReview = await Review.create([{
          id: newId,
          productId,
          customerId,
          customerName,
          rating,
          comment,
          date: new Date().toISOString(),
        }], { session });
        review = newReview[0];
      }

      // 2) recompute average rating using ONLY the latest review per customer
      const raw = await Review.find({ productId })
        .sort({ date: -1 })  // newest first
        .session(session)
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

      // 3) store the new average on the product (within transaction)
      await Product.findOneAndUpdate(
        { id: productId },
        { rating: avgRating },
        { new: true, session }
      );

      return { review, avgRating };
    });

    // 4) send back review + new average
    res.status(result.review.isNew !== false ? 201 : 200).json(result);

  } catch (err) {
    console.error("Error creating/updating review:", err);
    if (err.message.includes("Rating must") || err.message.includes("required")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to save review" });
  } finally {
    await session.endSession();
  }
});

// ----- ORDERS -----

// Get all orders for a user (NO TRANSACTION NEEDED - just reading)
app.get("/api/users/:userId/orders", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📦 Fetching orders for user (customerId):', userId);

    const orders = await Order.find({ customerId: userId }).lean();
    console.log(`📦 Found ${orders.length} orders for user`);

    res.json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});

// Legacy route (NO TRANSACTION NEEDED - just reading)
app.get("/api/orders/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.userId }).lean();
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get orders for a seller (NO TRANSACTION NEEDED - just reading)
app.get("/api/sellers/:sellerId/orders", async (req, res) => {
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

// Update order status (NO TRANSACTION NEEDED - single field update)
app.patch("/api/orders/:orderId/status", async (req, res) => {
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

// Update individual item status within an order (NO TRANSACTION NEEDED - single document update)
app.patch("/api/orders/:orderId/items/:productId/status", async (req, res) => {
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

// Create a new order - TRANSACTION SAFE
app.post("/api/users/:userId/orders", async (req, res) => {
  const { userId } = req.params;
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const newId = generateId("o");
      const { 
        items = [], 
        total, 
        status, 
        date, 
        shippingAddress, 
        customerName,
        paymentMethod
      } = req.body;

      if (!items.length) {
        throw new Error("Order must contain at least one item");
      }

      // 1) Get cart items if not provided in body
      let orderItems = items;
      if (!items.length) {
        const cart = await Cart.findOne({ userId }).session(session);
        if (!cart || !cart.items || cart.items.length === 0) {
          throw new Error("Cart is empty, cannot create order");
        }
        orderItems = cart.items;
      }

      // 2) ENRICH ITEMS WITH SELLER INFO AND CHECK/UPDATE STOCK ATOMICALLY
      const enrichedItems = [];
      const sellerRevenue = {};

      for (const item of orderItems) {
        const qty = Number(item.quantity || 0);
        
        // Atomic stock check and update - prevents race conditions
        const updatedProduct = await Product.findOneAndUpdate(
          { 
            id: item.productId,
            stock: { $gte: qty } // Only proceed if enough stock
          },
          { $inc: { stock: -qty } },
          { 
            session,
            new: true
          }
        );

        if (!updatedProduct) {
          throw new Error(`Insufficient stock for ${item.name || item.productName}. Please refresh and try again.`);
        }

        const enrichedItem = {
          productId: item.productId,
          productName: item.name || item.productName || updatedProduct.name,
          quantity: qty,
          price: Number(item.price || updatedProduct.price || 0),
          sellerId: updatedProduct.sellerId,
          itemStatus: 'Pending'
        };
        
        enrichedItems.push(enrichedItem);

        // Track seller revenue
        if (updatedProduct.sellerId) {
          const revenue = enrichedItem.price * qty;
          sellerRevenue[updatedProduct.sellerId] = (sellerRevenue[updatedProduct.sellerId] || 0) + revenue;
        }
      }

      // 3) CREATE ORDER WITH ENRICHED ITEMS (within transaction)
      const finalTotal = total || enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const order = await Order.create([{
        id: newId,
        customerId: userId,
        customerName: customerName || "Unknown",
        items: enrichedItems,
        total: finalTotal,
        status: status || "Pending",
        date: date || new Date().toISOString(),
        shippingAddress: shippingAddress || "",
        paymentMethod: paymentMethod || "Cash on Delivery"
      }], { session });

      // 4) UPDATE SELLERS' TOTAL SALES (within transaction)
      for (const sellerId of Object.keys(sellerRevenue)) {
        await Seller.findOneAndUpdate(
          { id: sellerId },
          { $inc: { totalSales: sellerRevenue[sellerId] } },
          { session }
        );
      }

      // 5) CLEAR USER'S CART (within transaction)
      await Cart.findOneAndDelete({ userId }, { session });

      return order[0];
    });

    res.status(201).json(result);
    
  } catch (err) {
    console.error("Error creating order:", err);
    if (err.message.includes("Insufficient stock") || err.message.includes("must contain") || err.message.includes("Cart is empty")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to create order" });
  } finally {
    await session.endSession();
  }
});

// ----- CART ROUTES -----

// Get cart for a user (NO TRANSACTION NEEDED - just reading)
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
});

// Add item to cart (NO TRANSACTION NEEDED - single collection)
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

// Update item quantity in cart (NO TRANSACTION NEEDED - single collection)
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

// Remove item from cart (NO TRANSACTION NEEDED - single collection)
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

// Clear entire cart (NO TRANSACTION NEEDED - single collection)
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
// CONCURRENCY TESTING ROUTES
// -------------------

// Test concurrent stock updates (demonstrates race conditions)
app.post("/api/test/concurrency", async (req, res) => {
  try {
    const { productId, customerCount = 5 } = req.body;
    
    console.log(`🧪 Testing ${customerCount} customers buying product ${productId} simultaneously`);
    
    // Get initial state
    const initialProduct = await Product.findOne({ id: productId });
    if (!initialProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    console.log(`📦 Initial stock: ${initialProduct.stock}`);
    
    // Create test customers and their carts
    const testCustomers = [];
    for (let i = 0; i < customerCount; i++) {
      const customerId = `test_customer_${Date.now()}_${i}`;
      
      // Create cart for test customer
      await Cart.create({
        userId: customerId,
        items: [{
          productId: productId,
          name: initialProduct.name,
          price: initialProduct.price,
          image: initialProduct.image,
          sellerName: initialProduct.sellerName,
          quantity: 1,
          stock: initialProduct.stock
        }]
      });
      
      testCustomers.push(customerId);
    }
    
    // Test OLD non-transaction method vs NEW transaction method
    const orderPromises = testCustomers.map((customerId, index) => {
      if (index < Math.floor(customerCount / 2)) {
        // Use old method (race condition possible)
        return createTestOrderOldWay(customerId, {
          customerName: `Test Customer ${customerId.slice(-1)}`,
          shippingAddress: "123 Test St",
          paymentMethod: "Test Payment"
        });
      } else {
        // Use new transaction method (race condition safe)
        return createTestOrderNewWay(customerId, {
          customerName: `Test Customer ${customerId.slice(-1)}`,
          shippingAddress: "123 Test St",
          paymentMethod: "Test Payment"
        });
      }
    });
    
    // Execute all orders simultaneously
    console.log("🚀 Executing concurrent orders...");
    const results = await Promise.allSettled(orderPromises);
    
    // Analyze results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    // Check final state
    const finalProduct = await Product.findOne({ id: productId });
    const finalStock = finalProduct ? finalProduct.stock : 0;
    
    // Clean up test data
    await Cart.deleteMany({ userId: { $regex: /^test_customer_/ } });
    await Order.deleteMany({ customerId: { $regex: /^test_customer_/ } });
    
    // Restore original stock (for demo purposes)
    await Product.findOneAndUpdate(
      { id: productId },
      { stock: initialProduct.stock }
    );
    
    const raceConditionOccurred = finalStock !== Math.max(0, initialProduct.stock - successful);
    
    console.log(`📊 Results: ${successful} successful, ${failed} failed`);
    console.log(`📦 Final stock: ${finalStock} (expected: ${Math.max(0, initialProduct.stock - successful)})`);
    console.log(`🚨 Race condition occurred: ${raceConditionOccurred}`);
    
    res.json({
      message: "Concurrency test completed",
      initialStock: initialProduct.stock,
      finalStock: finalStock,
      expectedFinalStock: Math.max(0, initialProduct.stock - successful),
      totalCustomers: customerCount,
      successfulOrders: successful,
      failedOrders: failed,
      raceConditionOccurred: raceConditionOccurred,
      explanation: raceConditionOccurred 
        ? "Race condition detected: Multiple customers got the same product due to non-atomic operations"
        : "No race condition: All operations completed as expected"
    });
    
  } catch (error) {
    console.error("❌ Concurrency test failed:", error);
    res.status(500).json({ error: "Concurrency test failed" });
  }
});

// Helper functions for testing
async function createTestOrderOldWay(customerId, orderData) {
  // This simulates the OLD way (separate read and write operations)
  const cart = await Cart.findOne({ userId: customerId });
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }
  
  const newId = generateId("test_o");
  const enrichedItems = [];
  let total = 0;
  
  for (const cartItem of cart.items) {
    const product = await Product.findOne({ id: cartItem.productId });
    if (!product) continue;
    
    const qty = cartItem.quantity;
    const price = cartItem.price;
    
    // THIS IS WHERE RACE CONDITIONS HAPPEN - separate read and write
    if (product.stock < qty) {
      throw new Error("Insufficient stock");
    }
    
    enrichedItems.push({
      productId: cartItem.productId,
      productName: cartItem.name,
      quantity: qty,
      price: price,
      sellerId: product.sellerId,
      itemStatus: 'Pending'
    });
    
    total += qty * price;
  }
  
  // Create order
  const order = await Order.create({
    id: newId,
    customerId: customerId,
    customerName: orderData.customerName,
    items: enrichedItems,
    total: total,
    status: "Pending",
    date: new Date().toISOString(),
    shippingAddress: orderData.shippingAddress,
    paymentMethod: orderData.paymentMethod
  });
  
  // Update stock separately (this creates race condition potential)
  for (const item of enrichedItems) {
    const product = await Product.findOne({ id: item.productId });
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
      await product.save();
    }
  }
  
  // Clear cart
  await Cart.findOneAndDelete({ userId: customerId });
  
  return order;
}

async function createTestOrderNewWay(customerId, orderData) {
  // This uses the NEW transaction-safe method
  const session = await mongoose.startSession();
  
  try {
    const result = await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId: customerId }).session(session);
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }
      
      const newId = generateId("tx_test_o");
      const enrichedItems = [];
      let total = 0;
      
      for (const cartItem of cart.items) {
        const qty = cartItem.quantity;
        const price = cartItem.price;
        
        // Atomic stock check and update - prevents race conditions
        const updatedProduct = await Product.findOneAndUpdate(
          { 
            id: cartItem.productId,
            stock: { $gte: qty }
          },
          { $inc: { stock: -qty } },
          { 
            session,
            new: true
          }
        );
        
        if (!updatedProduct) {
          throw new Error("Insufficient stock (atomic check failed)");
        }
        
        enrichedItems.push({
          productId: cartItem.productId,
          productName: cartItem.name,
          quantity: qty,
          price: price,
          sellerId: updatedProduct.sellerId,
          itemStatus: 'Pending'
        });
        
        total += qty * price;
      }
      
      // Create order within transaction
      const order = await Order.create([{
        id: newId,
        customerId: customerId,
        customerName: orderData.customerName,
        items: enrichedItems,
        total: total,
        status: "Pending",
        date: new Date().toISOString(),
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod
      }], { session });
      
      // Clear cart within transaction
      await Cart.findOneAndDelete({ userId: customerId }, { session });
      
      return order[0];
    });
    
    return result;
  } finally {
    await session.endSession();
  }
}

// -------------------
//  Start server
// -------------------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});