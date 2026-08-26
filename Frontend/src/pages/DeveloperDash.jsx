import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function DeveloperDash() {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user', balance: 1000 });

  const loadDevData = async () => {
    setUsers(await api.devGetUsers());
    setTransactions(await api.devGetTransactions());
    setEvents(await api.devGetEvents());
  };

  useEffect(() => { loadDevData(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    await api.devCreateUser(newUser);
    setNewUser({ username: '', email: '', password: '', role: 'user', balance: 1000 });
    loadDevData();
  };

  return (
    <div className="container">
      <h2>Developer Dashboard</h2>
      
      <div className="card">
        <h3>System Overview & Diagnostics</h3>
        <p>Total Users: <strong>{users.length}</strong> | Total Ledger Transactions: <strong>{transactions.length}</strong></p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Create User (DB Direct)</h3>
          <form onSubmit={handleCreateUser}>
            <input type="text" placeholder="Username" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required />
            <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
            <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
            <input type="number" placeholder="Initial Balance" value={newUser.balance} onChange={e => setNewUser({ ...newUser, balance: e.target.value })} required />
            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="user">User</option>
              <option value="developer">Developer</option>
            </select>
            <button type="submit" className="btn-primary">Add User</button>
          </form>
        </div>

        <div className="card">
          <h3>User Database Registry</h3>
          <table>
            <thead><tr><th>ID</th><th>User</th><th>Role</th><th>Balance</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td><td>{u.username}</td><td>{u.role}</td><td>₹{u.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>System Audit & Event Logs</h3>
        <table>
          <thead><tr><th>Timestamp</th><th>Type</th><th>Payload</th></tr></thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id}>
                <td>{new Date(e.timestamp).toLocaleTimeString()}</td>
                <td style={{ color: '#38bdf8' }}>{e.event_type}</td>
                <td><code>{e.payload}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}