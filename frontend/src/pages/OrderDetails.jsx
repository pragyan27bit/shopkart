import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderById } from '../services/api';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getOrderById(id);
        setOrder(res.order);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
          return;
        }
        setError(err.response?.data?.message || 'Order not found or access denied');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="container">
        <div className="state-box">
          <div className="state-icon">⏳</div>
          <div className="state-title">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container">
        <div className="state-box">
          <div className="state-icon">⚠️</div>
          <div className="state-title">{error || 'Order not found'}</div>
          <Link to="/orders" className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Link
        to="/orders"
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
        ← Back to My Orders
      </Link>

      <div className="home-dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Order #{order._id}
            </h1>
            <div style={{ color: '#64748b', fontSize: '0.88rem' }}>
              Placed on {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="status-badge badge-primary">
              Status: {order.status}
            </span>
            <span className="status-badge badge-success">
              Payment: {order.paymentStatus}
            </span>
          </div>
        </div>

        <div className="profile-info-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Total Amount</span>
            <div className="profile-stat-value" style={{ color: '#2563eb' }}>
              ₹{Number(order.totalAmount).toLocaleString()}
            </div>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Razorpay Order ID</span>
            <div className="profile-stat-value" style={{ fontSize: '0.85rem' }}>
              {order.razorpayOrderId || 'N/A'}
            </div>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Payment ID</span>
            <div className="profile-stat-value" style={{ fontSize: '0.85rem' }}>
              {order.razorpayPaymentId || 'N/A'}
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        {order.shippingAddress && (
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Shipping Address</h3>
            <p style={{ color: '#334155', fontSize: '0.92rem', lineHeight: 1.6 }}>
              <strong>{order.shippingAddress.fullName}</strong> | {order.shippingAddress.phone}<br />
              {order.shippingAddress.addressLine1}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
          </div>
        )}

        {/* Purchased Items Snapshot */}
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>Items Snapshot</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {order.items?.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.2rem' }}>{item.name}</h4>
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Unit Price: ₹{item.price.toLocaleString()} × {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                  ₹{(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
