import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const product = item.product || {};
  const quantity = item.quantity;
  const stock = product.stock || 0;
  const price = product.price || 0;
  const itemTotal = price * quantity;

  const handleIncrease = async () => {
    if (quantity >= stock) {
      setErrorMessage(`Maximum available stock is ${stock}`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    setUpdating(true);
    setErrorMessage('');
    const res = await updateQuantity(product._id, quantity + 1);
    if (!res.success) {
      setErrorMessage(res.message);
      setTimeout(() => setErrorMessage(''), 3000);
    }
    setUpdating(false);
  };

  const handleDecrease = async () => {
    if (quantity <= 1) return;
    setUpdating(true);
    setErrorMessage('');
    const res = await updateQuantity(product._id, quantity - 1);
    if (!res.success) {
      setErrorMessage(res.message);
      setTimeout(() => setErrorMessage(''), 3000);
    }
    setUpdating(false);
  };

  const handleRemove = async () => {
    setRemoving(true);
    await removeFromCart(product._id);
    setRemoving(false);
  };

  return (
    <div className="cart-item-card">
      <div className="cart-item-img-wrap">
        <img
          src={product.image || 'https://via.placeholder.com/150'}
          alt={product.name}
          className="cart-item-img"
        />
      </div>

      <div className="cart-item-info">
        <Link to={`/products/${product._id}`} className="cart-item-title">
          {product.name}
        </Link>
        <div className="cart-item-price">₹{price.toLocaleString()} each</div>
        <div className="cart-item-stock-info">
          {stock > 0 ? `${stock} units in stock` : 'Out of stock'}
        </div>
        {errorMessage && <div className="form-error">{errorMessage}</div>}
      </div>

      <div className="cart-item-actions">
        <div className="qty-control-wrap">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={updating || removing || quantity <= 1}
            className="qty-btn"
            title="Decrease quantity"
          >
            -
          </button>
          <span className="qty-value">{quantity}</span>
          <button
            type="button"
            onClick={handleIncrease}
            disabled={updating || removing || quantity >= stock}
            className="qty-btn"
            title="Increase quantity"
          >
            +
          </button>
        </div>

        <div className="cart-item-total">
          ₹{itemTotal.toLocaleString()}
        </div>

        <button
          type="button"
          onClick={handleRemove}
          disabled={removing || updating}
          className="btn btn-outline-danger btn-sm"
        >
          {removing ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </div>
  );
};

export default CartItem;
