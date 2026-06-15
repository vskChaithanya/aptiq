import React, { useState, useEffect, useRef } from 'react';
import '../App.css'; // Make sure your CSS is linked!

function Login() {
  // --- 1. STATE MANAGEMENT (Replaces document.getElementById) ---
  const [currentRole, setCurrentRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isSuccess: false });

  // Password Reset States
  const [resetStep, setResetStep] = useState(0); // 0: Main Login, 1: Email, 2: OTP, 3: New Pass
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // --- 2. 3D BACKGROUND LOGIC (Runs once when component loads) ---
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let outerParticles = [];
    let angleX = 0;
    let angleY = 0;

    const bgContent = [
      '∫e^x dx', '∑(n=1 to ∞)', 'f(x)=ax²+bx+c', 'import numpy as np',
      'def __init__(self):', '∇×F', 'O(n log n)', 'print("AptIQ")',
      'λx: x²', 'lim(x→∞)', 'E = mc²', 'pd.DataFrame()',
      'model.fit(X, y)', 'return True', '[1, 2, 3]', 'math.sqrt()'
    ];
    const bgColors = ['#3b82f6', '#64748b', '#94a3b8', '#cbd5e1', '#f59e0b'];

    const resizeOuter = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeOuter);
    resizeOuter();

    for (let i = 0; i < 120; i++) {
      outerParticles.push({
        x: (Math.random() - 0.5) * 2500,
        y: (Math.random() - 0.5) * 2500,
        z: (Math.random() - 0.5) * 2500,
        text: bgContent[Math.floor(Math.random() * bgContent.length)],
        color: bgColors[Math.floor(Math.random() * bgColors.length)],
        baseSize: Math.random() * 20 + 15
      });
    }

    const drawOuter3D = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const fov = 600;

      angleX += 0.0004;
      angleY += 0.0008;

      let projectedPoints = [];

      for (let p of outerParticles) {
        let cosY = Math.cos(angleY), sinY = Math.sin(angleY);
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        let cosX = Math.cos(angleX), sinX = Math.sin(angleX);
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        let z = z2 + 1200;
        if (z < 1) z = 1;
        let scale = fov / z;
        let px = cx + x1 * scale;
        let py = cy + y2 * scale;

        projectedPoints.push({
          x: px, y: py, z: z, scale: scale,
          text: p.text, color: p.color, baseSize: p.baseSize
        });
      }

      projectedPoints.sort((a, b) => b.z - a.z);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let p of projectedPoints) {
        let alpha = Math.min(1, Math.max(0, 1.8 - p.z / 1200));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        let fontSize = p.baseSize * p.scale;
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.fillText(p.text, p.x, p.y);
      }
      animationFrameId = requestAnimationFrame(drawOuter3D);
    };

    drawOuter3D();

    // Cleanup function when leaving the page
    return () => {
      window.removeEventListener('resize', resizeOuter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- 3. HELPER FUNCTIONS ---
  const displayMessage = (msg, isSuccess) => {
    setMessage({ text: msg, isSuccess });
    setTimeout(() => setMessage({ text: '', isSuccess: false }), 5000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/login', { // Point to Node backend
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.user.role !== currentRole) {
          setLoading(false);
          return displayMessage(`Account belongs to ${data.user.role}, please switch tabs.`, false);
        }
        localStorage.setItem('aptiq_token', data.token);
        localStorage.setItem('aptiq_user', JSON.stringify(data.user));
        window.location.href = currentRole === 'student' ? '/dashboard' : '/faculty-dashboard';
      } else {
        displayMessage(data.message, false);
        setLoading(false);
      }
    } catch (err) {
      displayMessage('Server error. Please start Node server.', false);
      setLoading(false);
    }
  };

  const startPasswordReset = () => {
    setResetEmail(email); // Carry over the typed email
    setResetStep(1);
  };

  const sendOTP = async () => {
    if (!resetEmail) return displayMessage("Please enter your email.", false);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/forgot-password/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail })
      });
      if (res.ok) {
        displayMessage("OTP sent! Check your email or terminal.", true);
        setResetStep(2);
      } else { 
        const data = await res.json();
        displayMessage(data.message, false); 
      }
    } catch (err) { displayMessage('Server error.', false); }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) return displayMessage("Enter a 6-digit OTP.", false);
    try {
      const res = await fetch('http://localhost:3000/api/forgot-password/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail, otp })
      });
      if (res.ok) {
        displayMessage("OTP Verified!", true);
        setResetStep(3);
      } else { displayMessage("Invalid OTP.", false); }
    } catch (err) { displayMessage('Server error.', false); }
  };

  const resetPassword = async () => {
    if (newPassword.length < 5) return displayMessage("Password too short.", false);
    try {
      const res = await fetch('http://localhost:3000/api/forgot-password/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail, otp, newPassword })
      });
      if (res.ok) {
        displayMessage("Password reset successfully! Please Log In.", true);
        setTimeout(() => setResetStep(0), 2000); // Send back to login
      } else { displayMessage("Error resetting password.", false); }
    } catch (err) { displayMessage('Server error.', false); }
  };

  // --- 4. THE UI (JSX) ---
  return (
    <>
      <canvas ref={canvasRef} id="outer3DCanvas"></canvas>

      <div className="split-layout">
        <div className="illustration-side">
          <img src="/python.webp" alt="AptIQ Portal Banner" />
        </div>

        <div className="form-side">
          
          {/* CONDITIONAL RENDER: Show Login OR Password Reset */}
          {resetStep === 0 ? (
            <div id="mainLoginSection">
              <h1 className="logo-text">Apti<span>Q</span></h1>
              <div className="login-heading">Login</div>

              <div className="tabs">
                <button 
                  className={`tab ${currentRole === 'student' ? 'active' : ''}`} 
                  onClick={() => setCurrentRole('student')}
                >Student</button>
                <button 
                  className={`tab ${currentRole === 'faculty' ? 'active' : ''}`} 
                  onClick={() => setCurrentRole('faculty')}
                >Faculty</button>
              </div>

              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <label className="input-label">
                    {currentRole === 'student' ? 'Email / Hallticket Number ' : 'Admin Email Address '}
                    <span>*</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </span>
                    <input 
                      type="email" 
                      className="input-field" 
                      placeholder={currentRole === 'student' ? "student@sru.edu.in" : ""} 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Password <span>*</span></label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                    </span>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="input-field" 
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="options-row">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} /> Show Password
                  </label>
                  <a className="forgot-link" onClick={startPasswordReset}>Forgot Password ?</a>
                </div>

                <button type="submit" className="btn-sign-in" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="register-link">
                Don't have an account? <a href="/register">Register</a>
              </div>
            </div>
          ) : (
            // PASSWORD RESET SECTION
            <div id="resetContainer" className="reset-section" style={{ display: 'block' }}>
              <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '18px' }}>Reset Password</h3>
              
              {resetStep === 1 && (
                <div>
                  <div className="input-wrapper" style={{ marginBottom: '15px' }}>
                    <input type="email" className="input-field" style={{ paddingLeft: '15px' }} placeholder="Enter registered email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                  </div>
                  <button type="button" className="btn-outline" onClick={sendOTP} disabled={loading}>{loading ? "Sending..." : "Send OTP"}</button>
                  <button type="button" className="btn-outline" style={{ border: 'none', color: '#64748b' }} onClick={() => setResetStep(0)}>Cancel</button>
                </div>
              )}

              {resetStep === 2 && (
                <div>
                  <div className="input-wrapper" style={{ marginBottom: '15px' }}>
                    <input type="text" className="input-field" style={{ paddingLeft: '15px', letterSpacing: '2px' }} placeholder="Enter 6-digit OTP" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} />
                  </div>
                  <button type="button" className="btn-sign-in" onClick={verifyOTP}>Verify OTP</button>
                </div>
              )}

              {resetStep === 3 && (
                <div>
                  <div className="input-wrapper" style={{ marginBottom: '15px' }}>
                    <input type="password" className="input-field" style={{ paddingLeft: '15px' }} placeholder="Enter New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <button type="button" className="btn-sign-in" onClick={resetPassword}>Update Password</button>
                </div>
              )}
            </div>
          )}

          {/* MESSAGE BOX */}
          <div id="msgBox" style={{ marginTop: '15px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', color: message.isSuccess ? '#10b981' : '#ef4444' }}>
            {message.text}
          </div>

        </div>
      </div>
    </>
  );
}

export default Login;