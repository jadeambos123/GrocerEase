import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:8000/api-token-auth/', {
                username, password
            });

            // Destructure the data from our new CustomAuthToken view
            const { token, is_staff } = response.data;

            // Save to storage
            localStorage.setItem('token', token);
            localStorage.setItem('is_staff', is_staff);

            // Redirect logic
            if (is_staff === true || is_staff === "true") {
                navigate('/admin'); // Sends admins to the Dashboard
            } else {
                navigate('/'); // Sends regular users to the Store
            }

        } catch (error) {
            console.error(error);
            alert('Error logging in. Please check your credentials.');
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Username" 
                    onChange={e => setUsername(e.target.value)} 
                    style={{ padding: '8px' }}
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    onChange={e => setPassword(e.target.value)} 
                    style={{ padding: '8px' }}
                />
                <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;