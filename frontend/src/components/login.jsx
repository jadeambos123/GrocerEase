import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Replace this URL with your actual Render backend URL
            const response = await axios.post('https://grocerease-3.onrender.com/api-token-auth/', {
                username: username,
                password: password
            });

            const { token, is_staff, user_id } = response.data;

            // 1. Store everything in LocalStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user_id', user_id);
            localStorage.setItem('is_staff', is_staff); // Stores as true/false

            console.log("Login Successful! Admin Status:", is_staff);

            // 2. The "Redirect Bridge"
            if (is_staff === true) {
                // If they are an admin, send them to the green dashboard
                navigate('/admin'); 
            } else {
                // If they are a regular customer, send them to the home page
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
        <div className="login-container" style={{ backgroundColor: '#f4f7f4', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="login-card" style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ backgroundColor: '#2d5a27', width: '50px', height: '50px', borderRadius: '10px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontSize: '24px' }}>🛒</span>
                    </div>
                    <h2 style={{ color: '#2d5a27', marginTop: '1rem' }}>Welcome Back</h2>
                    <p style={{ color: '#666' }}>Log in to your GrocerEase account</p>
                </div>

                {error && <p style={{ color: 'red', textAlign: 'center', fontSize: '14px' }}>{error}</p>}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Username</label>
                        <input 
                            type="text" 
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>Password</label>
                        <input 
                            type="password" 
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            backgroundColor: '#2d5a27', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#2d5a27', fontWeight: 'bold' }}>Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;