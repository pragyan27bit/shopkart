import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, addToWishlist, getWishlist } from '../services/api';
import { useCart } from '../context/CartContext';

const ProductDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cartItems, addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [wishlistStatus, setWishlistStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartAlert, setCartAlert] = useState('');
  const [cartError, setCartError] = useState('');

  // Cart information for this product
  const cartItem = cartItems.find(
    (item) => (item.product?._id || item.product) === id
  );
  const cartQty = cartItem ? cartItem.quantity : 0;

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProductById(id);
        const prod = data.product || data;
        if (isMounted) setProduct(prod);

        // Check if item is already in wishlist
        if (user) {
          try {
            const wishData = await getWishlist();
            if (
              wishData.wishlist &&
              wishData.wishlist.some((item) => (item._id || item).toString() === id)
            ) {
              if (isMounted) setWishlistStatus('saved');
            }
          } catch {
            // Ignore auth check error
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.status === 404
              ? 'Product not found.'
              : 'Something went wrong while loading the product details.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const handleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (wishlistStatus === 'saving' || wishlistStatus === 'saved') return;

    setWishlistStatus('saving');
    try {
      await addToWishlist(id);
      setWishlistStatus('saved');
    } catch (err) {
      if (err.response?.status === 409) {
        setWishlistStatus('saved');
      } else {
        setWishlistStatus('idle');
        alert('Unable to save to wishlist. Please try again.');
      }
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product || product.stock <= 0 || cartQty >= product.stock || addingToCart) return;

    setAddingToCart(true);
    setCartError('');
    setCartAlert('');

    const res = await addToCart(id);
    setAddingToCart(false);

    if (res.success) {
      setCartAlert('Product added to cart!');
      setTimeout(() => setCartAlert(''), 3000);
    } else {
      setCartError(res.message);
      setTimeout(() => setCartError(''), 3500);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="state-box">
          <div className="state-icon">⏳</div>
          <div className="state-title">Loading product details...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container">
        <div className="state-box">
          <div className="state-icon">⚠️</div>
          <div className="state-title">{error || 'Product not found.'}</div>
          <Link to="/products" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isMaxStockReached = cartQty >= product.stock;

  return (
    <div className="container">
      <Link
        to="/products"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: '#64748b',
          textDecoration: 'none',
          marginBottom: '1.25rem',
          fontSize: '0.9rem',
          fontWeight: 500,
        }}
      >
        ← Back to Catalog
      </Link>

      <div className="details-container">
        <div>
          <img
            src={product.image || 'https://via.placeholder.com/600x400?text=Product'}
            alt={product.name}
            className="details-image"
          />
        </div>

        <div className="details-content">
          <span className="product-category-badge">{product.category}</span>
          <h1 className="details-title">{product.name}</h1>
          <div className="details-price">₹{Number(product.price).toLocaleString()}</div>

          <p className="details-desc">{product.description}</p>

          <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <strong>Availability: </strong>
            <span style={{ color: product.stock > 0 ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
              {product.stock > 0 ? `${product.stock} units in stock` : 'Out of Stock'}
            </span>
            {cartQty > 0 && (
              <span style={{ marginLeft: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
                ({cartQty} currently in cart)
              </span>
            )}
          </div>

          {cartAlert && (
            <div className="alert-success" style={{ marginBottom: '1rem' }}>
              ✓ {cartAlert}
            </div>
          )}

          {cartError && (
            <div className="alert-error" style={{ marginBottom: '1rem' }}>
              {cartError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || isOutOfStock || isMaxStockReached}
              className="btn btn-primary"
              style={{ flex: 1, minWidth: '160px' }}
            >
              {addingToCart
                ? 'Adding...'
                : isOutOfStock
                ? 'Out of Stock'
                : isMaxStockReached
                ? 'Max Stock Reached'
                : cartQty > 0
                ? `Add Another (${cartQty})`
                : '🛒 Add to Cart'}
            </button>
            <button
              onClick={handleWishlist}
              disabled={wishlistStatus === 'saving'}
              className={`btn btn-wishlist ${wishlistStatus === 'saved' ? 'active' : ''}`}
              style={{ flex: 1, minWidth: '160px' }}
            >
              {wishlistStatus === 'saving'
                ? '⏳ Saving...'
                : wishlistStatus === 'saved'
                ? '♥ In Wishlist'
                : '♡ Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
