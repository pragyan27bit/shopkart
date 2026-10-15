import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addToWishlist } from '../services/api';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, isWishlisted = false, isAuthenticated = false }) => {
  const navigate = useNavigate();
  const { cartItems, addToCart } = useCart();

  const [wishlistStatus, setWishlistStatus] = useState(
    isWishlisted ? 'saved' : 'idle'
  ); // 'idle' | 'saving' | 'saved'
  const [addingToCart, setAddingToCart] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cartSuccessMsg, setCartSuccessMsg] = useState('');

  // Cart information for this product
  const cartItem = cartItems.find(
    (item) => (item.product?._id || item.product) === product._id
  );
  const cartQty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0;
  const isMaxStockReached = cartQty >= product.stock;

  const handleWishlistClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (wishlistStatus === 'saving' || wishlistStatus === 'saved') {
      return;
    }

    setWishlistStatus('saving');
    setErrorMsg('');

    try {
      await addToWishlist(product._id);
      setWishlistStatus('saved');
    } catch (err) {
      setWishlistStatus('idle');
      if (err.response?.status === 409) {
        setWishlistStatus('saved'); // Already in wishlist
      } else {
        setErrorMsg('Unable to save product. Please try again.');
        setTimeout(() => setErrorMsg(''), 3000);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isOutOfStock || isMaxStockReached || addingToCart) return;

    setAddingToCart(true);
    setErrorMsg('');
    setCartSuccessMsg('');

    const res = await addToCart(product._id);
    setAddingToCart(false);

    if (res.success) {
      setCartSuccessMsg('Added to cart!');
      setTimeout(() => setCartSuccessMsg(''), 2500);
    } else {
      setErrorMsg(res.message);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const getWishlistButtonText = () => {
    if (wishlistStatus === 'saving') return '⏳ Saving...';
    if (wishlistStatus === 'saved') return '♥ Added to Wishlist';
    return '♡ Add to Wishlist';
  };

  const getCartButtonText = () => {
    if (addingToCart) return 'Adding...';
    if (isOutOfStock) return 'Out of Stock';
    if (isMaxStockReached) return 'Max Stock';
    if (cartQty > 0) return `Add Another (${cartQty})`;
    return 'Add to Cart';
  };

  return (
    <div className="product-card">
      <div className="product-img-wrap">
        <img
          src={product.image || 'https://via.placeholder.com/300x200?text=Product'}
          alt={product.name}
          className="product-img"
          loading="lazy"
        />
      </div>
      <div className="product-card-body">
        <span className="product-category-badge">{product.category}</span>
        <h3 className="product-title">{product.name}</h3>
        <div className="product-price">₹{Number(product.price).toLocaleString()}</div>
        <div className="product-stock">
          {product.stock > 0 ? `${product.stock} units left` : 'Out of Stock'}
        </div>

        {errorMsg && <div className="form-error" style={{ marginBottom: '0.5rem' }}>{errorMsg}</div>}
        {cartSuccessMsg && (
          <div className="form-success" style={{ marginBottom: '0.5rem', color: '#10b981', fontSize: '0.8rem' }}>
            ✓ {cartSuccessMsg}
          </div>
        )}

        <div className="product-card-actions" style={{ flexDirection: 'column', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingToCart || isOutOfStock || isMaxStockReached}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {getCartButtonText()}
          </button>

          <div style={{ display: 'flex', gap: '0.4rem', width: '100%' }}>
            <Link to={`/products/${product._id}`} className="btn btn-secondary" style={{ flex: 1 }}>
              View Details
            </Link>
            <button
              type="button"
              onClick={handleWishlistClick}
              disabled={wishlistStatus === 'saving'}
              className={`btn btn-wishlist ${wishlistStatus === 'saved' ? 'active' : ''}`}
              style={{ flex: 1 }}
            >
              {getWishlistButtonText()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
