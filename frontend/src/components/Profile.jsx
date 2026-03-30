import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ProfilePage = ({ showToast, onProfileUpdated }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    axios.get('http://127.0.0.1:8000/api/profile/', { headers: { Authorization: `Token ${token}` } })
      .then(res => {
        setProfile(res.data);
        setFirstName(res.data.first_name || '');
        setLastName(res.data.last_name || '');
        setEmail(res.data.email || '');
        setPreviewImage(res.data.profile_image || null);
      })
      .catch(() => showToast('Failed to load profile.', 'error'))
      .finally(() => setLoading(false));
  }, [token, showToast]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('email', email);
      if (selectedImage) {
        formData.append('profile_image', selectedImage);
      }
      const res = await axios.put(
        'http://127.0.0.1:8000/api/profile/update/',
        formData,
        { headers: { Authorization: `Token ${token}` } }
      );
      setProfile(res.data);
      setPreviewImage(res.data.profile_image || previewImage);
      const updatedName = res.data.first_name ? `${res.data.first_name} ${res.data.last_name || ''}`.trim() : res.data.username || '';
      if (onProfileUpdated) onProfileUpdated(updatedName);
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to save profile.';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const initials = profile ? `${(profile.first_name || profile.username || ' ')[0].toUpperCase()}${(profile.last_name || ' ')[0].toUpperCase()}` : '';

  if (!token) {
    return (
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 40px', background: '#f2f6f2' }}>
        <div style={{ maxWidth: 520, textAlign: 'center', padding: 30, background: '#fff', borderRadius: 18, boxShadow: '0 16px 34px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1e4d2b', marginBottom: 10 }}>Welcome to GrocerEase</div>
            <p style={{ fontSize: 15, color: '#4a5568', lineHeight: 1.7 }}>
              To personalize your experience, manage your details, and make faster grocery orders, please log in or create an account.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/login" style={{ background: '#1e4d2b', color: '#fff', padding: '12px 26px', borderRadius: 10, fontWeight: 700 }}>Log In</Link>
            <Link to="/register" style={{ background: '#e8f5e9', color: '#1e4d2b', padding: '12px 26px', borderRadius: 10, fontWeight: 700 }}>Register</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '32px 40px 48px', background: '#f7faf4', overflowY: 'auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e4d2b', marginBottom: 18 }}>My Profile</h2>
      {loading ? (
        <div style={{ color: '#4a5568', fontSize: 15 }}>Loading profile…</div>
      ) : profile ? (
        <div style={{ maxWidth: 760, display: 'grid', gap: 22 }}>
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #d8e2d7', padding: 28, display: 'grid', gap: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#e8f5e9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#1e4d2b', boxShadow: '0 10px 30px rgba(30,77,43,0.08)' }}>
                {previewImage ? (
                  <img src={previewImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e4d2b', marginBottom: 4 }}>{profile.username}</div>
                <div style={{ fontSize: 13, color: '#718096' }}>Upload a profile picture and save it to update your hero image.</div>
                <label htmlFor="profile-image-upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 14px', borderRadius: 10, background: '#e8f5e9', color: '#1e4d2b', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  Change photo
                </label>
                <input id="profile-image-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#1e4d2b' }}>First name</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} className="form-input" type="text" placeholder="First name" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#1e4d2b' }}>Last name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} className="form-input" type="text" placeholder="Last name" required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#1e4d2b' }}>Email address</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="form-input" type="email" placeholder="you@example.com" required />
              </div>
              <button type="submit" className="primary-btn" disabled={saving} style={{ width: 160, padding: '12px 18px' }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d8e2d7', padding: 24 }}>
            <div style={{ fontSize: 14, color: '#718096', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Account details</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#4a5568' }}>Username</span>
                <span style={{ fontWeight: 700, color: '#1e4d2b' }}>{profile.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#4a5568' }}>Email</span>
                <span style={{ fontWeight: 700, color: '#1e4d2b' }}>{profile.email || '–'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: '#4a5568' }}>Joined</span>
                <span style={{ fontWeight: 700, color: '#1e4d2b' }}>{new Date(profile.date_joined).toLocaleDateString()}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <Link to="/orders" style={{ display: 'inline-block', background: '#1e4d2b', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 700 }}>View Orders</Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: '#4a5568', fontSize: 15 }}>Could not load your profile data.</div>
      )}
    </div>
  );
};

export default ProfilePage;
