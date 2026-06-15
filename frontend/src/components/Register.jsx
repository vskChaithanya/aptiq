import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';

function Register() {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [step, setStep] = useState(1); // 1: Details form, 2: OTP verification
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isSuccess: false });

  // Form Data State
  const [name, setName] = useState('');
  const [hallTicket, setHallTicket] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // --- HELPER FUNCTIONS ---
  const displayMessage = (msg, isSuccess) => {
    setMessage({ text: msg, isSuccess });
    setTimeout(() => setMessage({ text: '', isSuccess: false }), 5000);
  };

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    // Auto-clear or adjust fields if you want, otherwise just let the UI update
  };

  // --- API CALLS ---
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('https://aptiqforu.onrender.com/api/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, hallTicket, email, password, role })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStep(2); // Move to OTP step
        displayMessage("OTP Sent! Please check your email.", true);
      } else {
        displayMessage(data.message, false);
      }
    } catch (err) { 
      displayMessage("Server error. Make sure node server.js is running.", false); 
    }
    
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return displayMessage("Please enter the full 6-digit OTP.", false);
    setLoading(true);

    try {
      const res = await fetch('https://aptiqforu.onrender.com/api/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await res.json();

      if (res.ok) {
        displayMessage("Account created successfully! Redirecting to login...", true);
        setTimeout(() => { navigate('/'); }, 2000); // Route back to login page
      } else {
        displayMessage(data.message, false);
      }
    } catch (err) { 
      displayMessage("Server error during verification.", false); 
    }
    
    setLoading(false);
  };

  const cancelRegistration = () => {
    setStep(1);
    setOtp('');
  };

  // --- UI RENDER ---
  return (
    <div className="register-card">
      <h2 className="reg-title">Create Account</h2>
      <p className="reg-subtitle">
        {role === 'student' ? 'Register as a University Student' : 'Register as Faculty'}
      </p>

      {/* STEP 1: REGISTRATION FORM */}
      {step === 1 && (
        <div>
          <div className="tabs">
            <button 
              className={`tab ${role === 'student' ? 'active' : ''}`} 
              onClick={() => handleRoleSwitch('student')}
            >
              👨‍🎓 Student
            </button>
            <button 
              className={`tab ${role === 'faculty' ? 'active' : ''}`} 
              onClick={() => handleRoleSwitch('faculty')}
            >
              👨‍🏫 Faculty
            </button>
          </div>

          <form onSubmit={handleSendOTP}>
            <div className="input-group">
              <input 
                type="text" 
                className="input-field" 
                placeholder="Full Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
            <div className="input-group">
              <input 
                type="text" 
                className="input-field" 
                placeholder={role === 'student' ? 'Hall Ticket Number' : 'Employee ID'} 
                value={hallTicket}
                onChange={(e) => setHallTicket(e.target.value)}
                required 
              />
            </div>
            <div className="input-group">
              <input 
                type="email" 
                className="input-field" 
                placeholder={role === 'student' ? 'student@sru.edu.in' : 'aptiq.noreply@gmail.com'} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="input-group">
              <input 
                type={showPassword ? "text" : "password"} 
                className="input-field password-field" 
                placeholder="Create Password" 
                minLength="5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Sending OTP..." : "Send Verification OTP"}
            </button>
          </form>

          <div className="links">
            Already have an account? <Link to="/">Sign In</Link>
          </div>
        </div>
      )}

      {/* STEP 2: OTP VERIFICATION */}
      {step === 2 && (
        <div>
          <h3 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Verify Your Email</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            We've sent a 6-digit code to your email.<br/>Enter it below to complete registration.
          </p>
          
          <div className="input-group">
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter 6-digit OTP" 
              maxLength="6" 
              style={{ textAlign: 'center', letterSpacing: '5px', fontSize: '20px', fontWeight: 'bold' }}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify & Create Account"}
          </button>
          <button 
            type="button" 
            className="btn" 
            style={{ background: '#f1f5f9', color: '#0f172a' }} 
            onClick={cancelRegistration}
          >
            Cancel
          </button>
        </div>
      )}

      {/* GLOBAL MESSAGE BOX */}
      <div id="msgBox" style={{ color: message.isSuccess ? '#10b981' : '#ef4444', marginTop: '15px' }}>
        {message.text}
      </div>
    </div>
  );
}

export default Register;