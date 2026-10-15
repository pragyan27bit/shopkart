import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const WishlistCard = ({ product, onRemove }) => {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(product._id);
    setRemoving(false);
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

        <div className="product-card-actions">
          <Link to={`/products/${product._id}`} className="btn btn-secondary">
            View Details
          </Link>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="btn btn-outline-danger"
          >
            {removing ? 'Removing...' : 'Remove ♥'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
