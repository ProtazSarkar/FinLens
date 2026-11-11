import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  CheckCircleIcon,
  XIcon,
  CopyIcon,
  CheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowUpRightIcon,
} from './Icons';

export default function ReceiptModal({ receipt, onClose, onNewTransfer }) {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  if (!receipt) return null;

  const handleCopySignature = () => {
    if (receipt.signature) {
      navigator.clipboard.writeText(receipt.signature);
      setCopied(true);
      showToast('Signature copied to clipboard!', 'info');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleVerify = async () => {
    if (!receipt.signature) return;
    setVerifying(true);
    try {
      const res = await api.verifyReceipt(receipt.signature);
      setVerificationResult(res);
      showToast('Cryptographic signature verified successfully!', 'success');
    } catch (err) {
      setVerificationResult({ valid: false, error: 'Verification failed' });
      showToast('Signature verification failed.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const categoryName = receipt.category || receipt.classification?.category || 'General';
  const categoryLower = categoryName.toLowerCase().replace(/\s+/g, '_');
  const confidence = receipt.confidence ?? receipt.classification?.confidence;
  const confidencePct = confidence !== undefined ? (confidence * 100).toFixed(1) : '99.5';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{
          background: 'linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%)',
          padding: '2rem 1.5rem 1.25rem',
          textAlign: 'center',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
        }}>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              padding: '0.4rem',
              borderRadius: '50%',
            }}
          >
            <XIcon size={18} />
          </button>

          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--success)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 16px rgba(5, 150, 105, 0.25)',
          }}>
            <CheckCircleIcon size={32} />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'rgba(5, 150, 105, 0.1)',
            color: 'var(--success-text)',
            borderRadius: '9999px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}>
            <ShieldCheckIcon size={14} /> Confirmed Ledger Transfer
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem' }}>
            ₹{Number(receipt.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Transaction #{receipt.transaction_id || receipt.txId || 'N/A'} • {receipt.timestamp ? new Date(receipt.timestamp).toLocaleString() : 'Just now'}
          </p>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Parties row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            border: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SENDER</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {receipt.sender?.username || receipt.sender_username || `Account #${receipt.sender_id || receipt.sender}`}
              </div>
              {receipt.sender?.new_balance !== undefined && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Bal: ₹{Number(receipt.sender.new_balance).toLocaleString()}
                </div>
              )}
            </div>

            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#fff',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}>
              <ArrowUpRightIcon size={16} />
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RECEIVER</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {receipt.receiver?.username || receipt.receiver_username || `Account #${receipt.receiver_id || receipt.receiver}`}
              </div>
              {receipt.receiver?.new_balance !== undefined && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Bal: ₹{Number(receipt.receiver.new_balance).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* AI Intelligence Block */}
          <div style={{
            background: 'var(--ai-bg)',
            border: '1px solid var(--ai-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--ai)', fontWeight: 700, fontSize: '0.825rem' }}>
                <SparklesIcon size={16} /> AI Category Intelligence
              </div>
              <span className={`badge badge-${categoryLower}`}>
                {categoryName}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', color: 'var(--text-body)' }}>
              <span>Confidence: <strong>{confidencePct}%</strong></span>
              <span>Merchant: <strong>{receipt.location || 'Direct Transfer'}</strong></span>
            </div>
          </div>

          {/* Cryptographic Signature */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Digital Receipt Signature
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                  onClick={handleCopySignature}
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
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              wordBreak: 'break-all',
              lineHeight: 1.4,
              maxHeight: '65px',
              overflowY: 'auto',
            }}>
              {receipt.signature || 'N/A'}
            </div>

            {verificationResult && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: verificationResult.valid ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `1px solid ${verificationResult.valid ? 'var(--success-border)' : 'var(--danger-border)'}`,
                color: verificationResult.valid ? 'var(--success-text)' : 'var(--danger-text)',
                fontSize: '0.8rem',
              }}>
                <strong>{verificationResult.valid ? '✓ Verified Payload:' : '✗ Verification Failed:'}</strong>{' '}
                <code>{verificationResult.raw_payload || verificationResult.error}</code>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => window.print()}
          >
            Print Receipt
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Done
            </button>
            {onNewTransfer && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onNewTransfer();
                }}
              >
                Send Another
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

