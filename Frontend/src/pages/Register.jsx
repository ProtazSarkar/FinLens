import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  UsersIcon,
  WalletIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from '../components/Icons';

export default function Register() {
  const { refreshAll, showToast, setCurrentView } = useApp();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    user_type: 'Personal',
    initial_balance: '10000',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const balancePresets = [5000, 10000, 25000, 50000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setError('Username cannot be empty.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        username: formData.username.trim(),
        password: formData.password,
        user_type: formData.user_type,
        initial_balance: parseFloat(formData.initial_balance) || 10000,
      };

      const res = await api.register(payload);
      showToast(res.message || `Account for '${formData.username}' created successfully!`, 'success');
      await refreshAll();
      setCurrentView('users');
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '580px' }}>
      <div className="view-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div className="view-title-group" style={{ textAlign: 'center' }}>
          <h1>Create New Account</h1>
          <p className="view-subtitle">
            Register a personal wallet or business merchant account on the SmartLedger system
          </p>
        </div>
      </div>

      <div className="card card-raised">
        {error && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger-text)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <AlertTriangleIcon size={18} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. David_Miller or Metro_Pharmacy_Ltd"
              required
            />
          </div>

          <div>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-ghost"
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.35rem',
                  borderRadius: '50%',
                  color: 'var(--text-light)',
                }}
              >
                <EyeIcon size={18} />
              </button>
            </div>
          </div>

          <div>
            <label>Account Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, user_type: 'Personal' })}
                style={{
                  border: `1.5px solid ${formData.user_type === 'Personal' ? 'var(--primary)' : 'var(--border)'}`,
                  background: formData.user_type === 'Personal' ? 'var(--primary-subtle)' : '#ffffff',
                  color: formData.user_type === 'Personal' ? 'var(--primary)' : 'var(--text-body)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                <UsersIcon size={20} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Personal</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consumer wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, user_type: 'Business' })}
                style={{
                  border: `1.5px solid ${formData.user_type === 'Business' ? 'var(--ai)' : 'var(--border)'}`,
                  background: formData.user_type === 'Business' ? 'var(--ai-bg)' : '#ffffff',
                  color: formData.user_type === 'Business' ? 'var(--ai)' : 'var(--text-body)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                <WalletIcon size={20} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Business</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Merchant receiver</span>
              </button>
            </div>
          </div>

          <div>
            <label>Initial Opening Balance (INR)</label>
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
                step="100"
                min="0"
                value={formData.initial_balance}
                onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                placeholder="10000"
                required
                style={{ paddingLeft: '28px', fontSize: '1.1rem', fontWeight: 600 }}
              />
            </div>

            <div style={{ marginTop: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRESET OPENING DEPOSITS:</span>
              <div className="chip-group" style={{ marginTop: '0.3rem' }}>
                {balancePresets.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`chip-btn ${formData.initial_balance === String(b) ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, initial_balance: String(b) })}
                  >
                    ₹{b.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            >
              <PlusIcon size={16} />
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
