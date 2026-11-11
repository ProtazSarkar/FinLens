import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { XIcon, PlusIcon, WalletIcon } from './Icons';

export default function DepositModal() {
  const { depositModalUser, closeDepositModal, showToast, refreshAll } = useApp();
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!depositModalUser) return null;

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid deposit amount greater than zero.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.deposit(depositModalUser.id, numAmount);
      showToast(res.message || `Successfully deposited ₹${numAmount.toLocaleString()} to ${depositModalUser.username}!`, 'success');
      refreshAll();
      closeDepositModal();
    } catch (err) {
      setError(err.data?.error || err.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeDepositModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <WalletIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>Deposit Funds</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                Top up balance for <strong>{depositModalUser.username}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={closeDepositModal}
            className="btn-ghost"
            style={{ padding: '0.35rem', borderRadius: '50%' }}
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger-text)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Current Balance</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  ₹{Number(depositModalUser.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <span className={`badge badge-${(depositModalUser.user_type || 'Personal').toLowerCase()}`}>
                {depositModalUser.user_type || 'Personal'} Account
              </span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label>Deposit Amount (INR)</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                }}>₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                  style={{ paddingLeft: '28px', fontSize: '1.1rem', fontWeight: 600 }}
                />
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)' }}>Quick Presets</span>
              <div className="chip-group">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={`chip-btn ${amount === String(q) ? 'active' : ''}`}
                    onClick={() => setAmount(String(q))}
                  >
                    +₹{q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={closeDepositModal} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ backgroundColor: 'var(--success)' }}>
              <PlusIcon size={16} />
              {loading ? 'Processing...' : `Deposit ₹${Number(amount || 0).toLocaleString()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

