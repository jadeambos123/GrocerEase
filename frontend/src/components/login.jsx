import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // New state to toggle between standard and admin login
    const [isAdminMode, setIsAdminMode] = useState(false); 
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Using your Render backend URL
            const response = await axios.post('https://grocerease-3.onrender.com/api-token-auth/', {
                username: username,
                password: password
            });

            // Ensure your Django backend is sending is_staff and user_id in the token response
            const { token, is_staff, user_id } = response.data;

            // 1. Store everything in LocalStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user_id', user_id);
            localStorage.setItem('is_staff', is_staff); 

            console.log(`Login Successful! Mode: ${isAdminMode ? 'Admin' : 'Customer'}, Staff Status:`, is_staff);

            // 2. The "Redirect Bridge" with Role Verification
            if (isAdminMode) {
                if (is_staff === true || is_staff === "true") {
                    // Success: User is an admin and used the admin toggle
                    navigate('/admin'); 
                } else {
                    // Failure: User tried to log in as admin but isn't staff
                    setError("Access Denied: You do not have admin privileges.");
                    localStorage.clear(); // Security: Clear token if unauthorized
                }
            } else {
                // Standard customer login
                navigate('/');
            }

        } catch (err) {
            console.error("Login Error:", err);
            setError('Invalid username or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ backgroundColor: '#f4f7f4', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div className="login-card" style={{ background: 'white', padding: '2.5rem', borderRadius: '15px', boxShadow: '0 4px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px' }}>
                
                {/* Mode Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ 
                        backgroundColor: isAdminMode ? '#1e3d1a' : '#2d5a27', 
                        width: '60px', height: '60px', borderRadius: '12px', margin: '0 auto', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: '0.3s'
                    }}>
                        <span style={{ fontSize: '28px' }}>{isAdminMode ? '🛠️' : '🛒'}</span>
                    </div>
                    <h2 style={{ color: '#2d5a27', marginTop: '1rem', fontWeight: '800' }}>
                        {isAdminMode ? 'Admin Portal' : 'Welcome Back'}
                    </h2>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        {isAdminMode ? 'Management Login' : 'Log in to your GrocerEase account'}
                    </p>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#fff2f2', color: '#d32f2f', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', marginBottom: '1rem', border: '1px solid #ffcdd2' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '600', fontSize: '13px' }}>Username</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '600', fontSize: '13px' }}>Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            width: '100%', 
                            padding: '14px', 
                            backgroundColor: isAdminMode ? '#1e3d1a' : '#2d5a27', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            transition: 'background 0.3s'
                        }}
                    >
                        {loading ? 'Verifying...' : isAdminMode ? 'Access Dashboard' : 'Log In'}
                    </button>
                </form>

                {/* Toggle between Admin and Customer */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                    <button 
                        onClick={() => {
                            setIsAdminMode(!isAdminMode);
                            setError('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#2d5a27', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {isAdminMode ? 'Back to Customer Login' : 'Are you an Admin? Login here'}
                    </button>
                </div>

                {!isAdminMode && (
                    <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '14px' }}>
                        Don't have an account? <Link to="/register" style={{ color: '#2d5a27', fontWeight: 'bold', textDecoration: 'none' }}>Register here</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;