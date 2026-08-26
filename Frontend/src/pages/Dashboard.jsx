import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function Dashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState({ error: '', success: '' });

  const loadData = async () => {
    const me = await api.getMe();
    if (!me.error) setUser(me);
    const txs = await api.getHistory();
    if (!txs.error) setHistory(txs);
  };

  useEffect(() => { loadData(); }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: '' });
    const res = await api.transfer({ receiver_username: receiver, amount: parseFloat(amount) });
    if (res.error) setStatus({ error: res.error, success: '' });
    else {
      setStatus({ error: '', success: `Transferred ₹${amount} to ${receiver}` });
      setReceiver(''); setAmount('');
      loadData();
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h3>Wallet Balance</h3>
        <h1 style={{ color: '#38bdf8', margin: 0 }}>₹{user?.balance?.toFixed(2)}</h1>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Send Money</h3>
          {status.error && <div className="error-msg">{status.error}</div>}
          {status.success && <div style={{ color: '#4ade80', marginBottom: '10px' }}>{status.success}</div>}
          <form onSubmit={handleTransfer}>
            <label>Recipient Username</label>
            <input type="text" value={receiver} onChange={e => setReceiver(e.target.value)} required />
            <label>Amount (₹)</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
            <button type="submit" className="btn-primary">Transfer Funds</button>
          </form>
        </div>

        <div className="card">
          <h3>Transaction History</h3>
          <table>
            <thead>
              <tr><th>Type</th><th>User</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {history.map(t => {
                const isSent = t.sender_id === user.id;
                return (
                  <tr key={t.id}>
                    <td style={{ color: isSent ? '#ef4444' : '#4ade80' }}>{isSent ? 'DEBIT' : 'CREDIT'}</td>
                    <td>{isSent ? t.receiver_name : t.sender_name}</td>
                    <td>₹{t.amount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}