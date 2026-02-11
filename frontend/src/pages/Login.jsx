import React, { useEffect, useState } from 'react';

const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:8080';

export default function Login() {
  const [email, setEmail] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users`);
        const data = await res.json();
        setUsers(data);
      } catch (e) {
        setError('Failed to load users. Is backend running?');
      }
    })();
  }, []);

  const login = () => {
    setError('');
    const match = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
    if (!match) {
      setError('No account found for this email. Please sign up.');
      return;
    }
    localStorage.setItem('currentUserId', String(match.id));
    localStorage.setItem('currentUserEmail', match.email || '');
    localStorage.setItem('currentUserName', match.name || '');
    window.location.hash = '#/home';
  };

  return (
    <section className="panel card">
      <h2>Login</h2>
      <div className="form">
        <label className="label">Email</label>
        <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        {error && <p className="mt-2" style={{ color: '#ef4444' }}>{error}</p>}
        <div className="actions mt-2">
          <button className="btn primary" onClick={login} disabled={loading || !email}>Login</button>
          <a href="#/signup" className="btn">Sign Up</a>
        </div>
      </div>
    </section>
  );
}