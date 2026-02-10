import React from 'react';

export default function GroupsPage({ groups = [] }) {
  return (
    <section className="panel card">
      <h2>Groups</h2>
      <div className="grid">
        {groups.map(g => (
          <div key={g.id} className="card panel">
            <div className="section-title">
              <strong>{g.name}</strong>
              <a href={`#/group/${g.id}`} className="btn primary">Open</a>
            </div>
            <p className="mt-2">Members: {g.members?.length ?? 0}</p>
          </div>
        ))}
      </div>
    </section>
  );
}