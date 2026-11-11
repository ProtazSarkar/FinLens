import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  SendIcon,
  SparklesIcon,
  WalletIcon,
  CreditCardIcon,
  AlertTriangleIcon,
  ArrowUpRightIcon,
} from '../components/Icons';
import ReceiptModal from '../components/ReceiptModal';

export default function Transfer() {
  const {
    users,
    activeUser,
    prefilledSender,
    setPrefilledSender,
    refreshAll,
    showToast,
  } = useApp();

  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [location, setLocation] = useState('Apollo Hospital Branch, Kolkata');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  // Live AI Prediction state
  const [livePrediction, setLivePrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const debounceRef = useRef(null);

  // Set initial sender from prefilled or active user
  useEffect(() => {
    if (prefilledSender) {
      setSenderId(String(prefilledSender.id));
      setPrefilledSender(null);
    } else if (activeUser && !senderId) {
      setSenderId(String(activeUser.id));
    } else if (users.length > 0 && !senderId) {
      setSenderId(String(users[0].id));
    }
  }, [prefilledSender, activeUser, users, senderId, setPrefilledSender]);

  // Set default receiver different from sender
  useEffect(() => {
    if (senderId && (!receiverId || receiverId === senderId)) {
      const otherUser = users.find((u) => String(u.id) !== String(senderId));
      if (otherUser) {
        setReceiverId(String(otherUser.id));
      }
    }
  }, [senderId, receiverId, users]);

  // Fetch live AI prediction preview whenever location, amount, or payment method changes
  useEffect(() => {
    if (!location) {
      setLivePrediction(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setPredicting(true);
      try {
        const senderObj = users.find((u) => String(u.id) === String(senderId));
        const receiverObj = users.find((u) => String(u.id) === String(receiverId));
        const res = await api.predictCategory({
          amount: parseFloat(amount) || 100,
          payment_method: paymentMethod,
          location: location,
          sender: senderObj?.username || '',
          receiver: receiverObj?.username || '',
        });
        if (res.prediction) {
          setLivePrediction(res.prediction);
        }
      } catch (e) {
        console.error('Prediction preview error:', e);
      } finally {
        setPredicting(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [location, amount, paymentMethod, senderId, receiverId, users]);

  const currentSender = users.find((u) => String(u.id) === String(senderId));
  const currentReceiver = users.find((u) => String(u.id) === String(receiverId));
  const senderBalance = currentSender ? Number(currentSender.balance || 0) : 0;
  const numAmount = parseFloat(amount) || 0;
  const hasInsufficientFunds = numAmount > senderBalance;

  const quickAmounts = [100, 500, 1000, 2500, 5000];

  const merchantPresets = [
    { label: '🏥 Apollo Hospital', location: 'Apollo Hospital Emergency, Kolkata', receiverMatch: 'apollo' },
    { label: '🛒 City Supermart', location: 'City Supermart Retail, Kolkata', receiverMatch: 'supermart' },
    { label: '☕ Starbucks Cafe', location: 'Starbucks Coffee Cafe, Park Street', receiverMatch: 'starbucks' },
    { label: '🎬 PVR Cinemas', location: 'PVR Cinemas Forum Mall IMAX', receiverMatch: 'pvr' },
    { label: '⚡ State Power Corp', location: 'State Power Corporation Electricity Bill', receiverMatch: 'power' },
    { label: '✈️ Indigo Airlines', location: 'Indigo Airlines Flight Terminal 2', receiverMatch: 'travel' },
    { label: '📦 Amazon India', location: 'Amazon India Online Shopping Order', receiverMatch: 'techzone' },
  ];

  const handleApplyPreset = (preset) => {
    setLocation(preset.location);
    if (preset.receiverMatch) {
      const match = users.find((u) =>
        u.username.toLowerCase().includes(preset.receiverMatch.toLowerCase()) &&
        String(u.id) !== String(senderId)
      );
      if (match) {
        setReceiverId(String(match.id));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!senderId || !receiverId) {
      setError('Please select both sender and receiver accounts.');
      return;
    }
    if (senderId === receiverId) {
      setError('Sender and receiver cannot be the same account.');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter a valid transfer amount greater than ₹0.');
      return;
    }
    if (hasInsufficientFunds) {
      setError(`Insufficient balance. Sender only has ₹${senderBalance.toLocaleString()}.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        sender_id: parseInt(senderId),
        receiver_id: parseInt(receiverId),
        amount: numAmount,
        payment_method: paymentMethod,
        location: location.trim(),
      };

      const res = await api.transfer(payload);
      setReceipt({
        ...res,
        sender_username: currentSender?.username,
        receiver_username: currentReceiver?.username,
      });

      showToast(`Transfer of ₹${numAmount.toLocaleString()} completed successfully!`, 'success');
      await refreshAll();
      setAmount('');
    } catch (err) {
      setError(err.data?.error || err.message || 'Transaction failed to process.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewTransfer = () => {
    setReceipt(null);
    setAmount('');
  };

  return (
    <div className="page-container" style={{ maxWidth: '820px' }}>
      <div className="view-header">
        <div className="view-title-group">
          <h1>Send Money</h1>
          <p className="view-subtitle">
            Instant peer-to-peer and merchant ledger transfers with AI automated categorization
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.85rem 1.15rem',
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger-text)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <AlertTriangleIcon size={18} />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Parties Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
            Account Selection
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {/* Sender */}
            <div>
              <label>From Account (Sender)</label>
              <select
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                required
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} • ({u.user_type || 'Personal'}) — ₹{Number(u.balance || 0).toLocaleString()}
                  </option>
                ))}
              </select>

              {currentSender && (
                <div style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-subtle)',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Available Balance:</span>
                  <strong style={{ color: hasInsufficientFunds ? 'var(--danger)' : 'var(--success)' }}>
                    ₹{senderBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              )}
            </div>

            {/* Receiver */}
            <div>
              <label>To Account (Recipient / Merchant)</label>
              <select
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                required
              >
                {users
                  .filter((u) => String(u.id) !== String(senderId))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} • ({u.user_type || 'Personal'}) — ID #{u.id}
                    </option>
                  ))}
              </select>

              {currentReceiver && (
                <div style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-subtle)',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recipient Type:</span>
                  <span className={`badge badge-${(currentReceiver.user_type || 'Personal').toLowerCase()}`}>
                    {currentReceiver.user_type || 'Personal'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Amount & Payment Method Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
            Transfer Amount & Payment Channel
          </h3>

          <div>
            <label>Amount (INR)</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: 'var(--text-muted)',
              }}>₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                style={{
                  paddingLeft: '32px',
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  borderColor: hasInsufficientFunds ? 'var(--danger)' : undefined,
                }}
              />
            </div>

            {hasInsufficientFunds && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertTriangleIcon size={14} /> Amount exceeds sender's available balance (₹{senderBalance.toLocaleString()})
              </div>
            )}

            {/* Quick Amount Buttons */}
            <div style={{ marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>QUICK AMOUNTS:</span>
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
                {senderBalance > 0 && (
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => setAmount(String(senderBalance))}
                  >
                    All (₹{senderBalance.toLocaleString()})
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label>Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
              {['UPI', 'Credit_Card', 'Debit_Card', 'NetBanking'].map((method) => {
                const isSel = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    style={{
                      border: `1.5px solid ${isSel ? 'var(--primary)' : 'var(--border)'}`,
                      background: isSel ? 'var(--primary-subtle)' : '#ffffff',
                      color: isSel ? 'var(--primary)' : 'var(--text-body)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.5rem',
                      fontWeight: isSel ? 700 : 500,
                      fontSize: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                    }}
                  >
                    <CreditCardIcon size={18} />
                    <span>{method.replace('_', ' ')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Location & Live AI Prediction Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>
                Merchant Descriptor & AI Categorization
              </h3>
              {predicting && (
                <span style={{ fontSize: '0.75rem', color: 'var(--ai)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <SparklesIcon size={14} className="animate-spin" /> Classifying...
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.75rem' }}>
              Type a location, hospital, supermart, or cafe descriptor to see the machine learning engine categorize it in real time.
            </p>

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Apollo Hospital Emergency Kolkata / Starbucks Cafe Park Street"
              required
            />

            {/* Merchant Presets Chips */}
            <div style={{ marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>POPULAR MERCHANT PRESETS:</span>
              <div className="chip-group">
                {merchantPresets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="chip-btn"
                    onClick={() => handleApplyPreset(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live AI Classification Banner */}
          {livePrediction && (
            <div style={{
              background: 'var(--ai-bg)',
              border: '1px solid var(--ai-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ai)', fontWeight: 700, fontSize: '0.85rem' }}>
                  <SparklesIcon size={16} /> Live AI Category Prediction
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-body)', marginTop: '0.2rem' }}>
                  Model inference confidence: <strong>{((livePrediction.confidence || 0.95) * 100).toFixed(1)}%</strong>
                </div>
              </div>
              <span className={`badge badge-${(livePrediction.category || 'General').toLowerCase().replace(/\s+/g, '_')}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}>
                {livePrediction.category}
              </span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || hasInsufficientFunds}
            style={{
              width: '100%',
              padding: '0.95rem 1.5rem',
              fontSize: '1.05rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <SendIcon size={18} />
            {loading ? 'Executing Ledger Transfer...' : `Confirm Transfer of ₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          </button>
        </div>
      </form>

      {/* Success Receipt Modal */}
      {receipt && (
        <ReceiptModal
          receipt={receipt}
          onClose={() => setReceipt(null)}
          onNewTransfer={handleNewTransfer}
        />
      )}
    </div>
  );
}

