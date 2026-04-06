import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
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
                username: username,
                password: password
            });

            const { token, is_staff, user_id } = response.data;

            // Store in LocalStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user_id', user_id);
            localStorage.setItem('is_staff', is_staff); 

            // SAFETY CHECK: Handle both boolean and string "true"
            const userIsStaff = is_staff === true || is_staff === "true";

            if (isAdminMode) {
                if (userIsStaff) {
                    navigate('/admin'); 
                } else {
                    setError("Access Denied: You do not have admin privileges.");
                    localStorage.clear(); 
                }
            } else {
                navigate('/');
            }

        } catch (err) {
            setError('Invalid username or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ backgroundColor: '#f4f7f4', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div className="login-card" style={{ background: 'white', padding: '2.5rem', borderRadius: '15px', boxShadow: '0 4px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ backgroundColor: isAdminMode ? '#1e3d1a' : '#2d5a27', width: '60px', height: '60px', borderRadius: '12px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}>
                        <span style={{ fontSize: '28px' }}>{isAdminMode ? '🛠️' : '🛒'}</span>
                    </div>
                    <h2 style={{ color: '#2d5a27', marginTop: '1rem', fontWeight: '800' }}>
                        {isAdminMode ? 'Admin Portal' : 'Welcome Back'}
                    </h2>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#fff2f2', color: '#d32f2f', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '600' }}>Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '600' }}>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                    </div>

                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: isAdminMode ? '#1e3d1a' : '#2d5a27', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {loading ? 'Verifying...' : isAdminMode ? 'Admin Access' : 'Log In'}
                    </button>
                </form>

                {/* VISUAL UPDATE: Explicit Toggle Button */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button 
                        onClick={() => { setIsAdminMode(!isAdminMode); setError(''); }}
                        style={{ background: '#e8f0e7', border: 'none', color: '#2d5a27', padding: '8px 15px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        {isAdminMode ? '← Back to Customer Login' : 'Login as Administrator'}
                    </button>
                </div>

                {!isAdminMode && (
                    <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '14px' }}>
                        Don't have an account? <Link to="/register" style={{ color: '#2d5a27', fontWeight: 'bold' }}>Register</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;