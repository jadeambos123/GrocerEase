import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api';

const styles = {
  page: { padding: '32px', background: '#f5f5f5', minHeight: '100vh' },
  sectionTitle: { marginBottom: 16, fontSize: 18, fontWeight: 700, color: '#1e4d2b' },
  categoryGrid: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  categoryCard: { minWidth: 110, background: '#fff', borderRadius: 12, padding: '16px 12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  iconPlaceholder: { width: 48, height: 48, borderRadius: 12, background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginTop: 24 },
  productCard: { background: '#fff', padding: 16, borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  img: { width: '100%', height: 150, objectFit: 'cover', borderRadius: 10, marginBottom: 12 },
  buyBtn: { width: '100%', padding: '10px 0', background: '#1e4d2b', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }
};

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/categories/`) // Make sure you have this endpoint!
      .then(() => {})
      .catch(() => console.log('Category fetch failed'));
  }, []);

  useEffect(() => {
    const url = selectedCategory 
      ? `${API_BASE_URL}/api/products/?category=${selectedCategory}`
      : `${API_BASE_URL}/api/products/`;

    axios.get(url)
      .then(res => setProducts(res.data))
      .catch(() => console.log('Product fetch failed'));
  }, [selectedCategory]);

  const addToCart = async (productId) => {
    if (!token) { navigate('/login'); return; }
    try {
      await axios.post(`${API_BASE_URL}/api/cart/add/`, { product_id: productId, quantity: 1 }, { headers: { Authorization: `Token ${token}` } });
      alert('Added to cart');
    } catch (err) {
      console.error(err);
      alert('Failed to add item.');
    }
  };

  return (
    <div style={styles.page}>
      <h3 style={styles.sectionTitle}>Shop by Category</h3>
      <div style={styles.categoryGrid}>
        <div style={styles.categoryCard} onClick={() => setSelectedCategory(null)}>
          <div style={styles.iconPlaceholder}>All</div>
          <span>All</span>
        </div>
        <div style={styles.categoryCard} onClick={() => setSelectedCategory(1)}>
          <div style={styles.iconPlaceholder}>🥩</div>
          <span>Meat</span>
        </div>
        <div style={styles.categoryCard} onClick={() => setSelectedCategory(2)}>
          <div style={styles.iconPlaceholder}>🥦</div>
          <span>Vegetables</span>
        </div>
      </div>

      <h2 style={{ color: '#2e7d32', marginTop: '40px' }}>{selectedCategory ? 'Filtered Results' : 'Available Groceries'}</h2>
      <div style={styles.grid}>
        {products.length > 0 ? (
          products.map(p => (
            <div key={p.id} style={styles.productCard}>
              <img src={p.image} alt={p.name} style={styles.img} />
              <h3>{p.name}</h3>
              <p>₱{p.price}</p>
              <button onClick={() => addToCart(p.id)} style={styles.buyBtn}>Add to Cart</button>
            </div>
          ))
        ) : (
          <p>No products found in this category.</p>
        )}
      </div>
    </div>
  );
};

export default ProductList;
