import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  UsersIcon,
  WalletIcon,
  SearchIcon,
  PlusIcon,
  SendIcon,
  RefreshIcon,
} from '../components/Icons';

export default function Users() {
  const {
    users,
    loading,
    refreshAll,
    openDepositModal,
    navigateToSendMoney,
    setCurrentView,
  } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (typeFilter !== 'ALL') {
      list = list.filter((u) => (u.user_type || 'Personal').toLowerCase() === typeFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((u) =>
        u.username.toLowerCase().includes(q) || String(u.id).includes(q)
      );
    }
    return list;
  }, [users, typeFilter, search]);

  const totalLiquidity = useMemo(() => {
    return users.reduce((acc, u) => acc + (Number(u.balance) || 0), 0);
  }, [users]);

  const personalCount = users.filter((u) => (u.user_type || 'Personal').toLowerCase() === 'personal').length;
  const businessCount = users.filter((u) => (u.user_type || '').toLowerCase() === 'business').length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>Registered Accounts</h1>
          <p className="view-subtitle">
            Manage user balances, deposit liquidity, and initiate transfers
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={refreshAll} className="btn-secondary btn-sm">
            <RefreshIcon size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setCurrentView('register')} className="btn-primary btn-sm">
            <PlusIcon size={15} /> Create Account
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Accounts</div>
            <div className="kpi-value">{users.length}</div>
            <div className="kpi-subtext">Active ledger identities</div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
            <UsersIcon size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Deposits</div>
            <div className="kpi-value">
              ₹{totalLiquidity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="kpi-subtext">Combined system liquidity</div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <WalletIcon size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Personal Accounts</div>
            <div className="kpi-value">{personalCount}</div>
            <div className="kpi-subtext">Consumer & retail wallets</div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <UsersIcon size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Business Merchants</div>
            <div className="kpi-value">{businessCount}</div>
            <div className="kpi-subtext">Hospitals, retailers & utilities</div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <WalletIcon size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>
            <SearchIcon size={18} />
          </span>
          <input
            type="text"
            placeholder="Search account by username or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['ALL', 'Personal', 'Business'].map((t) => (
            <button
              key={t}
              type="button"
              className={`chip-btn ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'ALL' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshIcon size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
          Loading accounts...
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th>Available Balance</th>
                <th>Account ID</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No accounts match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const initial = user.username ? user.username[0].toUpperCase() : 'U';
                  const isBusiness = (user.user_type || '').toLowerCase() === 'business';

                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: isBusiness ? 'var(--ai-bg)' : 'var(--primary-subtle)',
                            color: isBusiness ? 'var(--ai)' : 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                          }}>
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{user.username}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                              #{user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${(user.user_type || 'Personal').toLowerCase()}`}>
                          {user.user_type || 'Personal'}
                        </span>
                      </td>
                      <td>
                        <span className="currency-amount amount-positive" style={{ fontSize: '1rem' }}>
                          ₹{Number(user.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        ID: {user.id}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => openDepositModal(user)}
                            className="btn-subtle btn-sm"
                            title="Add funds to this account"
                          >
                            <WalletIcon size={14} /> Deposit
                          </button>
                          <button
                            onClick={() => navigateToSendMoney(user)}
                            className="btn-primary btn-sm"
                            title="Send money from this account"
                          >
                            <SendIcon size={14} /> Transfer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
