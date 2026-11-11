import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [depositModalUser, setDepositModalUser] = useState(null);
  const [prefilledSender, setPrefilledSender] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.getUsers().catch(() => ({ users: [] })),
        api.getStats().catch(() => ({ stats: null })),
      ]);

      const fetchedUsers = usersRes.users || [];
      setUsers(fetchedUsers);
      setStats(statsRes.stats || null);

      // Keep active user synchronized with updated balance
      setActiveUser((prevActive) => {
        if (!prevActive && fetchedUsers.length > 0) {
          return fetchedUsers[0];
        }
        if (prevActive) {
          const updated = fetchedUsers.find((u) => u.id === prevActive.id);
          return updated || prevActive;
        }
        return null;
      });
    } catch (err) {
      console.error('Error refreshing app state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const openDepositModal = (user) => {
    setDepositModalUser(user);
  };

  const closeDepositModal = () => {
    setDepositModalUser(null);
  };

  const navigateToSendMoney = (sender = null) => {
    if (sender) {
      setPrefilledSender(sender);
    }
    setCurrentView('transfer');
  };

  return (
    <AppContext.Provider
      value={{
        users,
        activeUser,
        setActiveUser,
        stats,
        loading,
        toasts,
        showToast,
        removeToast,
        refreshAll,
        depositModalUser,
        openDepositModal,
        closeDepositModal,
        prefilledSender,
        setPrefilledSender,
        currentView,
        setCurrentView,
        navigateToSendMoney,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;

