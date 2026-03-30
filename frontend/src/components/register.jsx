import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', {
        username,
        email,
        password,
      });
      alert('Account created! Sign in now.');
    } catch {
      alert('Registration failed');
    }
  };

  return (
    <div style={{ padding: '50px' }}>
      <h2>Create an Account</h2>
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} /><br/>
        <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} /><br/>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br/>
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} /><br/>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><br/>
        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /><br/>
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
};

export default Register;
