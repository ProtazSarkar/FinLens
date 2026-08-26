import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { user } = useContext(AuthContext);

  return (
    <div className="container" style={{ maxWidth: '500px' }}>
      <div className="card">
        <h2>User Profile</h2>
        <p><strong>User ID:</strong> {user?.id}</p>
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> <span className={`badge badge-${user?.role}`}>{user?.role}</span></p>
        <p><strong>Created At:</strong> {new Date(user?.created_at).toLocaleString()}</p>
      </div>
    </div>
  );
}