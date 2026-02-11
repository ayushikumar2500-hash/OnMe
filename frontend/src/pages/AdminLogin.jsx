import React, { useState } from 'react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const login = () => {
    setError('');
    if (password === 'admin123') {
      localStorage.setItem('isAdmin', 'true');
      window.location.hash = '#/admin';
    } else {
      setError('Invalid admin password');
    }
  };

  return (
    <section className="panel card">
      <h2>Admin Login</h2>
      <div className="form">
        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" />
        {error && <p className="mt-2" style={{ color: '#ef4444' }}>{error}</p>}
        <div className="actions mt-2">
          <button className="btn primary" onClick={login} disabled={!password}>Login</button>
          <a href="#/login" className="btn">Back</a>
        </div>
      </div>
    </section>
  );
}