import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';

export default function DashboardLayout() {
  const loc = useLocation();

  // simple auth guard: if no api_token in localStorage, send user to login
  try {
    const tk = localStorage.getItem('api_token');
    if (!tk) return <Navigate to="/login" replace />
  } catch (e) {
    // ignore storage errors and allow to proceed
  }

  const NavLink = ({ to, children }) => (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '12px 14px',
        color: loc.pathname === to ? '#fff' : '#cfe8ff',
        background: loc.pathname === to ? '#1976d2' : 'transparent',
        borderRadius: 6,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        {children}
      </div>
    </Link>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fb' }}>
      <aside style={{ width: 260, background: 'linear-gradient(180deg,#03203b 0%, #0b3350 100%)', color: '#fff', padding: 20, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div role="button" tabIndex={0} onKeyPress={()=>{}} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#1e88e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>EP</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>EduProfile</div>
              <div style={{ fontSize: 12, color: '#bcd7ff', marginTop: 2 }}>System</div>
            </div>
          </div>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/faculty">Faculty</NavLink>
          <NavLink to="/students">Students</NavLink>
          <NavLink to="/department">Department</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/settings">Settings</NavLink>
          <NavLink to="/profile">My Profile</NavLink>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* header removed globally per request */}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* content area rendered by routes */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
