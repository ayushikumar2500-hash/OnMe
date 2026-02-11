import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:8080';

export default function GroupCreate() {
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const currentUserId = Number(localStorage.getItem('currentUserId')) || null;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load all users once to enable instant client-side filtering
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users`);
        const data = await res.json();
        setAllUsers(data);
      } catch {}
    })();
  }, []);

  // Debounced backend search for better matching when typing
  useEffect(() => {
    const controller = new AbortController();
    const fetchSearch = async () => {
      if (!q) { setResults([]); return; }
      setLoadingSearch(true);
      try {
        const res = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = await res.json();
        setResults(data);
      } catch {
        // fallback: client-side filter
        const filtered = allUsers.filter(u => (u.name || '').toLowerCase().includes(q.toLowerCase()) || (u.email || '').toLowerCase().includes(q.toLowerCase()));
        setResults(filtered);
      } finally {
        setLoadingSearch(false);
      }
    };
    const id = setTimeout(fetchSearch, 200);
    return () => { controller.abort(); clearTimeout(id); };
  }, [q, allUsers]);

  const addMember = (u) => {
    if (!members.find(m => m.id === u.id)) setMembers([...members, u]);
  };
  const removeMember = (id) => setMembers(members.filter(m => m.id !== id));

  const create = async () => {
    setError('');
    setSaving(true);
    try {
      // Ensure current user is included in members
      const memberIds = members.map(m => m.id);
      if (currentUserId && !memberIds.includes(currentUserId)) memberIds.push(currentUserId);

      const payload = { name, memberUserIds: memberIds };
      const res = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }
      // On success go to dashboard
      window.location.hash = '#/dashboard';
    } catch (e) {
      console.error('Create group failed', e);
      setError('Failed to create group. Check backend is running at ' + API_BASE + ' and members include yourself.');
    } finally {
      setSaving(false);
    }
  };

  const suggestions = useMemo(() => {
    if (!q) return [];
    // Merge backend results with client-side filter and remove already-selected members
    const base = results.length ? results : allUsers.filter(u => (u.name || '').toLowerCase().includes(q.toLowerCase()) || (u.email || '').toLowerCase().includes(q.toLowerCase()));
    return base.filter(u => !members.some(m => m.id === u.id));
  }, [q, results, allUsers, members]);

  return (
    <section className="panel card">
      <h2>Create Group</h2>
      <div className="form">
        <label className="label">Group name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. NYC Trip" />

        <label className="label mt-2">Add members</label>
        <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search users by name or email" />
        {loadingSearch && <p className="mt-1 badge muted">Searching…</p>}

        {/* Live suggestions that shrink as you type */}
        {q && (
          <div className="card panel mt-2">
            <h3>Suggestions</h3>
            {suggestions.length === 0 && <p className="mt-2">No matches</p>}
            {suggestions.slice(0, 8).map(u => (
              <div key={u.id} className="section-title mt-2">
                <span>{u.name} <span className="badge muted" style={{ marginLeft: '0.5rem' }}>{u.email || ''}</span></span>
                <button className="btn" onClick={() => addMember(u)}>Add</button>
              </div>
            ))}
          </div>
        )}

        <div className="grid mt-2">
          <div className="card panel">
            <h3>Members</h3>
            {members.length === 0 && <p className="mt-2">No members added yet</p>}
            {members.map(u => (
              <div key={u.id} className="section-title mt-2">
                <span>{u.name} <span className="badge muted" style={{ marginLeft: '0.5rem' }}>{u.email || ''}</span></span>
                <button className="btn danger" onClick={() => removeMember(u.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="mt-2" style={{ color: '#ef4444' }}>{error}</p>}
        <div className="actions mt-3">
          <button className="btn primary" onClick={create} disabled={!name || members.length === 0 || saving}>
            {saving ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </section>
  );
}