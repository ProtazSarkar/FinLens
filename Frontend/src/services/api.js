// Centralized API Configuration & Endpoints Map
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ENDPOINTS = {
  USERS: {
    REGISTER: '/user/register',
    LOGIN: '/user/login',
    LIST: '/user/all',
    ME: '/user/me',
    DEPOSIT: (id) => `/user/${id}/deposit`,
  },
  TRANSACTIONS: {
    TRANSFER: '/transaction/transfer',
    PREDICT: '/transaction/predict',
    VERIFY: '/transaction/verify',
    STATS: '/transaction/stats',
    ALL: '/transaction/history/all',
    BY_USER: (id) => `/transaction/history/${id}`,
  },
  HEALTH: '/health',
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { message: text };
  }

  if (!response.ok) {
    const errorMsg = data.message || data.error || `HTTP error ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const api = {
  // User endpoints
  register: (userData) =>
    fetch(`${API_BASE}${ENDPOINTS.USERS.REGISTER}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    }).then(handleResponse),

  login: (credentials) =>
    fetch(`${API_BASE}${ENDPOINTS.USERS.LOGIN}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    }).then(handleResponse),

  getUsers: () =>
    fetch(`${API_BASE}${ENDPOINTS.USERS.LIST}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_BASE}${ENDPOINTS.USERS.ME}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  deposit: (userId, amount) =>
    fetch(`${API_BASE}${ENDPOINTS.USERS.DEPOSIT(userId)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount: Number(amount) }),
    }).then(handleResponse),

  // Transaction endpoints
  transfer: (payload) =>
    fetch(`${API_BASE}${ENDPOINTS.TRANSACTIONS.TRANSFER}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse),

  predictCategory: (payload) =>
    fetch(`${API_BASE}${ENDPOINTS.TRANSACTIONS.PREDICT}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse),

  verifyReceipt: (signature) =>
    fetch(`${API_BASE}${ENDPOINTS.TRANSACTIONS.VERIFY}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ signature }),
    }).then(handleResponse),

  getStats: () =>
    fetch(`${API_BASE}${ENDPOINTS.TRANSACTIONS.STATS}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getAllTransactions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    return fetch(`${API_BASE}${ENDPOINTS.TRANSACTIONS.ALL}${queryString}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  getUserTransactions: (userId) =>
    fetch(`${API_BASE}${ENDPOINTS.TRANSACTIONS.BY_USER(userId)}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getHealth: () =>
    fetch(`${API_BASE}${ENDPOINTS.HEALTH}`, {
      headers: getHeaders(),
    }).then(handleResponse),
};

export default api;
