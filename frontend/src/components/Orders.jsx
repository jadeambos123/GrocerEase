import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrdersPage = ({ showToast, onCartUpdated }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    axios.get('http://127.0.0.1:8000/api/orders/', { headers: { Authorization: `Token ${token}` } })
      .then(res => setOrders(res.data))
      .catch(() => showToast('Failed to load orders.', 'error'))
      .finally(() => setLoading(false));
  }, [token, showToast]);

  const handleReorder = async (orderId) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/orders/${orderId}/reorder/`, {}, { headers: { Authorization: `Token ${token}` } });
      showToast('Order added to cart.', 'success');
      onCartUpdated?.();
      navigate('/cart');
    } catch {
      showToast('Could not reorder this order.', 'error');
    }
  };

  if (!token) {
    return (
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 40px', background: '#f2f6f2' }}>
        <div style={{ maxWidth: 520, textAlign: 'center', padding: 30, background: '#fff', borderRadius: 18, boxShadow: '0 16px 34px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1e4d2b', marginBottom: 10 }}>Track your grocery orders</div>
            <p style={{ fontSize: 15, color: '#4a5568', lineHeight: 1.7 }}>
              Join GrocerEase to keep all your order history in one place, reorder favorites fast, and get the best local deals.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/login" style={{ background: '#1e4d2b', color: '#fff', padding: '12px 26px', borderRadius: 10, fontWeight: 700 }}>Log In</Link>
            <Link to="/register" style={{ background: '#e8f5e9', color: '#1e4d2b', padding: '12px 26px', borderRadius: 10, fontWeight: 700 }}>Register</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '32px 40px 48px', background: '#f7faf4', overflowY: 'auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e4d2b', marginBottom: 18 }}>Order History</h2>
      {loading ? (
        <div style={{ color: '#4a5568', fontSize: 15 }}>Loading orders…</div>
      ) : orders.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #d8e2d7', padding: 28, color: '#4a5568' }}>
          <p style={{ marginBottom: 16, fontWeight: 600 }}>No orders found yet.</p>
          <Link to="/products" style={{ background: '#1e4d2b', color: '#fff', padding: '10px 22px', borderRadius: 10, display: 'inline-block', fontWeight: 700 }}>Browse products</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #d8e2d7', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1e4d2b' }}>Order #{order.id}</div>
                  <div style={{ fontSize: 13, color: '#718096' }}>{order.created_at} · ₱{parseFloat(order.total).toFixed(0)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ padding: '8px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: '#e6fffa', color: '#0f766e' }}>{order.status}</span>
                  <button onClick={() => handleReorder(order.id)} style={{ background: '#1e4d2b', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>
                    Reorder
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 14 }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 14, alignItems: 'center', padding: 12, background: '#f7faf4', borderRadius: 12 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', background: '#e6fffa' }}>
                      {item.product_image ? <img src={item.product_image} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e4d2b' }}>{item.product_name}</div>
                      <div style={{ fontSize: 13, color: '#4a5568' }}>Qty {item.quantity} · ₱{parseFloat(item.unit_price).toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
