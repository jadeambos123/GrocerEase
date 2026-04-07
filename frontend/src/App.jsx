import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrdersPage from './components/Orders';
import ProfilePage from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/login';
import { API_BASE_URL } from './api';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const UNIT_PRESETS = {
  kg:     [0.25, 0.5, 1, 1.5, 2, 3],
  g:      [100, 250, 500, 750, 1000],
  pcs:    [1, 2, 3, 4, 5, 6, 10],
  pack:   [1, 2, 3, 5],
  bundle: [1, 2, 3],
  liter:  [0.5, 1, 1.5, 2],
  dozen:  [1, 2, 3],
};

const formatQty = (qty, unit) => {
  if (unit === 'kg')     return `${qty} kg`;
  if (unit === 'g')      return `${qty}g`;
  if (unit === 'liter')  return `${qty}L`;
  if (unit === 'pcs')    return qty === 1 ? '1 pc' : `${qty} pcs`;
  if (unit === 'dozen')  return qty === 1 ? '1 dozen' : `${qty} dozens`;
  return `${qty} ${unit}`;
};

const getProductUnit = (product) => {
  if (product.unit) return product.unit;
  const name = (product.name || '').toLowerCase();
  if (/chicken|beef|pork|meat|fish|salmon|steak|lamb|mutton|duck|turkey/.test(name)) return 'kg';
  if (/milk|water|juice|soda|oil|vinegar|broth|sauce/.test(name)) return 'liter';
  return 'pcs';
};

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const CartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const GrocerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const EyeIcon = ({ show }) => show ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const CodIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);
const PayLaterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const AdminIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  deepGreen:  '#1e4d2b',
  midGreen:   '#2e7d45',
  lightGreen: '#c8e6c9',
  paleGreen:  '#e8f5e9',
  heroBg:     '#d4eedc',
  cream:      '#f5f2eb',
  white:      '#ffffff',
  border:     '#dde8dd',
  textDark:   '#1a2e1e',
  textMid:    '#4a5568',
  textLight:  '#718096',
  red:        '#e53e3e',
  tagColor:   '#4a9e6a',
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; }
    body { font-family: 'Inter', sans-serif; background: ${C.cream}; color: ${C.textDark}; -webkit-font-smoothing: antialiased; }
    a { text-decoration: none; color: inherit; }
    button { font-family: 'Inter', sans-serif; cursor: pointer; }
    input, select, textarea { font-family: 'Inter', sans-serif; }
    input:focus, textarea:focus { outline: none; border-color: ${C.midGreen} !important; box-shadow: 0 0 0 3px rgba(46,125,69,0.1); }

    .nav-link { color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 500; padding: 6px 11px; border-radius: 7px; transition: all 0.15s; }
    .nav-link:hover { color: #fff; background: rgba(255,255,255,0.14); }

    .cart-pill { display:flex; align-items:center; gap:7px; background:rgba(255,255,255,0.14); border:1.5px solid rgba(255,255,255,0.38); border-radius:20px; padding:5px 15px; color:#fff; font-size:14px; font-weight:600; transition:background 0.18s; }
    .cart-pill:hover { background:rgba(255,255,255,0.24); }

    .login-pill { background:#fff; color:${C.deepGreen}; border-radius:20px; padding:6px 20px; font-size:14px; font-weight:700; border:none; transition:opacity 0.18s; display:inline-block; }
    .login-pill:hover { opacity:0.86; }

    .logout-pill { background:transparent; border:1.5px solid rgba(255,255,255,0.45); border-radius:20px; padding:5px 18px; color:#fff; font-size:14px; font-weight:600; transition:background 0.18s; }
    .logout-pill:hover { background:rgba(255,255,255,0.14); }

    .admin-pill { background:rgba(255,255,255,0.1); border:1.5px solid rgba(255,255,255,0.3); border-radius:20px; padding:5px 14px; color:#fff; font-size:13px; font-weight:600; display:flex; align-items:center; gap:5px; transition:background 0.18s; }
    .admin-pill:hover { background:rgba(255,255,255,0.2); }

    .sidebar-btn { display:block; padding:9px 14px; border-radius:8px; font-size:14px; font-weight:500; color:${C.textMid}; cursor:pointer; transition:all 0.15s; border:none; background:none; text-align:left; width:100%; }
    .sidebar-btn:hover { background:${C.paleGreen}; color:${C.deepGreen}; }
    .sidebar-btn.active { background:${C.paleGreen}; color:${C.deepGreen}; font-weight:700; }

    .prod-card { background:#fff; border-radius:12px; overflow:hidden; border:1px solid ${C.border}; transition:transform 0.18s, box-shadow 0.18s; }
    .prod-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(30,77,43,0.12); }

    .atc-btn { width:100%; padding:9px 0; background:${C.deepGreen}; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:600; transition:background 0.16s; }
    .atc-btn:hover:not(:disabled) { background:${C.midGreen}; }
    .atc-btn:disabled { opacity:0.7; cursor:not-allowed; }

    .unit-select { width:100%; padding:7px 10px; border-radius:7px; border:1px solid ${C.border}; font-size:13px; font-weight:600; color:${C.textDark}; background:#f9fdf9; cursor:pointer; margin-bottom:8px; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; padding-right:28px; }
    .unit-select:focus { outline:none; border-color:${C.midGreen}; box-shadow:0 0 0 3px rgba(46,125,69,0.1); }

    .primary-btn { background:${C.deepGreen}; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:700; padding:13px; width:100%; transition:background 0.18s; cursor:pointer; }
    .primary-btn:hover:not(:disabled) { background:${C.midGreen}; }
    .primary-btn:disabled { opacity:0.6; cursor:not-allowed; }

    .checkout-btn { background:${C.deepGreen}; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:700; padding:14px; width:100%; transition:background 0.18s; cursor:pointer; }
    .checkout-btn:hover { background:${C.midGreen}; }

    .place-order-btn { background:${C.deepGreen}; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:700; padding:14px; width:100%; transition:background 0.18s; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; }
    .place-order-btn:hover:not(:disabled) { background:${C.midGreen}; }
    .place-order-btn:disabled { opacity:0.6; cursor:not-allowed; }

    .apply-btn { background:${C.deepGreen}; color:#fff; border:none; border-radius:8px; padding:10px 22px; font-size:14px; font-weight:600; transition:background 0.18s; white-space:nowrap; }
    .apply-btn:hover { background:${C.midGreen}; }

    .qty-btn { width:26px; height:26px; border:1.5px solid ${C.border}; background:#fff; border-radius:5px; font-size:15px; font-weight:600; color:${C.textDark}; display:flex; align-items:center; justify-content:center; transition:background 0.14s; cursor:pointer; flex-shrink:0; }
    .qty-btn:hover { background:${C.paleGreen}; }

    .remove-btn { background:none; border:none; color:${C.red}; cursor:pointer; padding:5px; border-radius:6px; display:flex; align-items:center; transition:background 0.14s; }
    .remove-btn:hover { background:#fff0f0; }

    .pay-method-btn { display:flex; align-items:center; gap:7px; padding:10px 18px; border-radius:10px; border:1.5px solid ${C.border}; background:#fff; font-size:14px; font-weight:600; color:${C.textMid}; cursor:pointer; transition:all 0.18s; }
    .pay-method-btn.selected { border-color:${C.deepGreen}; background:${C.paleGreen}; color:${C.deepGreen}; }
    .pay-method-btn:hover { border-color:${C.midGreen}; }

    .form-input { width:100%; padding:10px 13px; border-radius:9px; border:1px solid ${C.border}; font-size:14px; color:${C.textDark}; background:#fff; transition:border-color 0.15s; }
    .form-input:focus { outline:none; border-color:${C.midGreen}; box-shadow:0 0 0 3px rgba(46,125,69,0.1); }

    @keyframes spin     { to { transform: rotate(360deg); } }
    @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes slideIn  { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }

    @media (max-width: 900px) {
      .cart-grid { grid-template-columns: 1fr !important; }
      .checkout-grid { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 768px) {
      .products-layout { flex-direction: column !important; }
      .sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid ${C.border}; }
      .auth-card { padding: 32px 24px !important; }
      .register-grid { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
const Toast = ({ toast, onDismiss }) => {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setVis(true), 10);
    const t2 = setTimeout(() => setVis(false), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const cfg = {
    success: { bg: C.deepGreen, icon: <CheckIcon/>, label: 'Success' },
    error:   { bg: '#c53030',   icon: <AlertIcon/>, label: 'Error'   },
    info:    { bg: '#2b6cb0',   icon: <InfoIcon/>,  label: 'Info'    },
  }[toast.type] ?? { bg: C.deepGreen, icon: <InfoIcon/>, label: 'Notice' };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, backgroundColor:cfg.bg, color:'#fff', padding:'11px 16px', borderRadius:12, minWidth:240, maxWidth:340, boxShadow:'0 4px 20px rgba(0,0,0,0.18)', animation:'slideIn 0.3s ease', opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(10px)', transition:'opacity 0.3s,transform 0.3s' }}>
      <span style={{flexShrink:0}}>{cfg.icon}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:10,fontWeight:700,opacity:0.7,textTransform:'uppercase',letterSpacing:0.5}}>{cfg.label}</div>
        <div style={{fontSize:13,fontWeight:600,marginTop:1}}>{toast.message}</div>
      </div>
      <button onClick={()=>onDismiss(toast.id)} style={{background:'none',border:'none',color:'#fff',opacity:0.7,padding:2,cursor:'pointer'}}><XIcon/></button>
    </div>
  );
};
const ToastContainer = ({ toasts, dismissToast }) => (
  <div style={{position:'fixed',bottom:24,right:24,display:'flex',flexDirection:'column',gap:10,zIndex:9999}}>
    {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={dismissToast}/>)}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SPINNER & SKELETON
// ─────────────────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}>
    <div style={{width:36,height:36,border:`3px solid ${C.lightGreen}`,borderTop:`3px solid ${C.deepGreen}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
  </div>
);
const SkeletonCard = () => (
  <div style={{background:'#fff',borderRadius:12,overflow:'hidden',border:`1px solid ${C.border}`}}>
    <div style={{height:148,background:'linear-gradient(90deg,#e8f5e9 25%,#d4edda 50%,#e8f5e9 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}}/>
    <div style={{padding:14}}>
      {[60,40,100].map((w,i)=>(
        <div key={i} style={{height:i===2?32:12,width:`${w}%`,borderRadius:6,marginTop:i===0?0:8,background:'linear-gradient(90deg,#d4edda 25%,#c8e6c9 50%,#d4edda 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}}/>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE FALLBACK PLACEHOLDER
// ─────────────────────────────────────────────────────────────────────────────
const IMG_PLACEHOLDER = 'https://placehold.co/400x400?text=No+Image';

// ─────────────────────────────────────────────────────────────────────────────
// STOCK BADGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const StockBadge = ({ stock, unit }) => {
  const stockNum = Number(stock) || 0;
  if (stockNum === 0) {
    return (
      <div style={{
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ff4444',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 600
      }}>
        Out of Stock
      </div>
    );
  }
  if (stockNum <= 5) {
    return (
      <div style={{
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ff8800',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 600
      }}>
        Low Stock
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
const ProductDetailModal = ({ product, isOpen, onClose, onAddToCart, addingId }) => {
  if (!isOpen || !product) return null;

  const stock = Number(product.stock) || 0;
  const unit = getProductUnit(product);
  const presets = UNIT_PRESETS[unit] || UNIT_PRESETS.pcs;
  const [selectedQty, setSelectedQty] = useState(presets[0]);
  const outOfStock = stock === 0;
  const exceedsStock = selectedQty > stock;

  const handleAddToCart = () => {
    onAddToCart(product.id, product.name, selectedQty, unit);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        maxWidth: 500,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: `1px solid ${C.border}`
      }} onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255, 255, 255, 0.9)',
            border: `1px solid ${C.border}`,
            borderRadius: '50%',
            width: 36,
            height: 36,
            fontSize: 18,
            cursor: 'pointer',
            color: C.textMid,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 1)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.9)'}
        >
          ×
        </button>

        <div style={{ height: 280, overflow: 'hidden', position: 'relative' }}>
          <img
            src={product.image || IMG_PLACEHOLDER}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: outOfStock ? 'grayscale(60%)' : 'none'
            }}
            onError={e => { e.target.onerror = null; e.target.src = IMG_PLACEHOLDER; }}
          />
          <StockBadge stock={stock} unit={unit} />
        </div>

        <div style={{
          padding: '28px 24px 24px',
          maxHeight: '50vh',
          overflowY: 'auto'
        }}>
          {product.category_name && (
            <div style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 700,
              color: C.midGreen,
              backgroundColor: C.paleGreen,
              padding: '4px 10px',
              borderRadius: 12,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {product.category_name}
            </div>
          )}

          <h2 style={{
            fontSize: 28,
            fontWeight: 800,
            color: C.textDark,
            marginBottom: 8,
            lineHeight: 1.2
          }}>
            {product.name}
          </h2>

          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: C.deepGreen,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'baseline',
            gap: 4
          }}>
            <span>₱{product.price}</span>
            <span style={{
              fontSize: 14,
              fontWeight: 500,
              color: C.textLight
            }}>
              per {unit}
            </span>
          </div>

          {/* Stock Information */}
          <div style={{
            backgroundColor: outOfStock ? '#fef2f2' : stock <= 5 ? '#fefce8' : '#f0fdf4',
            border: `1px solid ${outOfStock ? '#fecaca' : stock <= 5 ? '#fde047' : '#bbf7d0'}`,
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: outOfStock ? '#dc2626' : stock <= 5 ? '#d97706' : '#166534',
              marginBottom: 4
            }}>
              {outOfStock ? 'Out of Stock' : stock <= 5 ? 'Limited Stock' : 'In Stock'}
            </div>
            <div style={{
              fontSize: 13,
              color: outOfStock ? '#991b1b' : stock <= 5 ? '#92400e' : '#14532d'
            }}>
              {outOfStock ? 'This product is currently unavailable' : `${formatQty(stock, unit)} available`}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              color: C.textDark,
              marginBottom: 8
            }}>
              Description
            </h3>
            <p style={{
              fontSize: 14,
              color: C.textMid,
              lineHeight: 1.6,
              margin: 0
            }}>
              {product.description || 'No description available for this product.'}
            </p>
          </div>

          {!outOfStock && (
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 15,
                fontWeight: 600,
                color: C.textDark,
                marginBottom: 10
              }}>
                Quantity
              </label>
              <div style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: 12,
                border: `1px solid ${C.border}`
              }}>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={selectedQty}
                  onChange={e => setSelectedQty(parseFloat(e.target.value) || 0)}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 14,
                    color: C.textDark,
                    backgroundColor: '#fff',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                <div style={{
                  fontSize: 13,
                  color: C.textMid,
                  fontWeight: 500,
                  minWidth: 60,
                  textAlign: 'center'
                }}>
                  {formatQty(selectedQty, unit)}
                </div>
              </div>
              {exceedsStock && (
                <div style={{
                  color: C.red,
                  fontSize: 13,
                  marginTop: 8,
                  fontWeight: 500
                }}>
                  ⚠️ Only {formatQty(stock, unit)} available. Please choose a smaller amount.
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={outOfStock || addingId === product.id || exceedsStock}
            style={{
              width: '100%',
              padding: '16px 0',
              backgroundColor: outOfStock ? '#f3f4f6' : C.deepGreen,
              color: outOfStock ? C.textMid : '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: outOfStock || exceedsStock ? 'not-allowed' : 'pointer',
              opacity: addingId === product.id ? 0.7 : 1,
              transition: 'all 0.2s ease',
              boxShadow: outOfStock ? 'none' : '0 4px 12px rgba(30, 77, 43, 0.3)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={e => {
              if (!outOfStock && !exceedsStock) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 16px rgba(30, 77, 43, 0.4)';
              }
            }}
            onMouseLeave={e => {
              if (!outOfStock && !exceedsStock) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(30, 77, 43, 0.3)';
              }
            }}
          >
            {outOfStock ? 'Out of Stock' : addingId === product.id ? 'Adding…' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD — with unit dropdown
// ─────────────────────────────────────────────────────────────────────────────
const ProductCard = ({ p, onAddToCart, addingId, onShowDetails }) => {
  const stock = Number(p.stock) || 0;
  const unit       = getProductUnit(p);
  const presets    = UNIT_PRESETS[unit] || UNIT_PRESETS.pcs;
  const [selectedQty, setSelectedQty] = useState(presets[0]);
  const outOfStock = stock === 0;
  const exceedsStock = selectedQty > stock;

  return (
    <div
      className="prod-card"
      style={{ opacity: outOfStock ? 0.6 : 1, cursor: 'pointer' }}
      onClick={() => onShowDetails(p)}
    >
      <div style={{ height:148, background:C.paleGreen, overflow:'hidden', position:'relative' }}>
        <img
          src={p.image || IMG_PLACEHOLDER}
          alt={p.name}
          style={{ width:'100%', height:'100%', objectFit:'cover', filter: outOfStock ? 'grayscale(60%)' : 'none' }}
          onError={e => { e.target.onerror = null; e.target.src = IMG_PLACEHOLDER; }}
        />
        <StockBadge stock={stock} unit={unit} />
      </div>
      <div style={{ padding:'12px 14px 14px' }}>
        {p.category_name && (
          <div style={{ fontSize:11, fontWeight:600, color:C.tagColor, marginBottom:2 }}>{p.category_name}</div>
        )}
        <div style={{ fontSize:14, fontWeight:700, color:C.textDark, marginBottom:2 }}>{p.name}</div>
        <div style={{ fontSize:13, fontWeight:600, color:C.textMid, marginBottom:10 }}>
          ₱{p.price}
          <span style={{ fontSize:11, fontWeight:500, color:C.textLight, marginLeft:4 }}>/ {unit}</span>
        </div>

        {!outOfStock && (
          <>
            <div style={{ marginBottom: 10 }}>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={selectedQty}
                onChange={e => setSelectedQty(parseFloat(e.target.value) || 0)}
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  fontSize: 12,
                  color: C.textDark,
                  textAlign: 'center'
                }}
              />
            </div>
            {exceedsStock && (
              <div style={{ color: C.red, fontSize:10, marginBottom:8 }}>
                Only {formatQty(stock, unit)} left
              </div>
            )}
          </>
        )}

        <button
          className="atc-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(p.id, p.name, selectedQty, unit);
          }}
          disabled={outOfStock || addingId === p.id || exceedsStock}
          style={{ background: outOfStock ? '#9e9e9e' : undefined }}
        >
          {outOfStock ? 'Out of Stock' : addingId === p.id ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR  — uses isAdmin to show Admin link
// ─────────────────────────────────────────────────────────────────────────────
const Navbar = ({ isLoggedIn, isAdmin, onLogout, cartCount }) => {
  const path = window.location.pathname;
  return (
    <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 40px',height:60,backgroundColor:C.deepGreen,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,0.2)',flexShrink:0}}>
      <Link to="/" style={{display:'flex',alignItems:'center',gap:9,color:'#fff'}}>
        <span style={{background:'rgba(255,255,255,0.16)',borderRadius:8,padding:'4px 5px',display:'flex'}}><GrocerIcon/></span>
        <span style={{fontSize:18,fontWeight:800,letterSpacing:'-0.2px'}}>GrocerEase</span>
      </Link>
      <div style={{display:'flex',alignItems:'center',gap:2}}>
        {[['/', 'Home'],['/products','Products'],['/orders','Orders'],['/profile','Profile']].map(([p,label])=>(
          <Link key={p} to={p} className="nav-link" style={{fontWeight:path===p?700:500,color:path===p?'#fff':'rgba(255,255,255,0.85)'}}>{label}</Link>
        ))}
        {isAdmin && (
          <Link to="/admin" className="admin-pill" style={{marginLeft:6}}>
            <AdminIcon/> Admin
          </Link>
        )}
        <Link to="/cart" className="cart-pill" style={{marginLeft:6}}>
          <CartIcon/>
          <span>Cart</span>
          {cartCount > 0 && <span style={{background:'#fff',color:C.deepGreen,borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800}}>{cartCount}</span>}
        </Link>
        {isLoggedIn
          ? <button onClick={onLogout} className="logout-pill" style={{marginLeft:8}}>Logout</button>
          : <Link to="/login" className="login-pill" style={{marginLeft:8}}>Login</Link>}
      </div>
    </nav>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 40px',background:'#e8ede8',borderTop:`1px solid ${C.border}`,fontSize:13,color:C.textMid,fontWeight:500,flexShrink:0}}>
    <span>© 2026 GrocerEase · USTP CDO</span>
    <span style={{opacity:0.65}}>IT 323 – Applications Development</span>
  </footer>
);

// ─────────────────────────────────────────────────────────────────────────────
// HERO BANNER
// ─────────────────────────────────────────────────────────────────────────────
const HeroBanner = ({ displayName, motto, profileImage, animate }) => (
  <div style={{background:C.heroBg,padding:'54px 44px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:28}}>
    <div style={{maxWidth:560,transform: animate ? 'translateX(0)' : 'translateX(-30px)',opacity: animate ? 1 : 0,transition:'all 0.65s ease'}}>
      {displayName ? (
        <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:24}}>
          <div style={{width:100,height:100,borderRadius:'50%',background:'#fff',display:'grid',placeItems:'center',boxShadow:'0 14px 36px rgba(0,0,0,0.09)'}}>
            {profileImage ? (
              <img src={profileImage} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} onError={e=>{e.target.onerror=null;e.target.src=IMG_PLACEHOLDER;}}/>
            ) : (
              <span style={{fontSize:32,color:C.deepGreen}}>👋</span>
            )}
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:C.midGreen,marginBottom:6,letterSpacing:'0.08em'}}>Good to see you again</div>
            <div style={{fontSize:24,fontWeight:900,color:C.textDark,lineHeight:1.1}}>{displayName}</div>
          </div>
        </div>
      ) : null}
      <h1 style={{fontSize:'3rem',fontWeight:900,color:C.deepGreen,lineHeight:1.05,marginBottom:16,maxWidth:520}}>
        {displayName ? `Welcome back, ${displayName}!` : 'Fresh Groceries, Delivered Every Day'}
      </h1>
      <p style={{fontSize:17,color:C.textMid,marginBottom:32,maxWidth:510,lineHeight:1.75}}>
        {displayName ? motto : 'Order fresh market products from local vendors in CDO. Delivered straight to your door.'}
      </p>
      <Link to="/products" style={{display:'inline-block',background:C.deepGreen,color:'#fff',padding:'14px 34px',borderRadius:12,fontWeight:700,fontSize:15,letterSpacing:'0.01em'}}>Shop Now</Link>
    </div>
    <div style={{width:320,flexShrink:0,position:'relative',transform: animate ? 'translateX(0)' : 'translateX(30px)',opacity: animate ? 1 : 0,transition:'all 0.65s ease 0.08s'}}>
      <div style={{position:'absolute',top:-12,right:-12,width:110,height:110,borderRadius:'50%',background:'rgba(46,125,69,0.08)'}}/>
      <div style={{position:'absolute',bottom:-12,left:-10,width:74,height:74,borderRadius:'50%',background:'rgba(200,230,201,0.45)'}}/>
      <div style={{position:'relative',background:'#fff',borderRadius:24,boxShadow:'0 20px 40px rgba(30,77,43,0.08)',padding:26,display:'grid',gap:22}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:60,height:60,borderRadius:'50%',background:C.lightGreen,display:'grid',placeItems:'center',fontSize:28}}>🥑</div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.midGreen,textTransform:'uppercase',letterSpacing:0.8}}>Fresh Picks</div>
            <div style={{fontSize:15,fontWeight:700,color:C.textDark,marginTop:4}}>Delivered to you</div>
          </div>
        </div>
        <div style={{display:'grid',gap:14}}>
          {[
            { label: 'Farm-fresh ingredients', value: 'Picked daily' },
            { label: 'Quick checkout',          value: '2 taps only' },
            { label: 'Better value',            value: 'Local prices' },
          ].map((item, index) => (
            <div key={index} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:16,background:'#f7fbf5'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:12,height:12,borderRadius:'50%',background:C.midGreen,flexShrink:0}}/>
                <div style={{fontSize:13,color:C.textDark,fontWeight:600}}>{item.label}</div>
              </div>
              <div style={{fontSize:12,fontWeight:700,color:C.deepGreen}}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:14,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:24,fontWeight:800,color:C.deepGreen}}>20% OFF</div>
            <div style={{fontSize:12,color:C.textLight,marginTop:4}}>on your first order</div>
          </div>
          <Link to="/products" style={{background:C.deepGreen,color:'#fff',borderRadius:12,padding:'12px 18px',fontSize:13,fontWeight:700,whiteSpace:'nowrap'}}>Browse deals</Link>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────────────────
const HomePage = ({ showToast, onCartUpdated, displayName }) => {
  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [addingId, setAddingId]       = useState(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [heroMotto, setHeroMotto]     = useState('Enjoy personalized grocery picks and fast delivery to your door.');
  const [profileImage, setProfileImage] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setHeroVisible(false);
    const mottoOptions = ['Your grocery list, simplified.','Fresh market finds delivered fast.','Local produce picked just for you.','Shop today, receive fresh tomorrow.','Healthy groceries made easy.'];
    setHeroMotto(mottoOptions[Math.floor(Math.random() * mottoOptions.length)]);
    const timer = setTimeout(() => setHeroVisible(true), 30);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API_BASE_URL}/api/profile/`, { headers: { Authorization: `Token ${token}` } })
      .then(res => setProfileImage(res.data.profile_image || null))
      .catch(() => setProfileImage(null));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/categories/`).then(r => setCategories(r.data)).catch(()=>{});
  }, []);

  useEffect(() => {
    setHeroVisible(false);
    const mottoOptions = ['Your grocery list, simplified.','Fresh market finds delivered fast.','Local produce picked just for you.','Shop today, receive fresh tomorrow.','Healthy groceries made easy.'];
    setHeroMotto(mottoOptions[Math.floor(Math.random() * mottoOptions.length)]);
    const timer = setTimeout(() => setHeroVisible(true), 30);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API_BASE_URL}/api/profile/`, { headers: { Authorization: `Token ${token}` } })
      .then(res => setProfileImage(res.data.profile_image || null))
      .catch(() => setProfileImage(null));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/categories/`)
      .then(r => {
        const data = r.data;
        const categoriesArray = Array.isArray(data) ? data : (data.results || []);
        setCategories(categoriesArray);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedCategory ? `${API_BASE_URL}/api/products/?category=${selectedCategory}` : `${API_BASE_URL}/api/products/`;
    axios.get(url)
      .then(r => {
        const data = r.data;
        const productsArray = Array.isArray(data) ? data : (data.results || []);
        setProducts(productsArray);
      })
      .catch(() => showToast('Could not load products.', 'error'))
      .finally(() => setLoading(false));
  }, [selectedCategory, showToast]);

  const addToCart = async (productId, productName, qty, unit) => {
    const token = localStorage.getItem('token');
    if (!token) { showToast('Please log in first!', 'info'); navigate('/login'); return; }
    setAddingId(productId);
    try {
      await axios.post(
        `${API_BASE_URL}/api/cart/add/`,
        { product_id: productId, quantity: qty },
        { headers: { Authorization: `Token ${token}` } }
      );
      showToast(`${formatQty(qty, unit)} of ${productName} added! 🛒`, 'success');
      onCartUpdated?.();
    } catch { showToast('Failed to add item.', 'error'); }
    finally { setAddingId(null); }
  };

  const handleShowProductDetails = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const displayProducts = selectedCategory ? products : products.slice(0, 8);

  return (
    <div style={{flex:1,overflowY:'auto'}}>
      <HeroBanner displayName={displayName} profileImage={profileImage} motto={heroMotto} animate={heroVisible}/>

      {/* Category row */}
      <div style={{padding:'32px 40px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h3 style={{fontSize:17,fontWeight:700,color:C.textDark}}>Shop by Category</h3>
          <Link to="/products" style={{color:C.midGreen,fontWeight:600,fontSize:13}}>See all →</Link>
        </div>
        <div style={{display:'flex',gap:14,overflowX:'auto',paddingBottom:8}}>
          {categories.map((cat) => (
            <div key={cat.id} onClick={() => setSelectedCategory(selectedCategory===cat.id ? null : cat.id)} style={{minWidth:110,background:'#fff',border:selectedCategory===cat.id?'2px solid #4CAF50':'1px solid #e0e0e0',borderRadius:12,padding:'14px 10px',textAlign:'center',cursor:'pointer',flexShrink:0}}>
              <div style={{height:56,borderRadius:8,marginBottom:10,overflow:'hidden',background:'#f0f8f0'}}>
                <img src={cat.image||IMG_PLACEHOLDER} alt={cat.name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={(e) => { e.target.onerror = null; e.target.src = IMG_PLACEHOLDER; }}/>
              </div>
              <span style={{fontSize:13,fontWeight:600,color:'#333'}}>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured / Filtered Products */}
      <div style={{padding:'28px 40px 48px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <h3 style={{fontSize:17,fontWeight:700,color:C.textDark,marginBottom:4}}>{selectedCategory ? 'Filtered Products' : 'Featured Products'}</h3>
            {!selectedCategory && <p style={{fontSize:13,color:C.textMid}}>Popular picks from our freshest arrivals.</p>}
          </div>
          <Link to="/products" style={{color:C.midGreen,fontWeight:600,fontSize:13}}>See all →</Link>
        </div>
        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:18}}>
            {[...Array(4)].map((_,i)=><SkeletonCard key={i}/>)}
          </div>
        ) : displayProducts.length === 0 ? (
          <div style={{textAlign:'center',padding:'40px',color:C.textMid}}>
            <p style={{marginBottom:16}}>No products found.</p>
            <button onClick={()=>setSelectedCategory(null)} style={{padding:'9px 22px',background:C.deepGreen,color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer'}}>Show All</button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:18}}>
            {displayProducts.map((p) => <ProductCard key={p.id} p={p} onAddToCart={addToCart} addingId={addingId} onShowDetails={handleShowProductDetails} />)}
          </div>
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={handleCloseProductModal}
        onAddToCart={addToCart}
        addingId={addingId}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
const ProductList = ({ showToast, onCartUpdated }) => {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [addingId, setAddingId]     = useState(null);
  const [search, setSearch]         = useState('');
  const [priceMax, setPriceMax]     = useState(500);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { axios.get(`${API_BASE_URL}/api/categories/`).then(r=>setCategories(r.data)).catch(()=>{}); }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedCategory ? `${API_BASE_URL}/api/products/?category=${selectedCategory}` : `${API_BASE_URL}/api/products/`;
    axios.get(url).then(r=>setProducts(Array.isArray(r.data)?r.data:[])).catch(()=>showToast('Could not load products.','error')).finally(()=>setLoading(false));
  }, [selectedCategory, showToast]);

  const addToCart = async (productId, productName, qty, unit) => {
    const token = localStorage.getItem('token');
    if (!token) { showToast('Please log in first!', 'info'); navigate('/login'); return; }
    setAddingId(productId);
    try {
      await axios.post(`${API_BASE_URL}/api/cart/add/`, { product_id: productId, quantity: qty }, { headers: { Authorization: `Token ${token}` } });
      showToast(`${formatQty(qty, unit)} of ${productName} added! 🛒`, 'success');
      onCartUpdated?.();
    } catch { showToast('Failed to add item.', 'error'); }
    finally { setAddingId(null); }
  };

  const handleShowProductDetails = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const filtered = products.filter(p => (!search || p.name.toLowerCase().includes(search.toLowerCase())) && parseFloat(p.price) <= priceMax);
  const allCats  = [{ id: null, name: 'All Products' }, ...categories];

  return (
    <div className="products-layout" style={{display:'flex',flex:1,minHeight:0,overflow:'hidden'}}>
      <aside className="sidebar" style={{width:200,flexShrink:0,background:C.cream,borderRight:`1px solid ${C.border}`,padding:'24px 14px',overflowY:'auto',display:'flex',flexDirection:'column'}}>
        <div style={{marginBottom:32}}>
          <div style={{fontSize:13,fontWeight:700,color:C.textDark,marginBottom:10,paddingLeft:4}}>Categories</div>
          {allCats.map((cat)=>(
            <button key={cat.id??'all'} className={`sidebar-btn${selectedCategory===cat.id?' active':''}`} onClick={()=>setSelectedCategory(cat.id)}>{cat.name}</button>
          ))}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.textDark,marginBottom:14,paddingLeft:4}}>Price Range</div>
          <input type="range" min="0" max="500" step="10" value={priceMax} onChange={e=>setPriceMax(Number(e.target.value))} style={{width:'100%',accentColor:C.deepGreen,marginBottom:8}}/>
          <div style={{fontSize:12,color:C.textMid,paddingLeft:2,fontWeight:500}}>₱0 – ₱{priceMax}</div>
        </div>
      </aside>
      <div style={{flex:1,padding:'24px 28px',overflowY:'auto',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
          <div style={{flex:1,position:'relative'}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:C.textLight,display:'flex'}}><SearchIcon/></span>
            <input type="text" placeholder="Search products or brands…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:'100%',padding:'10px 14px 10px 36px',borderRadius:10,border:`1px solid ${C.border}`,fontSize:14,background:'#fff',color:C.textDark}}/>
          </div>
          <div style={{fontSize:14,color:C.textMid,fontWeight:500,flexShrink:0,whiteSpace:'nowrap'}}>
            Sort by: <span style={{fontWeight:700,color:C.textDark}}>Latest</span>
          </div>
        </div>
        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:18}}>
            {[...Array(8)].map((_,i)=><SkeletonCard key={i}/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 0',color:C.textMid}}>No products found.</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:18}}>
            {filtered.map((p) => <ProductCard key={p.id} p={p} onAddToCart={addToCart} addingId={addingId} onShowDetails={handleShowProductDetails} />)}
          </div>
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={handleCloseProductModal}
        onAddToCart={addToCart}
        addingId={addingId}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const Register = ({ showToast }) => {
  const [firstName, setFirstName]             = useState('');
  const [lastName, setLastName]               = useState('');
  const [username, setUsername]               = useState('');
  const [email, setEmail]                     = useState('');
  const [phone, setPhone]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { showToast('Passwords do not match.', 'error'); return; }
    setLoading(true);
    try {
      // Send all fields to backend
      await axios.post(`${API_BASE_URL}/api/register/`, { username, email, password, first_name: firstName, last_name: lastName, phone });
      showToast('Account created! Sign in now.', 'success');
      navigate('/login');
    } catch { showToast('Registration failed.', 'error'); }
    finally { setLoading(false); }
  };

  const lbl = { display:'block', fontSize:13, fontWeight:600, color:C.textDark, marginBottom:7 };

  return (
    <div style={{flex:1,display:'flex',justifyContent:'center',alignItems:'center',padding:'60px 20px',background:C.cream,overflowY:'auto'}}>
      <div className="auth-card" style={{background:'#fff',borderRadius:18,padding:'44px 40px',width:'100%',maxWidth:440,border:`1px solid ${C.border}`,boxShadow:'0 4px 32px rgba(30,77,43,0.08)'}}>
        <h2 style={{textAlign:'center',fontSize:22,fontWeight:800,color:C.textDark,marginBottom:6}}>Create an Account</h2>
        <p style={{textAlign:'center',fontSize:14,color:C.textLight,marginBottom:28}}>Register to start ordering fresh groceries</p>
        <form onSubmit={handleRegister} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="register-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div><label style={lbl}>First Name</label><input className="form-input" type="text" placeholder="Juan" value={firstName} onChange={e=>setFirstName(e.target.value)} required/></div>
            <div><label style={lbl}>Last Name</label><input className="form-input" type="text" placeholder="Dela Cruz" value={lastName} onChange={e=>setLastName(e.target.value)} required/></div>
          </div>
          <div><label style={lbl}>Email Address</label><input className="form-input" type="email" placeholder="juan@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
          <div><label style={lbl}>Phone Number</label><input className="form-input" type="text" placeholder="09XX XXX XXXX" value={phone} onChange={e=>setPhone(e.target.value)}/></div>
          <div className="register-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div><label style={lbl}>Password</label><input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required/></div>
            <div><label style={lbl}>Confirm Password</label><input className="form-input" type="password" placeholder="••••••••" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required/></div>
          </div>
          <div><label style={lbl}>Username</label><input className="form-input" type="text" placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} required/></div>
          <button type="submit" className="primary-btn" disabled={loading} style={{marginTop:4}}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p style={{textAlign:'center',fontSize:13,color:C.textLight,marginTop:20}}>
          Already have an account? <Link to="/login" style={{color:C.midGreen,fontWeight:700}}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CART
// ─────────────────────────────────────────────────────────────────────────────
const Cart = ({ showToast, onCartUpdated }) => {
  const [cartItems, setCartItems]   = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading]       = useState(true);
  const [coupon, setCoupon]         = useState('');
  const token   = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchCart = useCallback(() => {
    if (!token) return;
    axios.get(`${API_BASE_URL}/api/cart/`, { headers: { Authorization: `Token ${token}` } })
      .then(res => {
        const items = res.data;
        setCartItems(items);
        const qmap = {};
        items.forEach(i => { qmap[i.id] = i.quantity || 1; });
        setQuantities(qmap);
      }).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const removeItem = async (cartId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/cart/remove/${cartId}/`, { headers: { Authorization: `Token ${token}` } });
      showToast('Item removed', 'info');
      fetchCart();
      onCartUpdated?.();
    } catch { showToast('Error removing item', 'error'); }
  };

  const changeQty = (id, delta) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }));
  };

  if (!token) return (
    <div style={{flex:1,display:'flex',justifyContent:'center',alignItems:'center',padding:'80px 40px',background:C.cream}}>
      <div style={{maxWidth:520,textAlign:'center',padding:30,background:'#fff',borderRadius:18,boxShadow:'0 16px 34px rgba(0,0,0,0.08)'}}>
        <div style={{fontSize:22,fontWeight:800,color:C.textDark,marginBottom:10}}>Your cart is waiting</div>
        <p style={{fontSize:15,color:C.textMid,lineHeight:1.7,marginBottom:18}}>Sign in to see your cart and checkout faster.</p>
        <div style={{display:'flex',justifyContent:'center',gap:12}}>
          <Link to="/login"    style={{background:C.deepGreen,color:'#fff',padding:'12px 28px',borderRadius:10,fontWeight:700,fontSize:14}}>Log In</Link>
          <Link to="/register" style={{background:'#e8f5e9',color:C.deepGreen,padding:'12px 28px',borderRadius:10,fontWeight:700,fontSize:14}}>Register</Link>
        </div>
      </div>
    </div>
  );

  const subtotal = cartItems.reduce((s,i) => s + parseFloat(i.product_price||0) * (quantities[i.id]||1), 0);

  return (
    <div style={{flex:1,padding:'32px 40px 48px',background:C.cream,overflowY:'auto'}}>
      <h2 style={{fontSize:22,fontWeight:800,color:C.textDark,marginBottom:22}}>My Shopping Cart</h2>
      {loading ? <Spinner/> : (
        <div className="cart-grid" style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:24,alignItems:'start'}}>
          <div>
            <div style={{background:'#fff',borderRadius:12,overflow:'hidden',border:`1px solid ${C.border}`}}>
              <div style={{display:'grid',gridTemplateColumns:'2.5fr 1fr 1.4fr 1fr 36px',background:C.deepGreen,padding:'12px 18px',gap:8}}>
                {['Product','Price','Quantity','Subtotal',''].map((h,i)=>(
                  <div key={i} style={{fontSize:13,fontWeight:700,color:'#fff'}}>{h}</div>
                ))}
              </div>
              {cartItems.length === 0 ? (
                <div style={{padding:'48px',textAlign:'center',color:C.textMid}}>
                  <p style={{marginBottom:16,fontWeight:500}}>Your cart is empty.</p>
                  <Link to="/products" style={{background:C.deepGreen,color:'#fff',padding:'9px 22px',borderRadius:8,fontWeight:600,fontSize:14,display:'inline-block'}}>Browse Products</Link>
                </div>
              ) : cartItems.map(item => {
                const qty = quantities[item.id] || 1;
                const unit = item.product_unit || 'pcs';
                const lineTotal = (parseFloat(item.product_price||0) * qty).toFixed(0);
                return (
                  <div key={item.id} style={{display:'grid',gridTemplateColumns:'2.5fr 1fr 1.4fr 1fr 36px',padding:'14px 18px',gap:8,alignItems:'center',borderBottom:`1px solid ${C.border}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:11}}>
                      <div style={{width:42,height:42,borderRadius:8,background:C.paleGreen,flexShrink:0,overflow:'hidden'}}>
                        <img src={item.product_image||IMG_PLACEHOLDER} alt={item.product_name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.onerror=null;e.target.src=IMG_PLACEHOLDER;}}/>
                      </div>
                      <div>
                        <span style={{fontSize:14,fontWeight:600,color:C.textDark}}>{item.product_name}</span>
                        <div style={{fontSize:11,color:C.textLight}}>per {unit}</div>
                      </div>
                    </div>
                    <div style={{fontSize:14,color:C.textMid,fontWeight:500}}>₱{item.product_price}</div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <button className="qty-btn" onClick={()=>changeQty(item.id,-1)}>−</button>
                      <span style={{fontSize:14,fontWeight:700,minWidth:20,textAlign:'center'}}>{qty}</span>
                      <button className="qty-btn" onClick={()=>changeQty(item.id,1)}>+</button>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,color:C.deepGreen}}>₱{lineTotal}</div>
                    <button className="remove-btn" onClick={()=>removeItem(item.id)}><XIcon/></button>
                  </div>
                );
              })}
            </div>
            <div style={{display:'flex',gap:12,marginTop:14}}>
              <input type="text" placeholder="Enter coupon code" value={coupon} onChange={e=>setCoupon(e.target.value)}
                style={{flex:1,padding:'10px 16px',borderRadius:9,border:`1px solid ${C.border}`,fontSize:14,background:'#fff',color:C.textDark}}/>
              <button className="apply-btn">Apply</button>
            </div>
          </div>
          <div style={{background:'#fff',borderRadius:12,border:`1px solid ${C.border}`,padding:'22px 20px'}}>
            <h3 style={{fontSize:16,fontWeight:800,color:C.textDark,marginBottom:18}}>Order Summary</h3>
            <div style={{display:'flex',flexDirection:'column',gap:13,marginBottom:18}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:C.textMid}}>
                <span>Subtotal ({cartItems.length} items)</span>
                <span style={{fontWeight:600,color:C.textDark}}>₱{subtotal.toFixed(0)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:C.textMid}}>
                <span>Delivery Fee</span><span style={{fontWeight:600,color:C.midGreen}}>Free</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:C.textMid}}>
                <span>Discount</span><span style={{fontWeight:600,color:C.textDark}}>—₱0</span>
              </div>
              <div style={{borderTop:`1.5px solid ${C.border}`,paddingTop:13,display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:16,fontWeight:800,color:C.textDark}}>Total</span>
                <span style={{fontSize:16,fontWeight:800,color:C.textDark}}>₱{subtotal.toFixed(0)}</span>
              </div>
            </div>
            <button className="checkout-btn" onClick={()=>{ if(cartItems.length>0) navigate('/checkout'); else showToast('Your cart is empty.','info'); }}>
              Proceed to Checkout
            </button>
            <div style={{textAlign:'center',marginTop:14}}>
              <Link to="/products" style={{fontSize:13,color:C.textLight,fontWeight:500}}>← Continue Shopping</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT
// ─────────────────────────────────────────────────────────────────────────────
const Checkout = ({ showToast, onCartUpdated }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [placing, setPlacing]     = useState(false);
  const [payMethod, setPayMethod] = useState('cod');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [address, setAddress]     = useState('');
  const [city, setCity]           = useState('');
  const [contact, setContact]     = useState('');
  const [notes, setNotes]         = useState('');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    axios.get(`${API_BASE_URL}/api/cart/`, { headers: { Authorization: `Token ${token}` } })
      .then(res => setCartItems(res.data)).finally(() => setLoading(false));
  }, [token, navigate]);

  const subtotal = cartItems.reduce((s,i) => s + parseFloat(i.product_price||0) * (i.quantity||1), 0);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !address || !city || !contact) { showToast('Please fill in all required fields.', 'error'); return; }
    setPlacing(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/orders/place/`,
        { first_name: firstName, last_name: lastName, address, city, contact, notes, payment_method: payMethod },
        { headers: { Authorization: `Token ${token}` } }
      );
      showToast('Order placed successfully! 🎉', 'success');
      onCartUpdated?.();
      navigate('/orders');
    } catch { showToast('Failed to place order. Please try again.', 'error'); }
    finally { setPlacing(false); }
  };

  const lbl = { display:'block', fontSize:13, fontWeight:600, color:C.textDark, marginBottom:7 };
  const sectionBox = { background:'#fff', borderRadius:12, border:`1px solid ${C.border}`, padding:'24px 22px', marginBottom:16 };

  return (
    <div style={{flex:1,padding:'32px 40px 48px',background:C.cream,overflowY:'auto'}}>
      <h2 style={{fontSize:22,fontWeight:800,color:C.textDark,marginBottom:22}}>Checkout</h2>
      {loading ? <Spinner/> : (
        <form onSubmit={handlePlaceOrder}>
          <div className="checkout-grid" style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:24,alignItems:'start'}}>
            <div>
              <div style={sectionBox}>
                <h3 style={{fontSize:15,fontWeight:700,color:C.textDark,marginBottom:18,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>1. Delivery Information</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                  <div><label style={lbl}>First Name</label><input className="form-input" type="text" placeholder="Juan" value={firstName} onChange={e=>setFirstName(e.target.value)} required/></div>
                  <div><label style={lbl}>Last Name</label><input className="form-input" type="text" placeholder="Dela Cruz" value={lastName} onChange={e=>setLastName(e.target.value)} required/></div>
                </div>
                <div style={{marginBottom:14}}>
                  <label style={lbl}>Delivery Address</label>
                  <input className="form-input" type="text" placeholder="Purok 5, Brgy. Bulua, CDO City" value={address} onChange={e=>setAddress(e.target.value)} required/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                  <div><label style={lbl}>City</label><input className="form-input" type="text" placeholder="Cagayan de Oro" value={city} onChange={e=>setCity(e.target.value)} required/></div>
                  <div><label style={lbl}>Contact Number</label><input className="form-input" type="text" placeholder="09XX XXX XXXX" value={contact} onChange={e=>setContact(e.target.value)} required/></div>
                </div>
                <div>
                  <label style={lbl}>Order Notes <span style={{fontWeight:400,color:C.textLight}}>(optional)</span></label>
                  <textarea className="form-input" placeholder="Leave a note for the vendor…" value={notes} onChange={e=>setNotes(e.target.value)} rows={3} style={{resize:'vertical',minHeight:72}}/>
                </div>
              </div>
              <div style={sectionBox}>
                <h3 style={{fontSize:15,fontWeight:700,color:C.textDark,marginBottom:16,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>2. Payment Method</h3>
                <div style={{display:'flex',gap:12,marginBottom:14}}>
                  <button type="button" className={`pay-method-btn${payMethod==='cod'?' selected':''}`} onClick={()=>setPayMethod('cod')}><CodIcon/> Cash on Delivery</button>
                  <button type="button" className={`pay-method-btn${payMethod==='paylater'?' selected':''}`} onClick={()=>setPayMethod('paylater')}><PayLaterIcon/> Pay Later</button>
                </div>
                <p style={{fontSize:12,color:C.textLight,lineHeight:1.5}}>Note: Online payment integration (GCash, PayPal) is not yet supported.</p>
              </div>
            </div>
            <div style={{background:'#fff',borderRadius:12,border:`1px solid ${C.border}`,padding:'22px 20px',position:'sticky',top:20}}>
              <h3 style={{fontSize:16,fontWeight:800,color:C.textDark,marginBottom:18}}>Order Summary</h3>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
                {cartItems.map((item)=>(
                  <div key={item.id} style={{display:'flex',justifyContent:'space-between',fontSize:13,color:C.textMid}}>
                    <span style={{fontWeight:500}}>{item.product_name}{(item.quantity||1)>1?` ×${item.quantity||1}`:''} <span style={{color:C.textLight,fontWeight:400}}>({item.product_unit||'pcs'})</span></span>
                    <span style={{fontWeight:600,color:C.textDark}}>₱{(parseFloat(item.product_price||0)*(item.quantity||1)).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,display:'flex',flexDirection:'column',gap:10,marginBottom:18}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:C.textMid}}>
                  <span>Subtotal</span><span style={{fontWeight:600,color:C.textDark}}>₱{subtotal.toFixed(0)}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:C.textMid}}>
                  <span>Delivery</span><span style={{fontWeight:600,color:C.midGreen}}>Free</span>
                </div>
                <div style={{borderTop:`1.5px solid ${C.border}`,paddingTop:10,display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:16,fontWeight:800,color:C.textDark}}>Total</span>
                  <span style={{fontSize:16,fontWeight:800,color:C.textDark}}>₱{subtotal.toFixed(0)}</span>
                </div>
              </div>
              <button type="submit" className="place-order-btn" disabled={placing}>
                <CheckIcon/> {placing ? 'Placing Order…' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isAdmin, setIsAdmin]       = useState(localStorage.getItem('isAdmin') === 'true');
  const [displayName, setDisplayName] = useState(localStorage.getItem('displayName') || '');
  const [cartCount, setCartCount]   = useState(0);
  const [toasts, setToasts]         = useState([]);
  const token = localStorage.getItem('token');

  const showToast = useCallback((message, type='success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const loadCartCount = useCallback(async () => {
    if (!token) { setCartCount(0); return; }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cart/`, { headers: { Authorization: `Token ${token}` } });
      setCartCount(res.data.reduce((sum, item) => sum + (item.quantity || 1), 0));
    } catch { setCartCount(0); }
  }, [token]);

  useEffect(() => { loadCartCount(); }, [loadCartCount]);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_BASE_URL}/api/profile/`, { headers: { Authorization: `Token ${token}` } })
      .then(res => {
        const name = res.data.first_name || res.data.username || '';
        setDisplayName(name);
        setIsAdmin(!!res.data.is_staff);
        localStorage.setItem('displayName', name);
        localStorage.setItem('isAdmin', res.data.is_staff ? 'true' : 'false');
      }).catch(() => {});
  }, [token]);

  const handleLoginSuccess = (identifier, isStaff) => {
    setIsLoggedIn(true);
    setIsAdmin(!!isStaff);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('displayName');
    localStorage.removeItem('isAdmin');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setDisplayName('');
    setCartCount(0);
    showToast('Logged out', 'info');
    window.location.href = '/';
  };

  return (
    <Router>
      <GlobalStyles/>
      <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',background:C.cream}}>
        <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleLogout} cartCount={cartCount}/>
        <div style={{display:'flex',flex:1,flexDirection:'column',overflow:'hidden'}}>
          <Routes>
            <Route path="/"         element={<HomePage      showToast={showToast} onCartUpdated={loadCartCount} displayName={displayName}/>}/>
            <Route path="/products" element={<ProductList   showToast={showToast} onCartUpdated={loadCartCount}/>}/>
            <Route path="/login"    element={<LoginPage onLoginSuccess={handleLoginSuccess}/>}/>
            <Route path="/register" element={<Register      showToast={showToast}/>}/>
            <Route path="/cart"     element={<Cart          showToast={showToast} onCartUpdated={loadCartCount}/>}/>
            <Route path="/checkout" element={<Checkout      showToast={showToast} onCartUpdated={loadCartCount}/>}/>
            <Route path="/orders"   element={<OrdersPage    showToast={showToast} onCartUpdated={loadCartCount}/>}/>
            <Route path="/profile"  element={<ProfilePage   showToast={showToast} onProfileUpdated={(name) => { setDisplayName(name); localStorage.setItem('displayName', name); }}/>}/>
            <Route path="/admin"    element={<AdminDashboard showToast={showToast}/>}/>
            <Route path="*"         element={
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:C.cream,gap:12}}>
                <div style={{fontSize:72,fontWeight:900,color:C.lightGreen}}>404</div>
                <div style={{fontSize:20,fontWeight:700,color:C.textDark}}>Page not found</div>
                <a href="/" style={{marginTop:8,background:C.deepGreen,color:'#fff',padding:'10px 28px',borderRadius:10,fontWeight:700,fontSize:14}}>Go Home</a>
              </div>
            }/>
          </Routes>
        </div>
        <Footer/>
        <ToastContainer toasts={toasts} dismissToast={id=>setToasts(t=>t.filter(x=>x.id!==id))}/>
      </div>
    </Router>
  );
}
