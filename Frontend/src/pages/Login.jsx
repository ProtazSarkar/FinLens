import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Login({ setView }) {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(username, password);
    if (res.success) setView('dashboard');
    else setError(res.error || 'Login failed');
  };

  return (
    <div className="container" style={{ maxWidth: '400px' }}>
      <div className="card">
        <h2>Login</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary">Sign In</button>
        </form>
      </div>
    </div>
  );
}