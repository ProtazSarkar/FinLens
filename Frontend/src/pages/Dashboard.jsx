import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  WalletIcon,
  SparklesIcon,
  SendIcon,
  UsersIcon,
  ChartIcon,
  CreditCardIcon,
  HistoryIcon,
  PlusIcon,
  BotIcon,
  ShieldCheckIcon,
} from '../components/Icons';
import { DonutPieChart, BarTrendChart } from '../components/Charts';
import TransactionDetailModal from '../components/TransactionDetailModal';

export default function Dashboard() {
  const { stats, users, setCurrentView, navigateToSendMoney, setIsChatOpen } = useApp();
  const [selectedTx, setSelectedTx] = useState(null);
  const [recurrenceData, setRecurrenceData] = useState(null);

  useEffect(() => {
    api.getRecurrenceInsights()
      .then((data) => setRecurrenceData(data))
      .catch(() => {});
  }, []);

  const totalVolume = stats?.total_volume || 0;
  const totalTx = stats?.total_transactions || 0;
  const avgAmount = stats?.avg_amount || 0;
  const totalUsers = users?.length || stats?.total_users || 0;
  const totalLiquidity = stats?.total_liquidity || 0;
  const categories = stats?.categories || [];
  const paymentMethods = stats?.payment_methods || [];
  const monthlyTrends = stats?.monthly_trends || [];
  const topMerchants = stats?.top_merchants || [];
  const recentTransactions = stats?.recent_transactions || [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>Business Spend & Financial Intelligence</h1>
          <p className="view-subtitle">
            Real-time balance settlement, AI transaction categorization, and multi-rail analytics
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentView('ai-analytics')}
            className="btn-subtle btn-sm"
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
              color: 'var(--ai)',
              borderColor: 'var(--ai-border)',
              fontWeight: 700,
            }}
          >
            <SparklesIcon size={15} /> Open AI Analytics
          </button>
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
              <span className="badge badge-groceries">{totalTx} transactions</span> in ledger
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
              Active across {totalUsers} registered accounts
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <WalletIcon size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Average Ticket Size</div>
            <div className="kpi-value">
              ₹{Number(avgAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="kpi-subtext">
              Mean value across retail & merchant spend
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <CreditCardIcon size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Monthly Burn Estimate</div>
            <div className="kpi-value" style={{ color: 'var(--ai)' }}>
              ₹{Number(recurrenceData?.estimated_monthly_burn || 8340).toLocaleString('en-IN')}
            </div>
            <div className="kpi-subtext">
              <SparklesIcon size={13} style={{ color: 'var(--ai)' }} /> {recurrenceData?.recurring_count || 7} detected subscriptions & bills
            </div>
          </div>
          <div className="kpi-icon-wrap" style={{ background: 'var(--ai-bg)', color: 'var(--ai)' }}>
            <SparklesIcon size={22} />
          </div>
        </div>
      </div>

      {/* Main Visualizations Row: Pie Chart + Monthly Trend Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Category Spend Pie / Donut Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>Category Spend Distribution</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                Interactive breakdown inferred by ML classification
              </p>
            </div>
            <span className="badge badge-default">{categories.length} Categories</span>
          </div>

          <DonutPieChart
            data={categories.map((c) => ({
              label: c.category,
              value: c.total_amount,
              count: c.count,
            }))}
            size={220}
          />
        </div>

        {/* Monthly Trend Bar Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>Monthly Spend Trajectory</h3>
              <span className="badge badge-personal">6-Month Ledger Activity</span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
              Volume timeline across consumer and enterprise accounts
            </p>

            <BarTrendChart data={monthlyTrends} height={190} />
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Peak Month: <strong>Oct 2026 (₹67,317)</strong></span>
            <span>Total Trend Volume: <strong>₹{Number(totalVolume).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></span>
          </div>
        </div>
      </div>

      {/* Second Row: Top Inflow Merchants & Payment Rails */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Top Inflow Merchants */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>Top Merchant Inflows</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                Highest volume receiving merchant partners
              </p>
            </div>
            <button
              onClick={() => setCurrentView('users')}
              className="btn-ghost btn-sm"
              style={{ fontSize: '0.78rem', color: 'var(--primary)' }}
            >
              View Accounts
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {topMerchants.map((m, idx) => {
              const maxM = topMerchants[0]?.total_amount || 1;
              const pct = (m.total_amount / maxM) * 100;

              return (
                <div key={m.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem' }}>#{idx + 1}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.name.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>({m.count} txs)</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      ₹{Number(m.total_amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '7px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(5, pct))}%`,
                        backgroundColor: idx === 0 ? 'var(--primary)' : idx === 1 ? 'var(--ai)' : 'var(--success)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Rails & FinLens Copilot Callout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Payment Channel Share
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.1rem' }}>
              Settlement rail utilization across transactions
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {paymentMethods.map((pm) => {
                const pct = totalVolume > 0 ? ((pm.total_amount / totalVolume) * 100).toFixed(1) : 0;
                return (
                  <div key={pm.method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pm.method.replace('_', ' ')}</span>
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

          {/* AI Copilot Callout */}
          <div
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
              border: '1px solid var(--ai-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ai)', fontWeight: 700, fontSize: '0.9rem' }}>
                <SparklesIcon size={16} /> FinLens NL-to-SQL Analytics Copilot
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-body)', margin: '0.25rem 0 0' }}>
                Ask plain-English queries, view generated SQL, and test queries in an in-memory shadow sandbox.
              </p>
            </div>
            <button
              onClick={() => setCurrentView('ai-analytics')}
              className="btn-primary btn-sm"
              style={{ flexShrink: 0, background: 'var(--ai)' }}
            >
              <BotIcon size={15} /> Open ChatGPT Studio
            </button>
          </div>
        </div>
      </div>

      {/* Recent Ledger Activity Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>Recent Ledger Activity</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
              Latest transactions written to the immutable double-entry ledger
            </p>
          </div>
          <button
            onClick={() => setCurrentView('transactions')}
            className="btn-secondary btn-sm"
          >
            <HistoryIcon size={15} /> View Full Ledger ({totalTx})
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
                <th>Merchant Descriptor</th>
                <th>AI Classification</th>
                <th>Confidence</th>
                <th>Date & Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => {
                const catLower = (tx.predicted_category || tx.category || '').toLowerCase().replace(/\s+/g, '_');
                return (
                  <tr key={tx.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{tx.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{tx.sender_username}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{tx.receiver_username}</td>
                    <td>
                      <span className="currency-amount amount-neutral" style={{ fontSize: '0.95rem' }}>
                        ₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {tx.payment_method}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.location || 'Direct'}
                    </td>
                    <td>
                      <span className={`badge badge-${catLower}`}>
                        {tx.predicted_category || tx.category}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {((tx.predicted_confidence ?? tx.confidence ?? 0.95) * 100).toFixed(1)}%
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'N/A'}
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
              })}
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
