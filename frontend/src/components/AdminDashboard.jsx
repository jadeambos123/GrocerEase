import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = "https://grocerease-3.onrender.com";

const C = {
  deepGreen:  '#1e4d2b',
  midGreen:   '#2e7d45',
  lightGreen: '#c8e6c9',
  paleGreen:  '#e8f5e9',
  cream:      '#f5f2eb',
  white:      '#ffffff',
  border:     '#dde8dd',
  textDark:   '#1a2e1e',
  textMid:    '#4a5568',
  textLight:  '#718096',
  red:        '#e53e3e',
  redLight:   '#fff5f5',
  orange:     '#dd6b20',
  orangeLight:'#fffaf0',
  blue:       '#2b6cb0',
  blueLight:  '#ebf8ff',
  yellow:     '#b7791f',
  yellowLight:'#fefcbf',
};

const UNIT_OPTIONS = [
  { value: 'kg',     label: 'Kilogram (kg)' },
  { value: 'g',      label: 'Gram (g)' },
  { value: 'pcs',    label: 'Pieces (pcs)' },
  { value: 'pack',   label: 'Pack' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'liter',  label: 'Liter (L)' },
  { value: 'dozen',  label: 'Dozen' },
];

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons = {
  dashboard: ['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'M9 22V12h6v10'],
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  products:  ['M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z', 'M3 6h18', 'M16 10a4 4 0 01-8 0'],
  orders:    ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', 'M9 5a2 2 0 002 2h2a2 2 0 002-2', 'M9 12h6', 'M9 16h4'],
  plus:      'M12 5v14M5 12h14',
  edit:      ['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7', 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash:     ['M3 6h18', 'M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6', 'M10 11v6', 'M14 11v6', 'M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2'],
  x:         'M18 6L6 18M6 6l12 12',
  check:     'M20 6L9 17l-5-5',
  alert:     ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  search:    ['M11 17.25a6.25 6.25 0 110-12.5 6.25 6.25 0 010 12.5z', 'M16 16l3.5 3.5'],
  package:   ['M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z', 'M3.27 6.96L12 12.01l8.73-5.05', 'M12 22.08V12'],
  eye:       ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 100 6 3 3 0 000-6z'],
  back:      'M19 12H5M12 5l-7 7 7 7',
  refresh:   ['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15'],
};

// ── Reusable UI ─────────────────────────────────────────────────────────────
const Spinner = ({ size = 28 }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
    <div style={{ width: size, height: size, border: `3px solid ${C.lightGreen}`, borderTop: `3px solid ${C.deepGreen}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const Badge = ({ status }) => {
  const map = {
    pending:    { bg: C.yellowLight, color: C.yellow,  label: 'Pending'    },
    confirmed:  { bg: C.blueLight,   color: C.blue,    label: 'Confirmed'  },
    delivering: { bg: C.orangeLight, color: C.orange,  label: 'Delivering' },
    delivered:  { bg: C.paleGreen,   color: C.midGreen,label: 'Delivered'  },
    cancelled:  { bg: C.redLight,    color: C.red,     label: 'Cancelled'  },
    active:     { bg: C.paleGreen,   color: C.midGreen,label: 'Active'     },
    inactive:   { bg: C.redLight,    color: C.red,     label: 'Inactive'   },
  };
  const s = map[status] || { bg: '#f7f7f7', color: '#555', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const StatCard = ({ label, value, sub, color, icon }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 50, height: 50, borderRadius: 12, background: color + '18', display: 'grid', placeItems: 'center', color, flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: C.textDark, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.textMid, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const Modal = ({ open, title, onClose, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'slideUp 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: C.textDark }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMid, padding: 4, display: 'flex', borderRadius: 8, transition: 'background 0.15s' }}
            onMouseOver={e => e.currentTarget.style.background = C.paleGreen}
            onMouseOut={e => e.currentTarget.style.background = 'none'}>
            <Icon d={icons.x} size={18} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
};

const FormField = ({ label, required, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textDark, marginBottom: 6 }}>
      {label}{required && <span style={{ color: C.red }}> *</span>}
    </label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} style={{ width: '100%', padding: '9px 13px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 14, color: C.textDark, background: '#fff', boxSizing: 'border-box', ...props.style }}
    onFocus={e => { e.target.style.borderColor = C.midGreen; e.target.style.boxShadow = '0 0 0 3px rgba(46,125,69,0.1)'; }}
    onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
);

const Select = ({ children, ...props }) => (
  <select {...props} style={{ width: '100%', padding: '9px 13px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 14, color: C.textDark, background: '#fff', boxSizing: 'border-box', cursor: 'pointer', ...props.style }}>
    {children}
  </select>
);

const Btn = ({ variant = 'primary', children, ...props }) => {
  const styles = {
    primary:   { background: C.deepGreen, color: '#fff', border: 'none' },
    secondary: { background: C.paleGreen, color: C.deepGreen, border: `1px solid ${C.lightGreen}` },
    danger:    { background: C.redLight, color: C.red, border: `1px solid #feb2b2` },
    ghost:     { background: 'none', color: C.textMid, border: `1px solid ${C.border}` },
  };
  return (
    <button {...props} style={{ ...styles[variant], padding: '9px 18px', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s', ...props.style }}
      onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
      onMouseOut={e => e.currentTarget.style.opacity = '1'}>
      {children}
    </button>
  );
};

// ── OVERVIEW TAB ─────────────────────────────────────────────────────────────
const OverviewTab = ({ stats, recentOrders, onTabChange }) => (
  <div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
      <StatCard label="Total Users"    value={stats.users}    color={C.blue}     icon={<Icon d={icons.users}    size={22} />} />
      <StatCard label="Total Products" value={stats.products} color={C.midGreen} icon={<Icon d={icons.products} size={22} />} />
      <StatCard label="Total Orders"   value={stats.orders}   color={C.orange}   icon={<Icon d={icons.orders}   size={22} />} />
      <StatCard label="Revenue (₱)"    value={`₱${stats.revenue}`} color={C.deepGreen} sub="from all orders" icon={<Icon d={icons.package} size={22} />} />
    </div>

    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textDark }}>Recent Orders</h3>
        <Btn variant="ghost" onClick={() => onTabChange('orders')} style={{ fontSize: 13, padding: '6px 14px' }}>View All</Btn>
      </div>
      {recentOrders.length === 0
        ? <div style={{ padding: 32, textAlign: 'center', color: C.textLight }}>No orders yet.</div>
        : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.paleGreen }}>
                {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.slice(0, 8).map((o, i) => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#fff' : '#fafcfa' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.deepGreen }}>#{o.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: C.textDark }}>{o.customer_name || o.first_name + ' ' + o.last_name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.textDark }}>₱{o.total_price || o.total || '—'}</td>
                  <td style={{ padding: '12px 16px' }}><Badge status={o.status} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: C.textLight }}>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  </div>
);

// ── USERS TAB ────────────────────────────────────────────────────────────────
const UsersTab = ({ showToast }) => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const token = localStorage.getItem('token');

  const load = useCallback(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/admin/users/`, { headers: { Authorization: `Token ${token}` } })
      .then(r => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => showToast('Could not load users', 'error'))
      .finally(() => setLoading(false));
  }, [token, showToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggleActive = async (u) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/admin/users/${u.id}/`, { is_active: !u.is_active }, { headers: { Authorization: `Token ${token}` } });
      showToast(`User ${u.is_active ? 'deactivated' : 'activated'}`, 'success');
      load();
    } catch { showToast('Failed to update user', 'error'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textLight }}>
            <Icon d={icons.search} size={15} />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, username, or email…"
            style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div style={{ fontSize: 13, color: C.textMid, display: 'flex', alignItems: 'center', fontWeight: 500, flexShrink: 0 }}>
          {filtered.length} user{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.paleGreen }}>
              {['#', 'Name', 'Username', 'Email', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7}><Spinner /></td></tr>
              : filtered.length === 0
                ? <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: C.textLight }}>No users found.</td></tr>
                : filtered.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#fff' : '#fafcfa' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.textLight }}>{u.id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.lightGreen, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: C.deepGreen, flexShrink: 0 }}>
                            {(u.first_name?.[0] || u.username?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.textDark }}>{u.first_name} {u.last_name}</div>
                            {u.is_staff && <div style={{ fontSize: 11, color: C.midGreen, fontWeight: 700 }}>Admin</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.textMid }}>@{u.username}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.textMid }}>{u.email}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.textLight }}>{new Date(u.date_joined).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px' }}><Badge status={u.is_active ? 'active' : 'inactive'} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <Btn variant={u.is_active ? 'danger' : 'secondary'} onClick={() => toggleActive(u)} style={{ fontSize: 12, padding: '5px 12px' }}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </Btn>
                      </td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── PRODUCTS TAB ─────────────────────────────────────────────────────────────
const ProductsTab = ({ showToast }) => {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const [deleteId, setDeleteId]     = useState(null);
  const token = localStorage.getItem('token');

  const blank = { name: '', price: '', stock: '', category: '', unit: 'pcs', description: '', image: '' };
  const [form, setForm] = useState(blank);
  const [imageSource, setImageSource] = useState('url');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE_URL}/api/products/`),
      axios.get(`${API_BASE_URL}/api/categories/`),
    ]).then(([pr, cr]) => {
      setProducts(Array.isArray(pr.data) ? pr.data : []);
      setCategories(Array.isArray(cr.data) ? cr.data : []);
    }).catch(() => showToast('Could not load products', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = ()  => { setEditing(null); setForm(blank); setImageSource('url'); setImageFile(null); setImagePreview(''); setModalOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, price: p.price, stock: p.stock, category: p.category || '', unit: p.unit || 'pcs', description: p.description || '', image: p.image || '' });
    setImageSource(p.image ? 'url' : 'url');
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageSource('upload');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setForm(f => ({ ...f, image: '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { showToast('Name and price are required', 'error'); return; }
    setSaving(true);
    try {
      let payload;
      const config = { headers: { Authorization: `Token ${token}` } };

      if (imageSource === 'upload' && imageFile) {
        payload = new FormData();
        payload.append('name', form.name);
        payload.append('price', parseFloat(form.price));
        payload.append('stock', parseInt(form.stock) || 0);
        payload.append('category', form.category);
        payload.append('unit', form.unit);
        payload.append('description', form.description);
        payload.append('image', imageFile);
        config.headers['Content-Type'] = 'multipart/form-data';
      } else {
        payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 };
      }

      if (editing) {
        await axios.put(`${API_BASE_URL}/api/admin/products/${editing.id}/`, payload, config);
        showToast('Product updated!', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/products/`, payload, config);
        showToast('Product added!', 'success');
      }

      setModalOpen(false);
      load();
    } catch {
      showToast('Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/products/${id}/`, { headers: { Authorization: `Token ${token}` } });
      showToast('Product deleted', 'info');
      setDeleteId(null);
      load();
    } catch { showToast('Failed to delete product', 'error'); }
  };

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textLight }}>
            <Icon d={icons.search} size={15} />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <Btn onClick={openAdd}><Icon d={icons.plus} size={15} /> Add Product</Btn>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.paleGreen }}>
              {['Product', 'Category', 'Price', 'Stock', 'Unit', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6}><Spinner /></td></tr>
              : filtered.length === 0
                ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: C.textLight }}>No products found.</td></tr>
                : filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#fff' : '#fafcfa' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 8, background: C.paleGreen, overflow: 'hidden', flexShrink: 0 }}>
                            {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.textDark }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.textMid }}>{p.category_name || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.textDark }}>₱{p.price}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: p.stock === 0 ? C.red : p.stock <= 5 ? C.orange : C.midGreen }}>
                          {p.stock}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: C.paleGreen, color: C.deepGreen, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn variant="secondary" onClick={() => openEdit(p)} style={{ fontSize: 12, padding: '5px 10px' }}>
                            <Icon d={icons.edit} size={13} /> Edit
                          </Btn>
                          <Btn variant="danger" onClick={() => setDeleteId(p.id)} style={{ fontSize: 12, padding: '5px 10px' }}>
                            <Icon d={icons.trash} size={13} /> Delete
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} title={editing ? 'Edit Product' : 'Add New Product'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Product Name" required>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Chicken Breast" required />
            </FormField>
            <FormField label="Category">
              <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">— Select Category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Price (₱)" required>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" required />
            </FormField>
            <FormField label="Stock Quantity" required>
              <Input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" required />
            </FormField>
          </div>

          <FormField label="Unit of Measurement" required>
            <Select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </Select>
            <div style={{ fontSize: 12, color: C.textLight, marginTop: 5 }}>
              {form.unit === 'kg' && '💡 Customers will order by weight (e.g. 0.5 kg, 1 kg, 1.5 kg)'}
              {form.unit === 'g' && '💡 Customers will order in grams (e.g. 100g, 250g, 500g)'}
              {form.unit === 'pcs' && '💡 Customers will order by piece count (e.g. 1 pc, 2 pcs)'}
              {form.unit === 'pack' && '💡 Customers will order by pack (e.g. 1 pack, 2 packs)'}
              {form.unit === 'bundle' && '💡 Customers will order by bundle'}
              {form.unit === 'liter' && '💡 Customers will order by liter (e.g. 0.5L, 1L)'}
              {form.unit === 'dozen' && '💡 Customers will order by dozen'}
            </div>
          </FormField>

          <FormField label="Image source">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              {['url', 'upload'].map(source => (
                <label key={source} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: `1px solid ${imageSource === source ? C.deepGreen : C.border}`, background: imageSource === source ? C.paleGreen : '#fff', cursor: 'pointer', fontSize: 13, color: C.textDark }}>
                  <input type="radio" name="imageSource" value={source} checked={imageSource === source}
                    onChange={() => { setImageSource(source); if (source === 'url') { setImageFile(null); setImagePreview(''); } }}
                    style={{ cursor: 'pointer' }} />
                  {source === 'url' ? 'Image URL' : 'Upload from device'}
                </label>
              ))}
            </div>
            {imageSource === 'url' ? (
              <Input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://…" />
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                <Input type="file" accept="image/*" onChange={handleImageChange} style={{ padding: '8px 12px' }} />
                {(imagePreview || form.image) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#f7f7f7', borderRadius: 10 }}>
                    <img src={imagePreview || form.image} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: `1px solid ${C.border}` }} />
                    <div style={{ fontSize: 13, color: C.textMid }}>Preview of the selected product image.</div>
                  </div>
                )}
              </div>
            )}
          </FormField>

          <FormField label="Description">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short product description…" rows={3}
              style={{ width: '100%', padding: '9px 13px', borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </FormField>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <Btn variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn type="submit" style={{ opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Product'}</Btn>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} title="Delete Product?" onClose={() => setDeleteId(null)} width={380}>
        <p style={{ fontSize: 14, color: C.textMid, marginBottom: 20 }}>This action cannot be undone. Are you sure you want to delete this product?</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={() => handleDelete(deleteId)}>Delete</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ── ORDERS TAB ───────────────────────────────────────────────────────────────
const OrdersTab = ({ showToast }) => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail]   = useState(null);
  const [filter, setFilter]   = useState('all');
  const token = localStorage.getItem('token');

  const load = useCallback(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/admin/orders/`, { headers: { Authorization: `Token ${token}` } })
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => showToast('Could not load orders', 'error'))
      .finally(() => setLoading(false));
  }, [token, showToast]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/admin/orders/${id}/`, { status }, { headers: { Authorization: `Token ${token}` } });
      showToast('Order status updated!', 'success');
      load();
      if (detail?.id === id) setDetail(d => ({ ...d, status }));
    } catch { showToast('Failed to update order', 'error'); }
  };

  const STATUS_FLOW = ['pending', 'confirmed', 'delivering', 'delivered', 'cancelled'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {['all', ...STATUS_FLOW].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '6px 16px', borderRadius: 20, border: `1.5px solid ${filter === s ? C.deepGreen : C.border}`, background: filter === s ? C.deepGreen : '#fff', color: filter === s ? '#fff' : C.textMid, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>
            {s === 'all' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.paleGreen }}>
              {['Order #', 'Customer', 'Address', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8}><Spinner /></td></tr>
              : filtered.length === 0
                ? <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: C.textLight }}>No orders found.</td></tr>
                : filtered.map((o, i) => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#fff' : '#fafcfa' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.deepGreen }}>#{o.id}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: C.textDark }}>{o.first_name} {o.last_name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.textLight, maxWidth: 160 }}>{o.address}, {o.city}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: C.textDark }}>₱{o.total_price || o.total}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.textMid, textTransform: 'capitalize' }}>{o.payment_method}</td>
                      <td style={{ padding: '12px 16px' }}><Badge status={o.status} /></td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: C.textLight }}>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn variant="secondary" onClick={() => setDetail(o)} style={{ fontSize: 12, padding: '5px 10px' }}>
                            <Icon d={icons.eye} size={13} /> View
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      <Modal open={!!detail} title={`Order #${detail?.id}`} onClose={() => setDetail(null)} width={560}>
        {detail && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Customer', value: `${detail.first_name} ${detail.last_name}` },
                { label: 'Contact', value: detail.contact },
                { label: 'Address', value: `${detail.address}, ${detail.city}` },
                { label: 'Payment', value: detail.payment_method },
                { label: 'Order Date', value: new Date(detail.created_at).toLocaleString() },
                { label: 'Status', value: <Badge status={detail.status} /> },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: C.paleGreen, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.textDark }}>{value}</div>
                </div>
              ))}
            </div>

            {detail.notes && (
              <div style={{ background: C.yellowLight, border: `1px solid #f6e05e`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: C.yellow }}>
                <strong>Note:</strong> {detail.notes}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textDark, marginBottom: 10 }}>Update Status</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STATUS_FLOW.map(s => (
                  <button key={s} onClick={() => updateStatus(detail.id, s)}
                    style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${detail.status === s ? C.deepGreen : C.border}`, background: detail.status === s ? C.deepGreen : '#fff', color: detail.status === s ? '#fff' : C.textMid, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textDark, marginBottom: 8 }}>Order Total</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.deepGreen }}>₱{detail.total_price || detail.total}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── MAIN ADMIN DASHBOARD ─────────────────────────────────────────────────────
export default function AdminDashboard({ showToast }) {
  const [tab, setTab]       = useState('overview');
  const [stats, setStats]   = useState({ users: 0, products: 0, orders: 0, revenue: '0' });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE_URL}/api/admin/stats/`,  { headers: { Authorization: `Token ${token}` } }),
      axios.get(`${API_BASE_URL}/api/admin/orders/`, { headers: { Authorization: `Token ${token}` } }),
    ]).then(([sr, or]) => {
      setStats(sr.data);
      setRecentOrders(Array.isArray(or.data) ? or.data : []);
    }).catch(() => showToast('Could not load dashboard data', 'error'))
      .finally(() => setLoading(false));
  }, [token, navigate, showToast]);

  const TABS = [
    { id: 'overview', label: 'Overview',  icon: icons.dashboard },
    { id: 'users',    label: 'Users',     icon: icons.users     },
    { id: 'products', label: 'Products',  icon: icons.products  },
    { id: 'orders',   label: 'Orders',    icon: icons.orders    },
  ];

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.cream }}>

        {/* Sidebar */}
        <aside style={{ width: 210, flexShrink: 0, background: C.deepGreen, display: 'flex', flexDirection: 'column', padding: '24px 14px' }}>
          <div style={{ marginBottom: 28, paddingLeft: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Admin Panel</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>GrocerEase</div>
          </div>

          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4, background: tab === t.id ? 'rgba(255,255,255,0.16)' : 'transparent', color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: tab === t.id ? 700 : 500, transition: 'all 0.15s', textAlign: 'left', width: '100%' }}
              onMouseOver={e => { if (tab !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseOut={e => { if (tab !== t.id) e.currentTarget.style.background = 'transparent'; }}>
              <Icon d={t.icon} size={16} stroke="currentColor" />
              {t.label}
            </button>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <button onClick={() => navigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 500, width: '100%', transition: 'all 0.15s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <Icon d={icons.back} size={16} stroke="currentColor" />
              Back to Store
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.textDark, marginBottom: 4 }}>
              {TABS.find(t => t.id === tab)?.label}
            </h1>
            <p style={{ fontSize: 13, color: C.textLight }}>
              {tab === 'overview' && 'A summary of your store activity.'}
              {tab === 'users'    && 'Manage registered customers and admins.'}
              {tab === 'products' && 'Add, edit, and manage your product catalog.'}
              {tab === 'orders'   && 'View and update order statuses.'}
            </p>
          </div>

          {loading && tab === 'overview'
            ? <Spinner size={36} />
            : tab === 'overview' ? <OverviewTab stats={stats} recentOrders={recentOrders} onTabChange={setTab} />
            : tab === 'users'    ? <UsersTab    showToast={showToast} />
            : tab === 'products' ? <ProductsTab showToast={showToast} />
            : tab === 'orders'   ? <OrdersTab   showToast={showToast} />
            : null
          }
        </div>
      </div>
    </>
  );
}
