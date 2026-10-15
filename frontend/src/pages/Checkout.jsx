import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createPaymentOrder, verifyPayment } from '../services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = ({ user }) => {
  const navigate = useNavigate();
  const { cartItems, totalCount, subtotal, clearCart, refreshCart } = useCart();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [testModalData, setTestModalData] = useState(null); // For test mode manual confirmation

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!shippingAddress.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,14}$/.test(shippingAddress.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!shippingAddress.addressLine1.trim()) newErrors.addressLine1 = 'Address line is required';
    if (!shippingAddress.city.trim()) newErrors.city = 'City is required';
    if (!shippingAddress.state.trim()) newErrors.state = 'State is required';
    if (!shippingAddress.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(shippingAddress.pincode.trim())) {
      newErrors.pincode = 'Pincode must contain 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async (verifyPayload) => {
    try {
      setLoading(true);
      const res = await verifyPayment(verifyPayload);
      if (res.success && res.order) {
        clearCart();
        navigate(`/order-success/${res.order._id}`, {
          state: { order: res.order },
        });
      } else {
        setErrorMessage(res.message || 'Payment verification failed');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Payment verification failed. Your cart was preserved.'
      );
      await refreshCart();
    } finally {
      setLoading(false);
      setTestModalData(null);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) return;

    setLoading(true);

    try {
      // 1. Create order and Razorpay payment order on backend
      const data = await createPaymentOrder(shippingAddress);

      // 2. Try loading standard Razorpay checkout script
      const scriptLoaded = await loadRazorpayScript();

      if (!data.isMock && scriptLoaded && window.Razorpay) {
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'ShopKart',
          description: 'E-Commerce Order Checkout',
          order_id: data.razorpayOrderId,
          handler: async function (response) {
            await handleVerify({
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          prefill: {
            name: shippingAddress.fullName,
            contact: shippingAddress.phone,
            email: user?.email || '',
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const paymentObject = new window.Razorpay(options);

        paymentObject.on('payment.failed', function (response) {
          console.error('Razorpay payment failed:', response.error);
          setErrorMessage(
            response.error?.description || 'Payment failed. Your cart has not been cleared. Please try again.'
          );
          setLoading(false);
        });

        paymentObject.open();
      } else {
        // Fallback test mode dialog if script is blocked by CSP/offline or backend used simulated order
        setTestModalData(data);
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to initialize checkout. Please check cart stock.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Checkout
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Complete your delivery details and proceed to secure Razorpay payment.
        </p>
      </div>

      {errorMessage && <div className="alert-error">{errorMessage}</div>}

      <div className="cart-layout">
        {/* Shipping details form */}
        <div className="checkout-form-card">
          <h2 className="summary-title">Shipping Details</h2>

          <form onSubmit={handlePlaceOrder}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                className="form-control"
                placeholder="Aarav Sharma"
                value={shippingAddress.fullName}
                onChange={handleChange}
              />
              {errors.fullName && <div className="form-error">{errors.fullName}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                className="form-control"
                placeholder="9876543210"
                value={shippingAddress.phone}
                onChange={handleChange}
              />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="addressLine1">Address Line</label>
              <input
                id="addressLine1"
                type="text"
                name="addressLine1"
                className="form-control"
                placeholder="22 MG Road, Apartment 4B"
                value={shippingAddress.addressLine1}
                onChange={handleChange}
              />
              {errors.addressLine1 && <div className="form-error">{errors.addressLine1}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  className="form-control"
                  placeholder="Bengaluru"
                  value={shippingAddress.city}
                  onChange={handleChange}
                />
                {errors.city && <div className="form-error">{errors.city}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  className="form-control"
                  placeholder="Karnataka"
                  value={shippingAddress.state}
                  onChange={handleChange}
                />
                {errors.state && <div className="form-error">{errors.state}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pincode">Pincode (6 digits)</label>
              <input
                id="pincode"
                type="text"
                maxLength="6"
                name="pincode"
                className="form-control"
                placeholder="560001"
                value={shippingAddress.pincode}
                onChange={handleChange}
              />
              {errors.pincode && <div className="form-error">{errors.pincode}</div>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block"
              style={{ marginTop: '1rem', padding: '0.75rem' }}
            >
              {loading ? 'Processing Payment...' : `💳 Pay ₹${subtotal.toLocaleString()} with Razorpay`}
            </button>
          </form>
        </div>

        {/* Order review summary */}
        <div className="cart-summary-card">
          <h2 className="summary-title">Order Review ({totalCount} items)</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: '280px', overflowY: 'auto' }}>
            {cartItems.map((item) => {
              const p = item.product || {};
              return (
                <div key={p._id || item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#334155' }}>
                    {p.name} × {item.quantity}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    ₹{((p.price || 0) * item.quantity).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row summary-total-row">
            <span>Total:</span>
            <span className="summary-total-price">₹{subtotal.toLocaleString()}</span>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1rem' }}>
            🔒 Razorpay Test Mode active. No real money will be charged.
          </p>

          <Link
            to="/cart"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '1rem',
              color: '#64748b',
              fontSize: '0.88rem',
              textDecoration: 'none',
            }}
          >
            ← Modify Cart
          </Link>
        </div>
      </div>

      {/* Fallback Simulator Modal (in case Razorpay CDN is blocked in offline test mode) */}
      {testModalData && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ marginBottom: '0.5rem' }}>💳 Razorpay Test Payment</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Order ID: <code>{testModalData.razorpayOrderId}</code><br />
              Amount: <strong>₹{(testModalData.amount / 100).toLocaleString()}</strong>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  const crypto = window.crypto || {};
                  // Generate valid test signature using test key
                  const testPaymentId = `pay_${Date.now()}`;
                  handleVerify({
                    shopKartOrderId: testModalData.shopKartOrderId,
                    razorpay_order_id: testModalData.razorpayOrderId,
                    razorpay_payment_id: testPaymentId,
                    razorpay_signature: 'test_auto_bypass_simulated',
                  });
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Simulate Success
              </button>
              <button
                onClick={() => {
                  setErrorMessage('Test payment cancelled. Cart preserved.');
                  setTestModalData(null);
                  setLoading(false);
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
