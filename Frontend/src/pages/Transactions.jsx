import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getAllTransactions();
        setTransactions(res.transactions || []);
      } catch (err) {
        setError(err.data?.error || err.message || 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const formatPct = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
    return `${(Number(value) * 100).toFixed(2)}%`;
  };

  return (
    <div className="page-shell">
      <div className="page-header glass-card">
        <div>
          <p className="eyebrow">Insights</p>
          <h2>Transaction Intelligence</h2>
        </div>
        <div className="stat-pill">{transactions.length} records</div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="glass-card loading-card">Loading transactions...</div>
      ) : (
        <div className="table-wrap glass-card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Actual</th>
                <th>Payment</th>
                <th>Location</th>
                <th>AI Prediction</th>
                <th>Confidence</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">No transactions found.</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>#{tx.id}</td>
                    <td>{tx.sender_username || tx.sender_id}</td>
                    <td>{tx.receiver_username || tx.receiver_id}</td>
                    <td>
                      <span className="amount">₹{Number(tx.amount || 0).toFixed(2)}</span>
                    </td>
                    <td>{tx.payment_method || 'N/A'}</td>
                    <td>{tx.location || 'N/A'}</td>
                    <td>
                      <span className="chip">{tx.predicted_category || tx.category || 'N/A'}</span>
                    </td>
                    <td>{formatPct(tx.predicted_confidence ?? tx.confidence)}</td>
                    <td>{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
