import { useState } from 'react';
import { api } from '../services/api';

export default function Register({ setView }) {
  const [formData, setFormData] = useState({ username: '', password: '', user_type: 'Personal' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await api.register(formData);
      setMessage(res.message || 'User created successfully');
      setFormData({ username: '', password: '', user_type: 'Personal' });
      if (setView) setTimeout(() => setView('users'), 500);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to create user');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '430px', margin: '2rem auto' }}>
      <div className="card" style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
        <h2>Create User</h2>
        {error && <div style={{ color: '#b91c1c', marginBottom: '1rem' }}>{error}</div>}
        {message && <div style={{ color: '#166534', marginBottom: '1rem' }}>{message}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Username</label>
            <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required style={{ width: '100%', padding: '0.6rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>Password</label>
            <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required style={{ width: '100%', padding: '0.6rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.3rem' }}>User Type</label>
            <select value={formData.user_type} onChange={e => setFormData({ ...formData, user_type: e.target.value })} style={{ width: '100%', padding: '0.6rem' }}>
              <option value="Personal">Personal</option>
              <option value="Business">Business</option>
            </select>
          </div>
          <button type="submit" style={{ padding: '0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Create User</button>
        </form>
      </div>
    </div>
  );
}