const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  login: (data) => fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  register: (data) => fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  getMe: () => fetch(`${API_BASE}/auth/me`, { headers: getHeaders() }).then(r => r.json()),
  transfer: (data) => fetch(`${API_BASE}/transactions/transfer`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  getHistory: () => fetch(`${API_BASE}/transactions/history`, { headers: getHeaders() }).then(r => r.json())
};