// Centralized API Configuration & Endpoints Map
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ENDPOINTS = {
  USERS: {
    REGISTER: '/user/register',
    LIST: '/user/all',
  },
  TRANSACTIONS: {
    TRANSFER: '/transaction/transfer',
    ALL: '/transaction/history/all',
  },
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
});

const handleResponse = async (response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Network response error');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const api = {
  register: (userData) =>
    fetch(`${API_BASE}${ENDPOINTS.USERS.REGISTER}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    }).then(handleResponse),

  getUsers: () =>
    fetch(`${API_BASE}${ENDPOINTS.USERS.LIST}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  transfer: (payload) =>
    fetch(`${API_BASE}${ENDPOINTS.TRANSACTIONS.TRANSFER}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }).then(handleResponse),

  getAllTransactions: () =>
    fetch(`${API_BASE}${ENDPOINTS.TRANSACTIONS.ALL}`, {
      headers: getHeaders(),
    }).then(handleResponse),
};

export default api;