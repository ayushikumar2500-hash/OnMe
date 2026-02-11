import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:8080';

export default function GroupDetail({ groupId }) {
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [gRes, eRes, bRes, uRes] = await Promise.all([
          fetch(`${API_BASE}/groups/${groupId}`),
          fetch(`${API_BASE}/groups/${groupId}/expenses`),
          fetch(`${API_BASE}/groups/${groupId}/balances`),
          fetch(`${API_BASE}/users`)
        ]);
        const g = await gRes.json();
        setGroup(g);
        setNewName(g.name || '');
        setExpenses(await eRes.json());
        setBalances(await bRes.json());
        setUsers(await uRes.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  const memberNames = useMemo(() => {
    if (!group?.memberUserIds) return [];
    const map = new Map(users.map(u => [u.id, u]));
    return group.memberUserIds.map(id => map.get(id)?.name).filter(Boolean);
  }, [group, users]);

  const saveName = async () => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: groupId, name: newName, memberUserIds: group.memberUserIds })
      });
      if (!res.ok) throw new Error('Failed to update name');
      const updated = await res.json();
      setGroup(updated);
      setEditingName(false);
    } catch (e) {
      setError('Could not update group name');
    }
  };

  const deleteGroup = async () => {
    if (!confirm('Delete this group?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      window.location.hash = '#/dashboard';
    } catch (e) {
      alert('Could not delete group');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="panel card">
      <div className="section-title">
        {!editingName ? (
          <>
            <h2>{group?.name || 'Group'}</h2>
            <button className="btn" onClick={() => setEditingName(true)}>Edit name</button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input className="input" value={newName} onChange={e => setNewName(e.target.value)} />
            <button className="btn primary" onClick={saveName} disabled={!newName}>Save</button>
            <button className="btn" onClick={() => { setEditingName(false); setNewName(group?.name || ''); }}>Cancel</button>
          </div>
        )}
        <a href="#/dashboard" className="btn">Back</a>
        <div className="actions">
          <button className="btn danger" onClick={deleteGroup} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete Group'}
          </button>
        </div>
      </div>

      {error && <p className="mt-2" style={{ color: '#ef4444' }}>{error}</p>}

      {!group && loading && <p>Loading...</p>}
      {group && (
        <div className="mt-2">
          <h3>Members</h3>
          <p className="mt-1">Members: {group.memberUserIds?.length ?? 0}</p>
          <ul className="mt-1">
            {memberNames.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid mt-2">
        <div className="card panel">
          <h3>Expenses</h3>
          <table className="table mt-2">
            <thead>
              <tr>
                <th>Desc</th>
                <th>Amount</th>
                <th>Payer</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(x => (
                <tr key={x.id}>
                  <td>{x.description}</td>
                  <td>{x.amount}</td>
                  <td>{x.payerId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card panel">
          <h3>Balances</h3>
          <table className="table mt-2">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {balances.map(b => (
                <tr key={`${b.fromUserId}-${b.toUserId}`}>
                  <td>{b.fromUserId}</td>
                  <td>{b.toUserId}</td>
                  <td>{b.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}