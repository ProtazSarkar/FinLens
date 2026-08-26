import { useState } from 'react';
import { api } from '../services/api';

export default function Register({ setView }) {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await api.register(formData);
    if (!res.error) setView('login');
    else setError(res.error);
  };

  return (
    <div className="container" style={{ maxWidth: '400px' }}>
      <div className="card">
        <h2>Create Account</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
          <label>Email</label>
          <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          <label>Password</label>
          <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
          <label>Account Role</label>
          <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
            <option value="user">Standard User</option>
            <option value="developer">Developer / Admin</option>
          </select>
          <button type="submit" className="btn-primary">Register</button>
        </form>
      </div>
    </div>
  );
}