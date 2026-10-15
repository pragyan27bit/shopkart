import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getOrderById } from '../services/api';

const OrderSuccess = () => {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!order && id) {
      const fetchOrder = async () => {
        try {
          const res = await getOrderById(id);
          setOrder(res.order);
        } catch (err) {
          setError('Unable to load order confirmation details.');
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, order]);

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
          <Link to="/products" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '720px' }}>
      <div className="order-confirmation-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>
            Order Placed Successfully!
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Thank you for shopping with ShopKart. Your order has been placed and confirmed.
          </p>
        </div>

        <div className="profile-info-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Order ID</span>
            <div className="profile-stat-value" style={{ fontSize: '0.9rem' }}>{order._id}</div>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Order Status</span>
            <div className="profile-stat-value" style={{ color: '#2563eb' }}>{order.status}</div>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Payment Status</span>
            <div className="profile-stat-value" style={{ color: '#10b981' }}>{order.paymentStatus}</div>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Total Amount</span>
            <div className="profile-stat-value">₹{Number(order.totalAmount).toLocaleString()}</div>
          </div>
        </div>

        {/* Shipping details */}
        {order.shippingAddress && (
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Delivery Address:</h3>
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
              <strong>{order.shippingAddress.fullName}</strong> ({order.shippingAddress.phone})<br />
              {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
          </div>
        )}

        {/* Ordered Items Snapshot */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Items in this order:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {order.items?.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.75rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.92rem' }}>{item.name}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                    × {item.quantity}
                  </span>
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  ₹{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/orders" className="btn btn-primary" style={{ flex: 1 }}>
            View My Orders
          </Link>
          <Link to="/products" className="btn btn-secondary" style={{ flex: 1 }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
