import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders, updateOrderStatus } from '../services/api';

const Orders = ({ user }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyOrders();
      setOrders(data.orders || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError('Unable to load your orders.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusProgression = async (orderId, nextStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatus(orderId, nextStatus);
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o))
        );
      }
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'badge-success';
      case 'SHIPPED':
        return 'badge-info';
      case 'CONFIRMED':
        return 'badge-primary';
      case 'PLACED':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING_PAYMENT':
        return 'PLACED';
      case 'PLACED':
        return 'CONFIRMED';
      case 'CONFIRMED':
        return 'SHIPPED';
      case 'SHIPPED':
        return 'DELIVERED';
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="state-box">
          <div className="state-icon">⏳</div>
          <div className="state-title">Loading your orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="state-box">
          <div className="state-icon">⚠️</div>
          <div className="state-title">{error}</div>
          <button onClick={fetchOrders} className="btn btn-secondary" style={{ marginTop: '0.75rem' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container">
        <div className="state-box">
          <div className="state-icon">📦</div>
          <h2 className="state-title">You have not placed any orders yet.</h2>
          <p className="state-desc">When you purchase items, they will appear here with complete delivery details.</p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          My Orders
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed with ShopKart.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {orders.map((order) => {
          const nextStatus = getNextStatus(order.status);
          const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={order._id} className="order-history-card">
              <div className="order-card-header">
                <div>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Order #{order._id.slice(-8)}
                  </span>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Placed on {dateStr}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                  {order.paymentStatus === 'PAID' && (
                    <span className="status-badge badge-success">
                      PAID
                    </span>
                  )}
                </div>
              </div>

              {/* Order items list */}
              <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                      <span style={{ color: '#1e293b' }}>
                        {item.name} × <strong>{item.quantity}</strong>
                      </span>
                      <span style={{ color: '#475569' }}>
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order card footer */}
              <div className="order-card-footer">
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Paid: </span>
                  <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                    ₹{Number(order.totalAmount).toLocaleString()}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {/* Bonus Status Progression Action */}
                  {nextStatus && (
                    <button
                      onClick={() => handleStatusProgression(order._id, nextStatus)}
                      disabled={updatingId === order._id}
                      className="btn btn-secondary btn-sm"
                      title="Progress status (Bonus simulation)"
                    >
                      {updatingId === order._id ? 'Updating...' : `Advance → ${nextStatus}`}
                    </button>
                  )}
                  <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-sm">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
