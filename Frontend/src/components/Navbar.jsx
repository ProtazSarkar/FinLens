import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  SparklesIcon,
  ChartIcon,
  SendIcon,
  HistoryIcon,
  UsersIcon,
  PlusIcon,
  RefreshIcon,
  WalletIcon,
} from './Icons';

export default function Navbar() {
  const {
    currentView,
    setCurrentView,
    users,
    activeUser,
    setActiveUser,
    refreshAll,
    navigateToSendMoney,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setTimeout(() => setRefreshing(false), 500);
  };

  const navItems = [
    { id: 'dashboard', label: 'Analytics', icon: ChartIcon },
    { id: 'transfer', label: 'Send Money', icon: SendIcon },
    { id: 'transactions', label: 'Ledger History', icon: HistoryIcon },
    { id: 'users', label: 'Accounts', icon: UsersIcon },
    { id: 'register', label: 'New Account', icon: PlusIcon },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: '#ffffff',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        {/* Brand */}
        <div
          onClick={() => setCurrentView('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
          }}>
            <SparklesIcon size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                SmartLedger
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'var(--primary-subtle)',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                border: '1px solid var(--primary-border)',
              }}>
                AI
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              Intelligent Financial Ledger
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'var(--bg-subtle)',
          padding: '0.3rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                style={{
                  border: 'none',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-body)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <IconComponent size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right tools: Active User selector & Quick actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Active User Switcher */}
          {users.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.35rem 0.65rem',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--primary-subtle)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                {activeUser?.username ? activeUser.username[0].toUpperCase() : 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Acting As
                </span>
                <select
                  value={activeUser?.id || ''}
                  onChange={(e) => {
                    const sel = users.find((u) => u.id === Number(e.target.value));
                    if (sel) setActiveUser(sel);
                  }}
                  style={{
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    background: 'transparent',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    width: 'auto',
                  }}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} (₹{Number(u.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="btn-ghost"
            title="Refresh Ledger State"
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <RefreshIcon size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>

          {/* Quick Send Button */}
          <button
            onClick={() => navigateToSendMoney()}
            className="btn-primary btn-sm"
            style={{ padding: '0.5rem 0.9rem' }}
          >
            <SendIcon size={15} />
            <span>Send Money</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
