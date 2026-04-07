import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api';

const styles = {
  page: { padding: '32px', background: '#f5f5f5', minHeight: '100vh' },
  card: { background: '#fff', borderRadius: 18, padding: 24, maxWidth: 760, margin: '0 auto', boxShadow: '0 12px 28px rgba(0,0,0,0.05)' },
  cartItem: { display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #ececec' },
  button: { display: 'inline-block', marginTop: 18, padding: '12px 24px', background: '#2e7d45', color: '#fff', borderRadius: 10, textDecoration: 'none', border: 'none', cursor: 'pointer' }
};

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE_URL}/api/cart/`, {
        headers: { Authorization: `Token ${token}` }
      })
      .then(res => setCartItems(res.data))
      .catch(err => {
        if (err?.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      });
    }
  }, [token, navigate]);

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2>Access Denied</h2>
          <p>You must be logged in to view your cart and place orders.</p>
          <Link to="/login" style={styles.button}>Go to Login</Link>
        </div>
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>Your Shopping Cart</h2>
        {cartItems.length > 0 ? (
          <>
            {cartItems.map(item => (
              <div key={item.id} style={styles.cartItem}>
                <span><strong>{item.product_name}</strong></span>
                <span>{item.quantity}x - ₱{item.product_price}</span>
              </div>
            ))}
            <div style={{ marginTop: 20, fontWeight: 'bold', fontSize: '1.2rem' }}>
              Total: ₱{total.toFixed(2)}
            </div>
            <button style={{ ...styles.button, background: '#ffd600', color: '#000' }}>Checkout (Wireframe 13)</button>
          </>
        ) : (
          <p>No items in your cart yet. Go shopping!</p>
        )}
      </div>
    </div>
  );
};

export default Cart;
