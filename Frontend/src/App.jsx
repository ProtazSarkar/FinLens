import { useState } from 'react';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Users from './pages/Users';

export default function App() {
  const [view, setView] = useState('users');

  return (
    <>
      <Navbar currentView={view} setView={setView} />
      {view === 'register' && <Register setView={setView} />}
      {view === 'dashboard' && <Dashboard />}
      {view === 'transactions' && <Transactions />}
      {view === 'users' && <Users />}
    </>
  );
}