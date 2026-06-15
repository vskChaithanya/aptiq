import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Profile() {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState({});
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isSuccess: false });

  // --- INITIALIZATION ---
  useEffect(() => {
    const token = localStorage.getItem('aptiq_token');
    const savedUser = JSON.parse(localStorage.getItem('aptiq_user'));
    
    if (!token || !savedUser) {
      navigate('/');
      return;
    }
    
    setUser(savedUser);
  }, [navigate]);

  // --- ACTIONS ---
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleDashboardReturn = () => {
    if (user.role === 'faculty') {
      navigate('/faculty-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isSuccess: false });

    const token = localStorage.getItem('aptiq_token');

    try {
      const res = await fetch('http://localhost:3000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, oldPassword, newPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ text: data.message, isSuccess: true });
        setOldPassword('');
        setNewPassword('');
      } else {
        setMessage({ text: data.message, isSuccess: false });
      }
    } catch (err) {
      setMessage({ text: 'Server error. Please try again.', isSuccess: false });
    }
    
    setLoading(false);
  };

  // --- UI RENDER ---
  return (
    <div className="profile-app">
      {/* TOP NAVIGATION */}
      <header className="profile-top-nav">
        <div className="brand">
          <div className="title" style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>AptIQ Portal</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={handleDashboardReturn} 
            className="btn btn-ghost" 
            style={{ padding: '10px 16px', background: '#f1f5f9', color: '#0f172a' }}
          >
            Dashboard
          </button>
          <button 
            onClick={handleLogout} 
            className="btn btn-primary" 
            style={{ padding: '10px 16px', background: '#ef4444', color: 'white' }}
          >
            Log Out
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ display: 'block' }}>
        <section className="card" style={{ width: '100%', maxWidth: '700px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(14,30,60,0.04)' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>{user.role === 'faculty' ? 'Faculty Profile' : 'Student Profile'}</h2>
          <p className="muted" style={{ marginBottom: '25px', color: '#64748b' }}>Manage your university account details and security.</p>
          
          <div className="profile-grid">
            <div className="info-box">
              <div className="info-label">Full Name</div>
              <div className="info-value">{user.name || 'Loading...'}</div>
            </div>
            <div className="info-box">
              <div className="info-label">{user.role === 'faculty' ? 'Employee ID' : 'Hall Ticket Number'}</div>
              <div className="info-value">{user.hallTicket || 'Loading...'}</div>
            </div>
            <div className="info-box full-width">
              <div className="info-label">Registered University Email</div>
              <div className="info-value">{user.email || 'Loading...'}</div>
            </div>
          </div>

          <h3 style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '25px', color: '#0f172a' }}>Change Password</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            <input 
              type="password" 
              placeholder="Current Password" 
              required 
              style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px' }}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="New Password" 
              required 
              style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '15px' }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            
            {message.text && (
              <div style={{ 
                fontSize: '14px', 
                padding: '12px', 
                borderRadius: '8px',
                backgroundColor: message.isSuccess ? '#ecfdf5' : '#fef2f2',
                color: message.isSuccess ? '#065f46' : '#991b1b',
                border: `1px solid ${message.isSuccess ? '#a7f3d0' : '#fecaca'}`
              }}>
                {message.text}
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '200px', padding: '12px', background: '#3b82f6', color: 'white', marginTop: '5px' }}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

        </section>
      </main>
    </div>
  );
}

export default Profile;