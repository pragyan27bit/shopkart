require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const customerRoutes = require('./routes/customer.routes');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopkart';

// Allowed origins
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or localhost
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Mount API Routes
app.use('/customers', customerRoutes);
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

// Health check root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ShopKart API Server',
    status: 'Running',
    endpoints: {
      auth: '/customers',
      products: '/products',
      wishlist: '/wishlist',
    },
  });
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Database Connection & Server Start
if (require.main === module) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log('Successfully connected to MongoDB:', MONGO_URI);
      app.listen(PORT, () => {
        console.log(`ShopKart Backend Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection failure:', err.message);
      process.exit(1);
    });
}

module.exports = app;
