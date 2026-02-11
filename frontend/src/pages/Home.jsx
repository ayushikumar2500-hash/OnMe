import React from 'react';

export default function Home() {
  const name = localStorage.getItem('currentUserName') || 'User';

  const logout = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUserName');
    localStorage.removeItem('isAdmin');
    window.location.hash = '#/login';
  };

  return (
    <section className="panel card">
      <h1 style={{ fontSize: '2.2rem' }}>{name}</h1>
      <p className="mt-2">Welcome back. Use the navigation to manage your groups.</p>
      <div className="actions mt-3">
        <a href="#/group-create" className="btn">Create Group</a>
        <a href="#/dashboard" className="btn">View My Groups</a>
        <button className="btn danger" onClick={logout}>Logout</button>
      </div>
    </section>
  );
}