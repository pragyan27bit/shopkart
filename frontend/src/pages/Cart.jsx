import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, loading, error, totalCount, subtotal, refreshCart } = useCart();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Loading State
  if (loading && cartItems.length === 0) {
    return (
      <div className="container">
        <div className="state-box">
          <div className="state-icon">⏳</div>
          <div className="state-title">Loading your cart...</div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && cartItems.length === 0) {
    return (
      <div className="container">
        <div className="state-box">
          <div className="state-icon">⚠️</div>
          <div className="state-title">Unable to load your cart.</div>
          <button onClick={refreshCart} className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (cartItems.length === 0) {
    return (
      <div className="container">
        <div className="state-box">
          <div className="state-icon">🛒</div>
          <h2 className="state-title">Your cart is empty</h2>
          <p className="state-desc">Looks like you haven't added anything yet.</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          My Cart
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Review your items and proceed to checkout.
        </p>
      </div>

      <div className="cart-layout">
        {/* Cart items list */}
        <div className="cart-items-list">
          {cartItems.map((item) => (
            <CartItem key={item.product?._id || item._id} item={item} />
          ))}
        </div>

        {/* Order Summary */}
        <div className="cart-summary-wrap">
          <div className="cart-summary-card">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-row">
              <span className="summary-label">Total Items:</span>
              <span className="summary-value">{totalCount} {totalCount === 1 ? 'unit' : 'units'}</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Distinct Products:</span>
              <span className="summary-value">{cartItems.length}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row summary-total-row">
              <span>Subtotal:</span>
              <span className="summary-total-price">₹{subtotal.toLocaleString()}</span>
            </div>


            <button
              onClick={handleCheckout}
              className="btn btn-primary btn-block"
              style={{ marginTop: '1.25rem', padding: '0.75rem' }}
            >
              Proceed to Checkout →
            </button>

            <Link
              to="/products"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '1rem',
                color: '#64748b',
                fontSize: '0.88rem',
                textDecoration: 'none',
              }}
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
