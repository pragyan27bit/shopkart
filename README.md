# ShopKart 🛒

Full-stack e-commerce application featuring customer authentication, product catalog discovery, persistent wishlist, reactive shopping cart, Razorpay Test Mode checkout, order snapshots, and order history. Built with Node.js, Express, MongoDB, and React.

---

## 🏗️ Architecture & Project Structure

Follows clean MVC architecture with strict separation of concerns, global cart state synchronization, server-side business-rule validation, and payment signature verification.

```text
shopKart/
├── backend/
│   ├── config/
│   │   └── razorpay.js             # Razorpay Test Mode SDK instance
│   ├── controllers/
│   │   ├── customer.controller.js  # Register, Login, Profile (/customers/me), Logout
│   │   ├── product.controller.js   # Create, List, Filter, Details
│   │   ├── wishlist.controller.js  # Add, Get (populate), Remove
│   │   ├── cart.controller.js      # Add to Cart, Get Cart (populate), Update Qty, Remove
│   │   └── order.controller.js     # Create payment order, Verify HMAC signature, Get orders, Status progression
│   ├── models/
│   │   ├── customer.model.js       # Customer schema + wishlist & cart arrays
│   │   ├── product.model.js        # Product schema with price & stock validations
│   │   ├── user.model.js           # Alias pointing to Customer model
│   │   └── order.model.js          # Order schema with snapshot items, address, status & payment fields
│   ├── routes/
│   │   ├── customer.routes.js      # /customers/*
│   │   ├── auth.routes.js          # /auth/* alias
│   │   ├── product.routes.js       # /products/*
│   │   ├── wishlist.routes.js      # /wishlist/* (Protected)
│   │   ├── cart.routes.js          # /cart/* (Protected)
│   │   └── order.routes.js         # /orders/* (Protected)
│   ├── middlewares/
│   │   └── auth.middleware.js      # JWT cookie & Bearer token verification
│   ├── utils/
│   │   └── generateToken.js       # JWT signing & HttpOnly cookie configuration
│   ├── seed.js                     # Initial products seeder
│   ├── test-api.js                 # 61 automated unit & integration test cases
│   ├── index.js                    # Express app entry point
│   ├── .env                        # Port, Mongo URI, JWT secret, Razorpay test keys
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── CartContext.jsx     # Global Cart state & derived calculations (subtotal, totalCount)
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Responsive navbar with live Cart (count) & Orders link
│   │   │   ├── ProductCard.jsx     # Card with live reactive Add to Cart & Wishlist toggles
│   │   │   ├── WishlistCard.jsx    # Wishlist item card with Remove action
│   │   │   ├── CartItem.jsx        # Cart row with +/- quantity controls and stock limits
│   │   │   └── SearchBar.jsx       # Real-time search & category filter dropdown
│   │   ├── pages/
│   │   │   ├── Register.jsx        # Customer account creation (/register)
│   │   │   ├── Login.jsx           # Customer authentication (/login)
│   │   │   ├── Home.jsx            # Protected customer dashboard (/home)
│   │   │   ├── Products.jsx        # Catalog discovery (/products)
│   │   │   ├── ProductDetails.jsx  # Detailed view (/products/:id) with Add to Cart
│   │   │   ├── Wishlist.jsx        # Protected user wishlist (/wishlist)
│   │   │   ├── Cart.jsx            # Shopping cart & Order Summary (/cart)
│   │   │   ├── Checkout.jsx        # Shipping form, validation & Razorpay checkout (/checkout)
│   │   │   ├── Orders.jsx          # My Orders history & status progression (/orders)
│   │   │   ├── OrderDetails.jsx    # Single order inspection (/orders/:id)
│   │   │   └── OrderSuccess.jsx    # Order confirmation screen (/order-success/:id)
│   │   ├── services/
│   │   │   └── api.js              # Centralized Axios service with credentials
│   │   ├── App.jsx                 # Routing, CartProvider & user auth state
│   │   ├── main.jsx                # React root
│   │   └── index.css               # Minimalist clean CSS design
│   ├── vite.config.js              # Vite server & backend API proxies
│   ├── index.html
│   └── package.json
│
├── package.json                    # Root script orchestrator
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (verified on v24)
- **MongoDB**: Running locally on `mongodb://127.0.0.1:27017`

### 2. Seed Database
Seed sample catalog products (Electronics, Fashion, Books, Home):
```bash
npm run seed
```

