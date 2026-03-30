import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:8000/api-token-auth/', {
                username, password
            });
            localStorage.setItem('token', response.data.token);
            alert('Logged in!');
        } catch {
            alert('Error logging in');
        }
    };

    return (
        <div style={{ padding: '50px' }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} /><br/>
                <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} /><br/>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
