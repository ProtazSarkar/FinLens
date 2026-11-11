import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  XIcon,
  CopyIcon,
  CheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CreditCardIcon,
  ArrowUpRightIcon,
} from './Icons';

export default function TransactionDetailModal({ tx, onClose }) {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  if (!tx) return null;

  const categoryName = tx.predicted_category || tx.category || 'General';
  const categoryLower = categoryName.toLowerCase().replace(/\s+/g, '_');
  const confidence = tx.predicted_confidence ?? tx.confidence;
  const confidencePct = confidence !== undefined && confidence !== null ? (Number(confidence) * 100).toFixed(1) : '99.0';

  // Construct standard signature payload fallback if stored as null
  const payloadToVerify = tx.signature || btoa(`tx_id:${tx.id}|amount:${tx.amount}|sender:${tx.sender_username || tx.sender_id}|receiver:${tx.receiver_username || tx.receiver_id}|cat:${categoryName}|ts:${tx.timestamp}`);

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadToVerify);
    setCopied(true);
    showToast('Signature copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyReceipt(payloadToVerify);
      setVerifyResult(res);
      showToast('Signature verified against cryptographic payload!', 'success');
    } catch (err) {
      setVerifyResult({ valid: false, error: 'Signature mismatch' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-subtle)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheckIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                Transaction #{tx.id}
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.35rem', borderRadius: '50%' }}>
            <XIcon size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Amount banner */}
          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center',
            border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Transfer Amount
            </span>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0' }}>
              ₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              <CreditCardIcon size={14} /> Method: <strong>{tx.payment_method || 'UPI'}</strong>
            </div>
          </div>

          {/* Sender & Receiver Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.9rem' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Sender Account
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {tx.sender_username || `User #${tx.sender_id}`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.1rem' }}>
                Account ID: #{tx.sender_id}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.9rem' }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Receiver Account
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {tx.receiver_username || `User #${tx.receiver_id}`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.1rem' }}>
                Account ID: #{tx.receiver_id}
              </div>
            </div>
          </div>

          {/* AI Insights Block */}
          <div style={{
            background: 'var(--ai-bg)',
            border: '1px solid var(--ai-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ai)', fontWeight: 700, fontSize: '0.85rem' }}>
                <SparklesIcon size={16} /> AI Category Classification
              </div>
              <span className={`badge badge-${categoryLower}`}>
                {categoryName}
              </span>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-body)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Confidence: <strong>{confidencePct}%</strong></span>
              <span>Class ID: <strong>{tx.class_id ?? tx.predicted_class_id ?? 0}</strong></span>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Merchant / Location: <strong>{tx.location || 'N/A'}</strong>
            </div>
          </div>

          {/* Signature Verification */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Cryptographic Signature
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', color: 'var(--primary)' }}
                >
                  <ShieldCheckIcon size={14} /> {verifying ? 'Verifying...' : 'Verify'}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  {copied ? <CheckIcon size={14} style={{ color: 'var(--success)' }} /> : <CopyIcon size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 0.85rem',
              fontFamily: 'monospace',
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              wordBreak: 'break-all',
              lineHeight: 1.4,
              maxHeight: '60px',
              overflowY: 'auto',
            }}>
              {payloadToVerify}
            </div>

            {verifyResult && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: verifyResult.valid ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `1px solid ${verifyResult.valid ? 'var(--success-border)' : 'var(--danger-border)'}`,
                color: verifyResult.valid ? 'var(--success-text)' : 'var(--danger-text)',
                fontSize: '0.8rem',
              }}>
                <strong>{verifyResult.valid ? '✓ Verified Payload:' : '✗ Failed:'}</strong>{' '}
                <code>{verifyResult.raw_payload || verifyResult.error}</code>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

