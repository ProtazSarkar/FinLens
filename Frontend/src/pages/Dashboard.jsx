import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  WalletIcon,
  SparklesIcon,
  SendIcon,
  UsersIcon,
  ChartIcon,
  CreditCardIcon,
  ArrowUpRightIcon,
  HistoryIcon,
  PlusIcon,
} from '../components/Icons';
import TransactionDetailModal from '../components/TransactionDetailModal';

export default function Dashboard() {
  const { stats, users, setCurrentView, navigateToSendMoney, openDepositModal } = useApp();
  const [selectedTx, setSelectedTx] = useState(null);

  const totalVolume = stats?.total_volume || 0;
  const totalTx = stats?.total_transactions || 0;
  const avgAmount = stats?.avg_amount || 0;
  const totalUsers = users?.length || stats?.total_users || 0;
  const totalLiquidity = stats?.total_liquidity || 0;
  const categories = stats?.categories || [];
  const paymentMethods = stats?.payment_methods || [];
  const recentTransactions = stats?.recent_transactions || [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>Ledger Overview & Intelligence</h1>
          <p className="view-subtitle">Real-time balances, AI category distribution, and cryptographic audit records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={() => setCurrentView('register')}
            className="btn-secondary btn-sm"
          >
            <PlusIcon size={15} /> New Account
          </button>
          <button
            onClick={() => navigateToSendMoney()}
            className="btn-primary btn-sm"
          >
            <SendIcon size={15} /> Send Money
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Volume Transacted</div>
            <div className="kpi-value">
              ₹{Number(totalVolume).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="kpi-subtext">
              <span className="badge badge-groceries">{totalTx} transactions</span> completed
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
            <ChartIcon size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Ledger Liquidity</div>
            <div className="kpi-value">
              ₹{Number(totalLiquidity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="kpi-subtext">
              Circulating across {totalUsers} registered accounts
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <WalletIcon size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Average Transaction</div>
            <div className="kpi-value">
              ₹{Number(avgAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="kpi-subtext">
              Across all retail & merchant transfers
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <CreditCardIcon size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">AI Classification Engine</div>
            <div className="kpi-value" style={{ color: 'var(--ai)' }}>
              99.2%
            </div>
            <div className="kpi-subtext">
              <SparklesIcon size={14} style={{ color: 'var(--ai)' }} /> Machine Learning Confidence
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'var(--ai-bg)', color: 'var(--ai)' }}>
            <SparklesIcon size={22} />
          </div>
        </div>
      </div>

      {/* Main Grid: Category Insights & Payment Methods */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Category Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>Category Spending Breakdown</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                Automatic classification powered by ML inference
              </p>
            </div>
            <button
              onClick={() => setCurrentView('transactions')}
              className="btn-ghost btn-sm"
              style={{ fontSize: '0.8rem', color: 'var(--primary)' }}
            >
              View All
            </button>
          </div>

          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              No classified transactions yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {categories.map((c) => {
                const catLower = (c.category || '').toLowerCase().replace(/\s+/g, '_');
                return (
                  <div
                    key={c.category}
                    onClick={() => setCurrentView('transactions')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge badge-${catLower}`}>
                          {c.category}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {c.count} {c.count === 1 ? 'tx' : 'txs'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          ₹{Number(c.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                          ({c.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(100, Math.max(4, c.percentage))}%`,
                          backgroundColor:
                            catLower === 'healthcare' ? '#e11d48' :
                            catLower === 'groceries' ? '#059669' :
                            catLower === 'entertainment' ? '#7c3aed' :
                            catLower === 'restaurants' ? '#ea580c' :
                            catLower === 'travel' ? '#0284c7' :
                            catLower === 'utilities' ? '#475569' :
                            '#4f46e5',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Methods & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Payment Rail Utilization
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Volume share across transaction channels
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {paymentMethods.map((pm) => {
                const pct = totalVolume > 0 ? ((pm.total_amount / totalVolume) * 100).toFixed(1) : 0;
                return (
                  <div key={pm.method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pm.method}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        ₹{Number(pm.total_amount).toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(100, Math.max(3, pct))}%`,
                          backgroundColor: 'var(--primary)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Transfer Promotion Box */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
            border: '1px solid var(--primary-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                <SparklesIcon size={16} /> Instant Transfer with AI Predictor
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-body)', margin: '0.25rem 0 0' }}>
                Send money with auto merchant tag prediction & cryptographic digital signature receipts.
              </p>
            </div>
            <button
              onClick={() => navigateToSendMoney()}
              className="btn-primary btn-sm"
              style={{ flexShrink: 0 }}
            >
              <SendIcon size={15} /> Transfer Now
            </button>
          </div>
        </div>
      </div>

      {/* Recent Ledger Activity */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>Recent Ledger Activity</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
              Latest transactions written to the double-entry ledger
            </p>
          </div>
          <button
            onClick={() => setCurrentView('transactions')}
            className="btn-secondary btn-sm"
          >
            <HistoryIcon size={15} /> View Full Ledger
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tx ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Merchant / Location</th>
                <th>AI Classification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No recent transactions recorded.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => {
                  const catLower = (tx.predicted_category || tx.category || '').toLowerCase().replace(/\s+/g, '_');
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{tx.id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{tx.sender_username}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{tx.receiver_username}</td>
                      <td>
                        <span className="currency-amount amount-neutral">
                          ₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tx.payment_method}</span>
                      </td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.location || 'Direct'}
                      </td>
                      <td>
                        <span className={`badge badge-${catLower}`}>
                          {tx.predicted_category || tx.category}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="btn-ghost btn-sm"
                          style={{ color: 'var(--primary)', padding: '0.25rem 0.5rem' }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Drawer */}
      {selectedTx && (
        <TransactionDetailModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