### 3. Run Automated Tests
Runs all 61 verification checks across Auth, Products, Wishlist, Cart, and Checkout & Orders:
```bash
npm run test
```

### 4. Start the Application
- **Start Backend** (runs on port 5001):
  ```bash
  npm run backend
  ```
- **Start Frontend** (runs on port 5173):
  ```bash
  npm run frontend
  ```

Open your browser at `http://localhost:5173`.

---

## 📡 API Endpoints Summary

### 🔐 Customer Authentication
| Method | Endpoint | Protected | Description |
|---|---|---|---|
| `POST` | `/customers/register` | ❌ | Create new customer account with bcrypt hash |
| `POST` | `/customers/login` | ❌ | Authenticate customer and set HttpOnly cookie |
| `GET` | `/customers/me` | ✅ | Fetch currently authenticated customer profile |
| `POST` | `/customers/logout` | ✅ | Clear authentication cookies |

### 📦 Products Catalog
| Method | Endpoint | Protected | Description |
|---|---|---|---|
| `POST` | `/products` | ❌ | Add a new product (validates price > 0, stock ≥ 0) |
| `GET` | `/products` | ❌ | List products with query filters (`?search=...&category=...`) |
| `GET` | `/products/:id` | ❌ | Fetch single product by MongoDB ObjectId |

### ❤️ Wishlist Management
| Method | Endpoint | Protected | Description |
|---|---|---|---|
| `POST` | `/wishlist/:productId` | ✅ | Add product to user's wishlist (409 on duplicate) |
| `GET` | `/wishlist` | ✅ | Get authenticated user's wishlist with `.populate()` |
| `DELETE` | `/wishlist/:productId` | ✅ | Remove product reference from user's wishlist |

### 🛍️ Shopping Cart Management
| Method | Endpoint | Protected | Description |
|---|---|---|---|
| `POST` | `/cart/:productId` | ✅ | Add product or increment quantity (validates stock limit) |
| `GET` | `/cart` | ✅ | Get authenticated user's cart with populated product data |
| `PATCH` | `/cart/:productId` | ✅ | Update quantity (validates $\ge 1$ and $\le$ stock) |
| `DELETE` | `/cart/:productId` | ✅ | Remove product from authenticated user's cart |

### 💳 Checkout & Orders
| Method | Endpoint | Protected | Description |
|---|---|---|---|
| `POST` | `/orders/create-payment-order` | ✅ | Validate stock & cart, calculate server total, create pending order & Razorpay order |
| `POST` | `/orders/verify-payment` | ✅ | Verify HMAC SHA256 signature, mark PAID/PLACED, deduct stock & clear cart |
| `GET` | `/orders` | ✅ | Get authenticated user's historical orders (newest first) |
| `GET` | `/orders/:id` | ✅ | Get single order (enforces user ownership) |
| `PATCH` | `/orders/:id/status` | ✅ | Update order status progression (Bonus) |

---

## 🔐 Payment Security & Business Rules Followed

1. **RAZORPAY_KEY_SECRET is strictly backend-only**: Never sent in API responses or imported in frontend JavaScript.
2. **Server-calculated Pricing**: Any client-sent `totalAmount` or price is ignored. The server re-fetches products from MongoDB to compute the real total.
3. **Stock Re-verification**: Cart items are checked against current stock before order creation. Insufficient stock rejects the order with `400 Bad Request`.
4. **Historical Snapshots**: The Order schema copies product `name`, `price`, `image`, and `quantity` at purchase time so future product updates don't alter past receipts.
5. **Atomic Cart Clearing**: Cart remains populated during order creation and failsafe payment errors; cart is only cleared after verified HMAC SHA256 payment signature.
6. **Order Ownership Enforcement**: Users cannot view or modify another user's orders (403 Forbidden).

---

## ✅ Complete Lab Checklist

- [x] Lab 01 & 02: Customer registration, bcrypt hashing, JWT HttpOnly cookies, protected `/customers/me`, logout.
- [x] Lab 03: Product model, listing, details, case-insensitive search, and category filtering.
- [x] Lab 04: Wishlist ObjectId references, duplicate prevention (409), `.populate()`, and removal.
- [x] Lab 05: Persistent Cart array, quantity limits, global `CartContext`, derived totals, and dynamic Navbar counter.
- [x] Lab 06: Order schema with snapshots, shipping address validation, Razorpay Test Mode checkout, server signature verification, cart clearance, My Orders history, and status progression.
