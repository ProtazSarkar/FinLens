import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import Register from './pages/Register';
import DepositModal from './components/DepositModal';
import Toast from './components/Toast';

function AppContent() {
  const { currentView } = useApp();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'transfer' && <Transfer />}
        {currentView === 'transactions' && <Transactions />}
        {currentView === 'users' && <Users />}
        {currentView === 'register' && <Register />}
      </main>

      <footer style={{
        background: '#ffffff',
        borderTop: '1px solid var(--border)',
        padding: '1.25rem',
        fontSize: '0.825rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0 0.5rem',
        }}>
          <div>
            <strong>SmartLedger</strong> • AI Financial Intelligence & Cryptographic Double-Entry Ledger
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <span>Backend API: <strong style={{ color: 'var(--success)' }}>v2.0 Connected</strong></span>
            <span>Theme: <strong>Clean White</strong></span>
          </div>
        </div>
      </footer>

      {/* Global Modals & Notifications */}
      <DepositModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
