import React, { useEffect, useState } from 'react';

const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:8080';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [u, g] = await Promise.all([
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/groups`)
      ]);
      setUsers(await u.json());
      setGroups(await g.json());
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Optimistically update state
        setUsers(prev => prev.filter(u => u.id !== id));
        // Refresh groups so membership counts exclude deleted user
        const g = await fetch(`${API_BASE}/groups`);
        setGroups(await g.json());
      } else {
        alert('Failed to delete user');
      }
    } catch (e) {
      alert('Error deleting user');
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <section className="panel card">
      <div className="section-title">
        <h2>All Users</h2>
        <button className="btn" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      <table className="table mt-2">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Groups</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email || '-'}</td>
              <td>{groups.filter(g => g.memberUserIds?.includes(u.id)).map(g => g.name).join(', ')}</td>
              <td style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={`#/admin/user/${u.id}`} className="btn">View as</a>
                <button className="btn danger" onClick={() => removeUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}