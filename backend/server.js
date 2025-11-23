require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// Users: ONLY customers now
const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer'], required: true, default: 'customer' },
    phone: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: "users" }
);
const User = mongoose.model("User", userSchema);

// Sellers: Now includes authentication fields
const sellerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['seller'], required: true, default: 'seller' },
    phone: { type: String },
    type: { type: String, default: "artisan" },
    description: String,
    location: String,
    image: String,
    contactEmail: String,
    contactPhone: String,
    rating: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
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
        price: Number,
        sellerId: String,
        itemStatus: { type: String, default: 'Pending' },
        _id: false
      }
    ],
    total: Number,
    status: String,
    date: String,
    shippingAddress: String,
    paymentMethod: String
  },
  { collection: "orders" }
);
const Order = mongoose.model("Order", orderSchema);

// Cart
const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
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

// Register customer
app.post("/api/auth/register/customer", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Check if user already exists (check both collections)
    const existingUser = await User.findOne({ email });
    const existingSeller = await Seller.findOne({ email });
    
    if (existingUser || existingSeller) {
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
      role: 'customer',
      phone
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (err) {
    console.error("Customer registration error:", err);
    res.status(500).json({ error: "Failed to register customer" });
  }
});

// Register seller
app.post("/api/auth/register/seller", async (req, res) => {
  try {
    const { name, email, password, phone, type, description, location } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Check if user already exists (check both collections)
    const existingUser = await User.findOne({ email });
    const existingSeller = await Seller.findOne({ email });
    
    if (existingUser || existingSeller) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const sellerId = generateId("s");

    const seller = await Seller.create({
      id: sellerId,
      name,
      email,
      password: hashedPassword,
      role: 'seller',
      phone,
      type: type || "artisan",
      description: description || "",
      location: location || "",
      image: "",
      contactEmail: email,
      contactPhone: phone || "",
      rating: 0,
      totalSales: 0
    });

    res.status(201).json({
      id: seller.id,
      name: seller.name,
      email: seller.email,
      role: seller.role
    });

  } catch (err) {
    console.error("Seller registration error:", err);
    res.status(500).json({ error: "Failed to register seller" });
  }
});

// Unified register endpoint (for backward compatibility)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { role } = req.body;
    
    if (role === 'customer') {
      // Customer registration logic
      const { name, email, password, phone } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      // Check if user already exists (check both collections)
      const existingUser = await User.findOne({ email });
      const existingSeller = await Seller.findOne({ email });
      
      if (existingUser || existingSeller) {
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
        role: 'customer',
        phone
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
      
    } else if (role === 'seller') {
      // Seller registration logic
      const { name, email, password, phone, type, description, location } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      // Check if user already exists (check both collections)
      const existingUser = await User.findOne({ email });
      const existingSeller = await Seller.findOne({ email });
      
      if (existingUser || existingSeller) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const sellerId = generateId("s");

      const seller = await Seller.create({
        id: sellerId,
        name,
        email,
        password: hashedPassword,
        role: 'seller',
        phone,
        type: type || "artisan",
        description: description || "",
        location: location || "",
        image: "",
        contactEmail: email,
        contactPhone: phone || "",
        rating: 0,
        totalSales: 0
      });

      res.status(201).json({
        id: seller.id,
        name: seller.name,
        email: seller.email,
        role: seller.role
      });
      
    } else {
      return res.status(400).json({ error: "Invalid role. Must be 'customer' or 'seller'" });
    }

  } catch (err) {
    console.error("Unified registration error:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Unified login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check both collections for the user
    let user = await User.findOne({ email });
    let userType = 'customer';
    
    if (!user) {
      user = await Seller.findOne({ email });
      userType = 'seller';
    }

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
      role: user.role,
      userType: userType
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

// -------------------
//  USER PROFILE Routes
// -------------------

// Get customer profile by ID
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

// Update customer profile by ID
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
    // Remove sensitive fields
    const safeSellers = sellers.map(seller => {
      const { password, ...safeData } = seller;
      return safeData;
    });
    res.json(safeSellers);
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
    
    // Remove sensitive fields
    const { password, ...safeData } = seller;
    res.json(safeData);
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

// Update seller
app.patch("/api/sellers/:id", async (req, res) => {
  try {
    // Don't allow updating sensitive fields through this endpoint
    const { password, email, role, ...updateData } = req.body;
    
    const updated = await Seller.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    ).lean();
    
    if (!updated) return res.status(404).json({ error: "Seller not found" });
    
    // Remove sensitive fields from response
    const { password: pwd, ...safeData } = updated;
    res.json(safeData);
  } catch (err) {
    console.error("Error updating seller:", err);
    res.status(500).json({ error: "Failed to update seller" });
  }
});

// ----- REVIEWS -----

// Reviews for a product
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    const productId = req.params.id;

    const raw = await Review.find({ productId })
      .sort({ date: -1 })
      .lean();

    const map = new Map();
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

      if (!rating || rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }
      if (!customerId) {
        throw new Error("customerId is required");
      }

      let existing = await Review.findOne({ productId, customerId }).session(session);

      let review;
      if (existing) {
        existing.rating = rating;
        existing.comment = comment;
        existing.customerName = customerName || existing.customerName;
        existing.date = new Date().toISOString();
        await existing.save({ session });
        review = existing;
      } else {
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

      const raw = await Review.find({ productId })
        .sort({ date: -1 })
        .session(session)
        .lean();

      const map = new Map();
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

      await Product.findOneAndUpdate(
        { id: productId },
        { rating: avgRating },
        { new: true, session }
      );

      return { review, avgRating };
    });

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

