import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:8080';

export default function UserView({ userId }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE}/groups`);
      const data = await res.json();
      setGroups(data);
    })();
  }, []);

  const myGroups = useMemo(() => {
    if (!userId) return [];
    return groups.filter(g => Array.isArray(g.memberUserIds) && g.memberUserIds.includes(userId));
  }, [groups, userId]);

  return (
    <section className="panel card">
      <h2>User’s Groups</h2>
      <div className="grid">
        {myGroups.map(g => (
          <div key={g.id} className="card panel">
            <div className="section-title">
              <strong>{g.name}</strong>
              <a href={`#/group/${g.id}`} className="btn primary">Open</a>
            </div>
            <p className="mt-2">Members: {g.memberUserIds?.length ?? 0}</p>
          </div>
        ))}
      </div>
    </section>
  );
}