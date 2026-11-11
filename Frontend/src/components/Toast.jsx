import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from './Icons';

export default function Toast() {
  const { toasts, removeToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div style={{ flexShrink: 0 }}>
            {toast.type === 'success' && <CheckCircleIcon size={18} className="amount-positive" />}
            {toast.type === 'error' && <AlertTriangleIcon size={18} style={{ color: 'var(--danger)' }} />}
            {toast.type === 'info' && <InfoIcon size={18} style={{ color: 'var(--primary)' }} />}
          </div>
          <div style={{ flex: 1 }}>{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-light)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <XIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

