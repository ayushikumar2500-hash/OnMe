import React from 'react';

export default function UsersPage() {
  const goBackToUsers = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hash?.includes('users/')) {
        window.location.hash = '#/users';
        return;
      }
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '#/users';
      }
    }
  };

  const goBackToAdmin = () => {
    if (typeof window === 'undefined') return;
    window.location.hash = '#/admin';
  };

  const backToAllUsers = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '#/admin';
    }
  };

  return (
    <section className="panel card">
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Users</h2>
        <div>
          <button className="btn" onClick={goBackToUsers}>Back to all users</button>
          <button className="btn" onClick={goBackToAdmin}>Back to Admin</button>
          <button className="btn" onClick={backToAllUsers}>Back to all users</button>
        </div>
      </div>
      {/* ...existing users list/details UI... */}
    </section>
  );
}