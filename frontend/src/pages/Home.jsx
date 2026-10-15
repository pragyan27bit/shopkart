import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCustomerProfile } from '../services/api';

const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const data = await getCustomerProfile();
        if (isMounted) {
          setProfile(data);
          if (setUser) setUser(data);
        }
      } catch (err) {
        if (isMounted) {
          // If Not Logged In -> Automatically redirect to /login
          if (setUser) setUser(null);
          navigate('/login');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [navigate, setUser]);

  if (loading) {
    return (
      <div className="container">
        <div className="state-box">
          <div className="state-icon">⏳</div>
          <div className="state-title">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container">
      <div className="home-dashboard">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Welcome back, {profile.fullName}! 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Here is your customer account overview and saved preferences.
        </p>

        <div className="profile-info-grid">
          <div className="profile-stat-card">
            <span className="profile-stat-label">Full Name</span>
            <div className="profile-stat-value">{profile.fullName}</div>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Email Address</span>
            <div className="profile-stat-value">{profile.email}</div>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Phone Number</span>
            <div className="profile-stat-value">{profile.phone}</div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/products" className="btn btn-primary">
            🛒 Browse Catalog
          </Link>
          <Link to="/cart" className="btn btn-secondary">
            🛍️ View Cart
          </Link>
          <Link to="/wishlist" className="btn btn-secondary">
            ❤️ View My Wishlist
          </Link>
          <Link to="/orders" className="btn btn-secondary">
            📦 My Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
