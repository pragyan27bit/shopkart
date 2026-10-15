import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WishlistCard from '../components/WishlistCard';
import { getWishlist, removeFromWishlist } from '../services/api';

const Wishlist = ({ user }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWishlist();
      setItems(data.wishlist || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError("Something went wrong. We couldn't load your wishlist.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      // Remove item from state without page reload
      setItems((prev) => prev.filter((item) => item._id !== productId));
    } catch (err) {
      alert('Failed to remove product from wishlist. Please try again.');
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          My Wishlist
        </h1>
        {!loading && !error && (
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            {items.length} {items.length === 1 ? 'product' : 'products'} saved
          </p>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="state-box">
          <div className="state-icon">⏳</div>
          <div className="state-title">Loading your wishlist...</div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="state-box">
          <div className="state-icon">⚠️</div>
          <div className="state-title">{error}</div>
          <button onClick={fetchWishlist} className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <div className="state-box">
          <div className="state-icon">❤️</div>
          <div className="state-title">Your wishlist is empty</div>
          <p className="state-desc">Save products you love and find them here later.</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      )}

      {/* Wishlist Grid */}
      {!loading && !error && items.length > 0 && (
        <div className="products-grid">
          {items.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