// Get all orders for a user
app.get("/api/users/:userId/orders", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ customerId: userId }).lean();
    res.json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});

// Get orders for a seller
app.get("/api/sellers/:sellerId/orders", async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const sellerProducts = await Product.find({ sellerId }).lean();
    const sellerProductIds = sellerProducts.map(p => p.id);
    
    if (sellerProductIds.length === 0) {
      return res.json([]);
    }
    
    const orders = await Order.find({
      "items.productId": { $in: sellerProductIds }
    }).lean();
    
    const sellerOrders = orders.map(order => {
      const orderWithSellerInfo = {
        ...order,
        items: order.items.map(item => ({
          ...item,
          isSellerItem: sellerProductIds.includes(item.productId)
        })),
        sellerTotal: order.items
          .filter(item => sellerProductIds.includes(item.productId))
          .reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };
      
      return orderWithSellerInfo;
    });
    
    res.json(sellerOrders);
  } catch (err) {
    console.error("Error fetching seller orders:", err);
    res.status(500).json({ error: "Failed to fetch seller orders" });
  }
});

// Update order status - ENHANCED with item cancellation
app.patch("/api/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const order = await Order.findOne({ id: orderId });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Update order status
    order.status = status;
    
    // If order is being cancelled, update all item statuses to cancelled
    if (status === 'Cancelled') {
      console.log(`🚫 Cancelling order ${orderId} - updating all item statuses to Cancelled`);
      order.items = order.items.map(item => ({
        ...item,
        itemStatus: 'Cancelled'
      }));
    }
    
    const updatedOrder = await order.save();
    console.log(`✅ Order ${orderId} updated to ${status}${status === 'Cancelled' ? ' with all items cancelled' : ''}`);
    
    res.json(updatedOrder);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Update individual item status within an order
app.patch("/api/orders/:orderId/items/:productId/status", async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { itemStatus, sellerId } = req.body;
    
    const validItemStatuses = ['Pending', 'Confirmed', 'Being Prepared', 'Ready to Ship', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validItemStatuses.includes(itemStatus)) {
      return res.status(400).json({ error: "Invalid item status" });
    }
    
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    const itemIndex = order.items.findIndex(item => 
      item.productId === productId && item.sellerId === sellerId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in order or not owned by seller" });
    }
    
    order.items[itemIndex].itemStatus = itemStatus;
    
    const itemStatuses = order.items.map(item => item.itemStatus);
    
    if (itemStatuses.every(status => status === 'Delivered')) {
      order.status = 'Delivered';
    } else if (itemStatuses.every(status => ['Shipped', 'Delivered'].includes(status))) {
      order.status = 'Shipped';
    } else if (itemStatuses.every(status => ['Confirmed', 'Being Prepared', 'Ready to Ship', 'Shipped', 'Delivered'].includes(status))) {
      order.status = 'Confirmed';
    } else if (itemStatuses.some(status => status === 'Cancelled') && itemStatuses.every(status => ['Cancelled', 'Pending'].includes(status))) {
      order.status = 'Cancelled';
    }
    
    await order.save();
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

      let orderItems = items;
      if (!items.length) {
        const cart = await Cart.findOne({ userId }).session(session);
        if (!cart || !cart.items || cart.items.length === 0) {
          throw new Error("Cart is empty, cannot create order");
        }
        orderItems = cart.items;
      }

      const enrichedItems = [];
      const sellerRevenue = {};

      for (const item of orderItems) {
        const qty = Number(item.quantity || 0);
        
        const updatedProduct = await Product.findOneAndUpdate(
          { 
            id: item.productId,
            stock: { $gte: qty }
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

        if (updatedProduct.sellerId) {
          const revenue = enrichedItem.price * qty;
          sellerRevenue[updatedProduct.sellerId] = (sellerRevenue[updatedProduct.sellerId] || 0) + revenue;
        }
      }

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

      for (const sellerId of Object.keys(sellerRevenue)) {
        await Seller.findOneAndUpdate(
          { id: sellerId },
          { $inc: { totalSales: sellerRevenue[sellerId] } },
          { session }
        );
      }

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

// Get cart for a user
app.get("/api/users/:userId/cart", async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId }).lean();
    
    if (!cart) {
      return res.json({ items: [] });
    }
    
    res.json({ items: cart.items || [] });
    
  } catch (err) {
    console.error("❌ Error in cart GET route:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// Add item to cart
app.post("/api/users/:userId/cart", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, name, price, image, sellerName, quantity, stock } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
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
    } else {
      const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
      
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity = Math.min(
          cart.items[existingItemIndex].quantity + quantity,
          stock
        );
      } else {
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
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});