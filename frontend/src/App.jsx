import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import OrderSuccess from './pages/OrderSuccess';
import { getCustomerProfile } from './services/api';
import { CartProvider } from './context/CartContext';

function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check if customer already has a valid session cookie
    const checkAuth = async () => {
      try {
        const profile = await getCustomerProfile();
        setUser(profile);
      } catch (err) {
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    setUser(null);
  };

  const handleLoginSuccess = (customerData) => {
    setUser(customerData);
  };

  if (initializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b' }}>
        <span>ShopKart is loading...</span>
      </div>
    );
  }

  return (
    <CartProvider user={user}>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <main>
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to={user ? '/home' : '/products'} replace />} />

            {/* Authentication Routes */}
            <Route
              path="/register"
              element={user ? <Navigate to="/home" replace /> : <Register />}
            />
            <Route
              path="/login"
              element={user ? <Navigate to="/home" replace /> : <Login onLoginSuccess={handleLoginSuccess} />}
            />

            {/* Protected Home Route */}
            <Route
              path="/home"
              element={user ? <Home user={user} setUser={setUser} /> : <Navigate to="/login" replace />}
            />

            {/* Products Discovery Routes */}
            <Route path="/products" element={<Products user={user} />} />
            <Route path="/products/:id" element={<ProductDetails user={user} />} />

            {/* Wishlist Route */}
            <Route
              path="/wishlist"
              element={user ? <Wishlist user={user} /> : <Navigate to="/login" replace />}
            />

            {/* Cart Route */}
            <Route
              path="/cart"
              element={user ? <Cart /> : <Navigate to="/login" replace />}
            />

            {/* Checkout Route */}
            <Route
              path="/checkout"
              element={user ? <Checkout user={user} /> : <Navigate to="/login" replace />}
            />

            {/* Orders Routes */}
            <Route
              path="/orders"
              element={user ? <Orders user={user} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/orders/:id"
              element={user ? <OrderDetails /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/order-success/:id"
              element={user ? <OrderSuccess /> : <Navigate to="/login" replace />}
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </main>
      </div>
    </CartProvider>
  );
}

export default App;
