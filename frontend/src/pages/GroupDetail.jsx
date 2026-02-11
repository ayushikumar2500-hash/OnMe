import React, { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:8080';

export default function GroupDetail({ groupId }) {
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]); // active from backend
  const [balances, setBalances] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [settling, setSettling] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [clearing, setClearing] = useState(false);
  const initialMaxIdRef = useRef(null);
  const [archivedExpenses, setArchivedExpenses] = useState([]); // old from backend

  // Add expense form state
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [gRes, eRes, bRes, uRes] = await Promise.all([
          fetch(`${API_BASE}/groups/${groupId}`),
          fetch(`${API_BASE}/groups/${groupId}/expenses`),
          fetch(`${API_BASE}/groups/${groupId}/balances`).catch(() => null),
          fetch(`${API_BASE}/users`)
        ]);
        const g = await gRes.json();
        setGroup(g);
        setNewName(g.name || '');
        // Expenses: guard against non-JSON or non-array
        let eJson = [];
        try { eJson = await eRes.json(); } catch { eJson = []; }
        // Normalize to an array of expense objects
        const norm = Array.isArray(eJson) ? eJson : [];
        setExpenses(norm);
        // On first load, remember the highest existing id to keep them in Old
        if (initialMaxIdRef.current == null) {
          const maxId = norm.reduce((m, x) => (x.id != null && x.id > m ? x.id : m), 0);
          initialMaxIdRef.current = maxId || 0;
        }
        // Balances optional
        if (bRes) {
          try {
            const bJson = await bRes.json();
            setBalances(Array.isArray(bJson) ? bJson : []);
          } catch {
            setBalances([]);
          }
        }
        setUsers(await uRes.json());
      } catch (e) {
        setError('Failed to load group');
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  const reloadExpenses = async () => {
    try {
      const eRes = await fetch(`${API_BASE}/groups/${groupId}/expenses`);
      const eJson = await eRes.json();
      setExpenses(Array.isArray(eJson) ? eJson : []);
      const aRes = await fetch(`${API_BASE}/groups/${groupId}/expenses/archived`);
      const aJson = await aRes.json();
      setArchivedExpenses(Array.isArray(aJson) ? aJson : []);
    } catch {
      setExpenses([]);
      setArchivedExpenses([]);
      setError('Failed to reload expenses');
    }
  };

  const reloadBalances = async () => {
    try {
      const bRes = await fetch(`${API_BASE}/groups/${groupId}/balances`);
      const bJson = await bRes.json();
      setBalances(Array.isArray(bJson) ? bJson : []);
    } catch {
      setBalances([]);
    }
  };

  useEffect(() => { reloadExpenses(); }, [groupId]);

  const settle = async (fromUserId, toUserId, amount) => {
    if (!confirm('Mark this debt as settled?')) return;
    setSettling(true);
    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId, toUserId, amount })
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to settle');
      await reloadBalances();
      await reloadExpenses();
    } catch (e) {
      alert('Could not settle debt.');
    } finally {
      setSettling(false);
    }
  };

  const clearOld = async () => {
    if (!confirm('Clear all old transactions? This removes settlement and covered expenses.')) return;
    setClearing(true);
    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}/clear-old`, { method: 'POST' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to clear');
      await reloadExpenses();
      await reloadBalances();
    } catch (e) {
      alert('Could not clear old transactions');
    } finally {
      setClearing(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
      await reloadExpenses();
      await reloadBalances();
    } catch (e) {
      alert('Could not delete transaction');
    }
  };

  const memberNames = useMemo(() => {
    if (!group?.memberUserIds) return [];
    const map = new Map(users.map(u => [u.id, u]));
    return group.memberUserIds.map(id => map.get(id)?.name).filter(Boolean);
  }, [group, users]);

  const memberOptions = useMemo(() => {
    if (!group?.memberUserIds) return [];
    const byId = new Map(users.map(u => [u.id, u]));
    return group.memberUserIds
      .map(id => ({ id, name: byId.get(id)?.name || `User ${id}` }))
      .filter(o => o.name);
  }, [group, users]);

  const userNameById = useMemo(() => {
    const map = new Map();
    for (const u of users) map.set(u.id, u.name || `User ${u.id}`);
    return map;
  }, [users]);

  const resolvePayerName = (x) => {
    // Support multiple payload shapes: paidByUserId, payerId, paidBy{id,name}
    const pid = x.paidByUserId ?? x.payerId ?? x.paidBy?.id;
    const pname = x.paidBy?.name || userNameById.get(pid);
    return pname || (pid ?? '');
  };

  const isSettlement = (x) => ((x?.description || '').toLowerCase().includes('settlement'));

  // If all balances are settled (no debts), treat all expenses as old
  const allSettled = useMemo(() => Array.isArray(balances) && balances.length === 0, [balances]);

  // Old = archived + settlements + (if allSettled) all remaining active
  const oldTransactions = useMemo(() => {
    const archived = Array.isArray(archivedExpenses) ? archivedExpenses : [];
    const active = Array.isArray(expenses) ? expenses : [];
    const settlements = active.filter(isSettlement);
    if (allSettled) {
      // move everything to old when balances are empty
      return [...archived, ...active];
    }
    return archived;
  }, [archivedExpenses, expenses, allSettled]);

  // Active = active minus settlements, and empty if allSettled
  const activeTransactions = useMemo(() => {
    if (allSettled) return [];
    const active = Array.isArray(expenses) ? expenses : [];
    return active.filter(x => !isSettlement(x));
  }, [expenses, allSettled]);

  // Helper to render split summary if available
  const renderSplitSummary = (exp) => {
    const splits = exp.splits || exp.splitsMap || exp.splitsObj; // be flexible
    if (!splits || (Array.isArray(splits) && splits.length === 0)) return null;
    const entries = Array.isArray(splits) ? splits : Object.entries(splits);
    return (
      <div className="mt-1 muted">
        {entries.map((entry, idx) => {
          const [uid, amt] = Array.isArray(entry) ? entry : [entry.userId, entry.amountOwed];
          const name = userNameById.get(Number(uid)) || uid;
          return <span key={idx} style={{ marginRight: '0.75rem' }}>{name}: {amt}</span>;
        })}
      </div>
    );
  };

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

  const addExpense = async () => {
    setExpenseError('');
    setSavingExpense(true);
    try {
      // Align with backend CreateExpenseRequest: description, amount, paidByUserId, optional splitType
      const payload = {
        description: desc,
        amount: Number(amount),
        paidByUserId: Number(payerId),
        splitType: 'EQUAL'
      };
      const res = await fetch(`${API_BASE}/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status !== 201) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Failed (${res.status})`);
      }
      await reloadExpenses();
      await reloadBalances();
      setDesc('');
      setAmount('');
      setPayerId('');
    } catch (e) {
      setExpenseError('Could not add expense. Ensure backend is running and inputs are valid.');
    } finally {
      setSavingExpense(false);
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

      {group && (
        <div className="mt-2">
          <h3>Add Expense</h3>
          <div className="form">
            <label className="label">Description</label>
            <input className="input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Dinner" />

            <label className="label mt-2">Amount</label>
            <input className="input" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 42.50" />

            <label className="label mt-2">Who paid?</label>
            <select className="input" value={payerId} onChange={e => setPayerId(e.target.value)}>
              <option value="">Select payer</option>
              {memberOptions.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {expenseError && <p className="mt-2" style={{ color: '#ef4444' }}>{expenseError}</p>}
            <div className="actions mt-2">
              <button className="btn primary" onClick={addExpense} disabled={!desc || !amount || !payerId || savingExpense}>
                {savingExpense ? 'Adding…' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid mt-2">
        {/* Active Transactions (pending) */}
        <div className="card panel">
          <h3>Active Transactions</h3>
          {Array.isArray(activeTransactions) && activeTransactions.length === 0 && (
            <p className="mt-2">No active transactions</p>
          )}
          {Array.isArray(activeTransactions) && activeTransactions.length > 0 && (
            <table className="table mt-2">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Payer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTransactions.map(x => (
                  <tr key={x.id ?? `${x.description}-${x.amount}-${resolvePayerName(x)}`}>
                    <td>{x.description ?? ''}</td>
                    <td>{x.amount ?? 0}</td>
                    <td>{resolvePayerName(x)}</td>
                    <td>
                      {x.id && (
                        <button className="btn danger" onClick={() => deleteExpense(x.id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Old Transactions (collapsible) */}
        <div className="card panel">
          <div className="section-title">
            <h3>Old Transactions</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" onClick={() => setShowOld(v => !v)}>
                {showOld ? 'Hide' : 'Show'}
              </button>
              <button className="btn danger" onClick={clearOld} disabled={clearing}>
                Clear Old
              </button>
            </div>
          </div>
          {showOld && (
            <>
              {Array.isArray(oldTransactions) && oldTransactions.length === 0 && (
                <p className="mt-2">No old transactions</p>
              )}
              {Array.isArray(oldTransactions) && oldTransactions.length > 0 && (
                <table className="table mt-2">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Payer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oldTransactions.map(x => (
                      <tr key={x.id ?? `${x.description}-${x.amount}-${resolvePayerName(x)}`}>
                        <td>{x.description ?? ''}</td>
                        <td>{x.amount ?? 0}</td>
                        <td>{resolvePayerName(x)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        {/* Balances */}
        <div className="card panel">
          <h3>Balances</h3>
          {Array.isArray(balances) && balances.length === 0 && <p className="mt-2">No balances yet</p>}
          {Array.isArray(balances) && balances.length > 0 && (
            <table className="table mt-2">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {balances.map(b => (
                  <tr key={`${b.fromUserId}-${b.toUserId}`}>
                    <td>{userNameById.get(b.fromUserId) || b.fromUserId}</td>
                    <td>{userNameById.get(b.toUserId) || b.toUserId}</td>
                    <td>{b.amount}</td>
                    <td>
                      <button className="btn" onClick={() => settle(b.fromUserId, b.toUserId, b.amount)} disabled={settling}>Settled</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}