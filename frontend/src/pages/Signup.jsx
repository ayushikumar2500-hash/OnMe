import React, { useState } from 'react';

const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:8080';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createUser = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const user = await res.json();
      localStorage.setItem('currentUserId', String(user.id));
      localStorage.setItem('currentUserEmail', user.email || email);
      localStorage.setItem('currentUserName', user.name || name);
      window.location.hash = '#/home';
    } catch (e) {
      console.error('Signup failed', e);
      setError('Signup failed. Check backend is running at ' + API_BASE + ' and your input.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel card">
      <h2>Create your account</h2>
      <div className="form">
        <label className="label">Name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your display name" />
        <label className="label mt-2">Email</label>
        <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        {error && <p className="mt-2" style={{ color: '#ef4444' }}>{error}</p>}
        <div className="actions mt-2">
          <button className="btn primary" onClick={createUser} disabled={!name || !email || loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
          <a href="#/login" className="btn">Back to Login</a>
        </div>
      </div>
    </section>
  );
}