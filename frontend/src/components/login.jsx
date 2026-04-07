import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('https://grocerease-3.onrender.com/api-token-auth/', {
                username,
                password,
            });

            const { token, is_staff, user_id } = response.data;

            // SAFETY CHECK: handle both boolean and string "true"
            const userIsStaff = is_staff === true || is_staff === 'true';

            if (isAdminMode && !userIsStaff) {
                setError('Access Denied: You do not have admin privileges.');
                return; // don't store anything, don't navigate
            }

            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user_id', user_id);
            localStorage.setItem('is_staff', userIsStaff ? 'true' : 'false');

            // Fetch profile to get display name
            let displayName = username;
            try {
                const profileRes = await axios.get('https://grocerease-3.onrender.com/api/profile/', {
                    headers: { Authorization: `Token ${token}` },
                });
                displayName = profileRes.data.first_name || profileRes.data.username || username;
                localStorage.setItem('displayName', displayName);
            } catch {
                localStorage.setItem('displayName', displayName);
            }

            // Tell App.jsx about the login so Navbar updates instantly
            onLoginSuccess?.(displayName, userIsStaff);

            if (isAdminMode && userIsStaff) {
                navigate('/admin');
            } else {
                navigate('/');
            }

        } catch (err) {
            setError('Invalid username or password.');
        } finally {
            setLoading(false);
        }
    };

    const C = {
        deepGreen:  '#1e4d2b',
        midGreen:   '#2d5a27',
        adminGreen: '#1e3d1a',
        border:     '#dde8dd',
        paleGreen:  '#e8f5e9',
        cream:      '#f5f2eb',
        textDark:   '#1a2e1e',
        textLight:  '#718096',
        red:        '#d32f2f',
        redBg:      '#fff2f2',
    };

    return (
        <div style={{
            backgroundColor: C.cream,
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
        }}>
            <div style={{
                background: '#fff',
                padding: '2.5rem',
                borderRadius: '18px',
                boxShadow: '0 4px 32px rgba(30,77,43,0.10)',
                width: '100%',
                maxWidth: '420px',
                border: `1px solid ${C.border}`,
            }}>

                {/* Icon + Title */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        backgroundColor: isAdminMode ? C.adminGreen : C.deepGreen,
                        width: 60, height: 60,
                        borderRadius: 14,
                        margin: '0 auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.3s',
                        boxShadow: '0 4px 14px rgba(30,77,43,0.18)',
                    }}>
                        <span style={{ fontSize: 28 }}>{isAdminMode ? '🛠️' : '🛒'}</span>
                    </div>
                    <h2 style={{ color: C.textDark, marginTop: '1rem', fontWeight: 800, fontSize: 22 }}>
                        {isAdminMode ? 'Admin Portal' : 'Welcome Back'}
                    </h2>
                    <p style={{ color: C.textLight, fontSize: 14, marginTop: 4 }}>
                        {isAdminMode
                            ? 'Sign in with your administrator credentials'
                            : 'Log in to your GrocerEase account'}
                    </p>
                </div>

                {/* Admin mode banner */}
                {isAdminMode && (
                    <div style={{
                        background: '#f0faf0',
                        border: `1.5px solid ${C.midGreen}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: C.adminGreen,
                        fontWeight: 600,
                    }}>
                        <span>🔒</span>
                        Admin access only — staff credentials required
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{
                        backgroundColor: C.redBg,
                        color: C.red,
                        padding: '10px 14px',
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: 'center',
                        marginBottom: '1rem',
                        border: '1px solid #fecaca',
                    }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: 6, color: C.textDark, fontWeight: 600, fontSize: 13 }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            style={{
                                width: '100%', padding: '11px 13px', borderRadius: 9,
                                border: `1px solid ${C.border}`, boxSizing: 'border-box',
                                fontSize: 14, color: C.textDark, background: '#fff',
                            }}
                            onFocus={e => { e.target.style.borderColor = C.midGreen; e.target.style.boxShadow = '0 0 0 3px rgba(46,125,69,0.1)'; }}
                            onBlur={e =>  { e.target.style.borderColor = C.border;    e.target.style.boxShadow = 'none'; }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: 6, color: C.textDark, fontWeight: 600, fontSize: 13 }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%', padding: '11px 13px', borderRadius: 9,
                                border: `1px solid ${C.border}`, boxSizing: 'border-box',
                                fontSize: 14, color: C.textDark, background: '#fff',
                            }}
                            onFocus={e => { e.target.style.borderColor = C.midGreen; e.target.style.boxShadow = '0 0 0 3px rgba(46,125,69,0.1)'; }}
                            onBlur={e =>  { e.target.style.borderColor = C.border;    e.target.style.boxShadow = 'none'; }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '13px',
                            backgroundColor: loading ? '#9e9e9e' : isAdminMode ? C.adminGreen : C.deepGreen,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 700,
                            fontSize: 15,
                            transition: 'background 0.18s',
                            fontFamily: 'inherit',
                        }}
                        onMouseOver={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
                        onMouseOut={e =>  { e.currentTarget.style.opacity = '1'; }}
                    >
                        {loading ? 'Verifying…' : isAdminMode ? '🛠️ Enter Admin Dashboard' : 'Log In'}
                    </button>
                </form>

                {/* Toggle admin / customer */}
                <div style={{ textAlign: 'center', marginTop: '1.4rem' }}>
                    <button
                        onClick={() => { setIsAdminMode(!isAdminMode); setError(''); }}
                        style={{
                            background: isAdminMode ? C.paleGreen : '#f0faf0',
                            border: `1.5px solid ${C.border}`,
                            color: C.midGreen,
                            padding: '7px 18px',
                            borderRadius: 20,
                            fontSize: 12,
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontFamily: 'inherit',
                            transition: 'all 0.18s',
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = C.midGreen}
                        onMouseOut={e =>  e.currentTarget.style.borderColor = C.border}
                    >
                        {isAdminMode ? '← Back to Customer Login' : '🛠️ Login as Administrator'}
                    </button>
                </div>

                {/* Register link — only for customer mode */}
                {!isAdminMode && (
                    <p style={{ textAlign: 'center', marginTop: '1rem', color: C.textLight, fontSize: 14 }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: C.midGreen, fontWeight: 700 }}>Register</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;