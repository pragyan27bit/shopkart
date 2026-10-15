import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getCart, addToCart as apiAddToCart, updateCartQuantity as apiUpdateQuantity, removeFromCart as apiRemoveFromCart } from '../services/api';

const CartContext = createContext(null);

export const CartProvider = ({ children, user }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refresh cart from backend
  const refreshCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getCart();
      setCartItems(data.cart || []);
    } catch (err) {
      setError("Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load cart when authenticated user changes
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCartItems([]);
    }
  }, [user, refreshCart]);

  // Add to cart
  const addToCart = async (productId) => {
    setError(null);
    try {
      const data = await apiAddToCart(productId);
      if (data.cart) {
        setCartItems(data.cart);
      } else {
        await refreshCart();
      }
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add item to cart.';
      return { success: false, message: msg };
    }
  };

  // Update quantity
  const updateQuantity = async (productId, quantity) => {
    setError(null);
    try {
      const data = await apiUpdateQuantity(productId, quantity);
      if (data.cart) {
        setCartItems(data.cart);
      } else {
        await refreshCart();
      }
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update quantity.';
      return { success: false, message: msg };
    }
  };

  // Remove from cart
  const removeFromCart = async (productId) => {
    setError(null);
    try {
      const data = await apiRemoveFromCart(productId);
      if (data.cart) {
        setCartItems(data.cart);
      } else {
        setCartItems((prev) =>
          prev.filter((item) => (item.product?._id || item.product) !== productId)
        );
      }
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove product.';
      return { success: false, message: msg };
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Derived values: calculated directly from cartItems
  const totalCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const price = item.product?.price || 0;
      return acc + price * (item.quantity || 0);
    }, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    loading,
    error,
    totalCount,
    subtotal,
    refreshCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
