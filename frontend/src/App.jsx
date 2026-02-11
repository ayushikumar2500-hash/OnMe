import { useEffect, useState } from 'react';
import './App.css';
import Admin from './pages/Admin.jsx';
import UserView from './pages/UserView.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import GroupCreate from './pages/GroupCreate.jsx';
import GroupDetail from './pages/GroupDetail.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Home from './pages/Home.jsx';

const routes = new Set(['#/login', '#/signup', '#/home', '#/dashboard', '#/admin', '#/group-create', '#/admin-login']);

function Nav({ isAdmin, isAuthed }) {
  // Admin logged in: show only admin logout
  if (isAdmin) {
    const logoutAdmin = () => {
      localStorage.removeItem('isAdmin');
      window.location.hash = '#/login';
    };
    return (
      <nav className="nav">
        <button className="btn danger" onClick={logoutAdmin}>Logout (Admin)</button>
      </nav>
    );
  }

  // Regular user logged in: hide Login/Signup/Admin; show user tabs and logout
  if (isAuthed) {
    const logoutUser = () => {
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('currentUserEmail');
      localStorage.removeItem('currentUserName');
      window.location.hash = '#/login';
    };
    return (
      <nav className="nav">
        <a href="#/home" className="btn">Home</a>
        <a href="#/dashboard" className="btn">My Groups</a>
        <a href="#/group-create" className="btn">Create Group</a>
        <button className="btn" onClick={logoutUser}>Logout</button>
      </nav>
    );
  }

  // Not authenticated: show start tabs
  return (
    <nav className="nav">
      <a href="#/login" className="btn">Login</a>
      <a href="#/signup" className="btn">Sign Up</a>
      <a href="#/admin-login" className="btn">Admin</a>
    </nav>
  );
}

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/login');
  const [groupId, setGroupId] = useState(null);
  const [impersonateUserId, setImpersonateUserId] = useState(null);

  const currentUserId = Number(localStorage.getItem('currentUserId')) || null;
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const isAuthed = !!currentUserId;

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash || '#/login';
      const valid = routes.has(hash) || hash.startsWith('#/group/') || hash.startsWith('#/admin/user/');
      // Do not overwrite the hash here; just set state
      setRoute(valid ? hash : '#/login');
      if (hash.startsWith('#/group/')) {
        const parsed = Number(hash.replace('#/group/', ''));
        setGroupId(Number.isFinite(parsed) ? parsed : null);
      } else {
        setGroupId(null);
      }
      if (hash.startsWith('#/admin/user/')) {
        const uid = Number(hash.replace('#/admin/user/', ''));
        setImpersonateUserId(Number.isFinite(uid) ? uid : null);
      } else {
        setImpersonateUserId(null);
      }
    };
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const userRoutes = new Set(['#/home', '#/dashboard', '#/group-create']);
    if (!isAuthed && userRoutes.has(route)) {
      window.location.hash = '#/login';
    }
  }, [route, isAuthed]);

  return (
    <main>
      <header className="header panel">
        <div className="title">
          <h1>Expense Tracker</h1>
          <span className="badge muted">Home, Login/Signup, Admin</span>
        </div>
        <Nav isAdmin={isAdmin} isAuthed={isAuthed} />
      </header>

      {route === '#/login' && <Login />}
      {route === '#/signup' && <Signup />}
      {route === '#/admin-login' && <AdminLogin />}

      {route === '#/home' && <Home />}
      {route === '#/dashboard' && (
        isAuthed ? <UserView userId={currentUserId} /> : <section className="panel card"><h2>Dashboard</h2><p>Please log in first.</p><a href="#/login" className="btn">Go to Login</a></section>
      )}

      {route === '#/group-create' && (
        isAuthed ? <GroupCreate /> : <section className="panel card"><p>Please log in.</p></section>
      )}

      {route.startsWith('#/group/') && groupId && <GroupDetail groupId={groupId} />}

      {route === '#/admin' && (isAdmin ? <Admin /> : (
        <section className="panel card">
          <h2>Admin</h2>
          <p>Admin only.</p>
          <a href="#/admin-login" className="btn">Go to Admin Login</a>
        </section>
      ))}

      {route.startsWith('#/admin/user/') && impersonateUserId && (isAdmin ? <UserView userId={impersonateUserId} /> : <section className="panel card"><p>Admin only.</p></section>)}

      <footer className="footer">
        <span className="badge muted">v0.9</span>
        <span>Clean homepage + admin login option on Login</span>
      </footer>
    </main>
  );
}
