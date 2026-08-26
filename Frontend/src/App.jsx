import { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import DeveloperDash from './pages/DeveloperDash';

function MainContent() {
  const { user, loading } = useContext(AuthContext);
  const [view, setView] = useState('login');

  if (loading) return <div className="container">Loading...</div>;

  const currentView = user ? (view === 'login' || view === 'register' ? 'dashboard' : view) : (view === 'dashboard' || view === 'developer' || view === 'profile' ? 'login' : view);

  return (
    <>
      <Navbar currentView={currentView} setView={setView} />
      {currentView === 'login' && <Login setView={setView} />}
      {currentView === 'register' && <Register setView={setView} />}
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'profile' && <Profile />}
      {currentView === 'developer' && <DeveloperDash />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}