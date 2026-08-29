import { useState } from 'react';
import { api } from '../services/api';

export default function Dashboard() {
  const [formData, setFormData] = useState({
    sender_id: '',
    receiver_id: '',
    amount: '',
    payment_method: 'UPI',
    location: 'City Mall Supermart, Kolkata',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        sender_id: parseInt(formData.sender_id),
        receiver_id: parseInt(formData.receiver_id),
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        location: formData.location,
      };

      const res = await api.transfer(payload);

      setResult({
        type: 'success',
        message: res.message,
        txId: res.transaction_id,
        category: res.classification?.category,
        confidence: res.classification?.confidence,
        classId: res.classification?.class_id,
        signature: res.signature,
      });
      setFormData({ ...formData, amount: '', sender_id: '', receiver_id: '' });
    } catch (err) {
      setResult({
        type: 'error',
        message: err.data?.error || err.message || 'Failed to process transaction.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Create Transaction</h2>

      {result && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          background: result.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${result.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: result.type === 'success' ? '#065f46' : '#991b1b',
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>{result.message}</h4>
          {result.type === 'success' && (
            <div style={{ marginTop: '0.5rem', lineHeight: '1.6' }}>
              <div><strong>Transaction ID:</strong> #{result.txId}</div>
              <div>
                <strong>Predicted Category:</strong>{' '}
                <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{result.category}</span> (Class ID: {result.classId})
              </div>
              <div><strong>Model Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.3rem', wordBreak: 'break-all' }}>
                <strong>Digital Receipt Signature:</strong> {result.signature}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem' }}>Sender User ID</label>
          <input
            type="number"
            name="sender_id"
            value={formData.sender_id}
            onChange={handleInputChange}
            placeholder="e.g. 1"
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem' }}>Receiver User ID</label>
          <input
            type="number"
            name="receiver_id"
            value={formData.receiver_id}
            onChange={handleInputChange}
            placeholder="e.g. 2"
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem' }}>Amount (INR)</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="e.g. 420.50"
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem' }}>Payment Method</label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="UPI">UPI</option>
            <option value="Credit_Card">Credit Card</option>
            <option value="Debit_Card">Debit Card</option>
            <option value="NetBanking">NetBanking</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem' }}>Location / Merchant Descriptor</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g. Apollo Hospital Kolkata / City Mall Supermart"
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem',
            background: loading ? '#94a3b8' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Processing Transaction...' : 'Submit Transaction'}
        </button>
      </form>
    </div>
  );
}