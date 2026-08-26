import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar({ currentView, setView }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="nav-brand">SmartLedger</div>
      <div className="nav-links">
        {user ? (
          <>
            <button className={currentView === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
            <button className={currentView === 'profile' ? 'active' : ''} onClick={() => setView('profile')}>Profile</button>
            {user.role === 'developer' && (
              <button className={currentView === 'developer' ? 'active' : ''} onClick={() => setView('developer')}>Dev Console</button>
            )}
            <button className="logout" onClick={logout}>Logout ({user.username})</button>
          </>
        ) : (
          <>
            <button className={currentView === 'login' ? 'active' : ''} onClick={() => setView('login')}>Login</button>
            <button className={currentView === 'register' ? 'active' : ''} onClick={() => setView('register')}>Register</button>
          </>
        )}
      </div>
    </nav>
  );
}