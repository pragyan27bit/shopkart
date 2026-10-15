import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logoutCustomer } from '../services/api';
import { useCart } from '../context/CartContext';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { totalCount, clearCart } = useCart();

  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearCart();
      if (onLogout) onLogout();
      navigate('/login');
    }
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to={user ? '/home' : '/products'} className="brand">
          <span>🛒</span> ShopKart
        </Link>
        <nav>
          <ul className="nav-links">
            {user ? (
              <>
                <li>
                  <NavLink to="/home" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Home
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/products" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Products
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/wishlist" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Wishlist
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/cart" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Cart ({totalCount})
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Orders
                  </NavLink>
                </li>
                <li>
                  <button onClick={handleLogout} className="btn-nav-logout" title="Log out of ShopKart">
                    Logout ({user.fullName?.split(' ')[0] || 'User'})
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/products" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Products
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Login
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/register" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Register
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
