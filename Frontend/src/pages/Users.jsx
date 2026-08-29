import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getUsers();
        setUsers(res.users || []);
      } catch (err) {
        setError(err.data?.error || err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      <h2>Users</h2>
      {error && <div style={{ color: '#b91c1c', marginBottom: '1rem' }}>{error}</div>}
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Balance</th>
                <th style={thStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '1rem', textAlign: 'center' }}>No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}>{user.id}</td>
                    <td style={tdStyle}>{user.username}</td>
                    <td style={tdStyle}>{user.user_type || 'Personal'}</td>
                    <td style={tdStyle}>₹{Number(user.balance || 0).toFixed(2)}</td>
                    <td style={tdStyle}>{user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</td>
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

const thStyle = {
  textAlign: 'left',
  padding: '0.8rem',
  borderBottom: '1px solid #e2e8f0',
};

const tdStyle = {
  padding: '0.8rem',
  verticalAlign: 'top',
};
