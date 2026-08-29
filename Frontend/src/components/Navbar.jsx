export default function Navbar({ currentView, setView }) {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.9rem 1.2rem',
      background: '#0f172a',
      color: '#fff',
      gap: '1rem',
      flexWrap: 'wrap',
      boxShadow: '0 2px 6px rgba(15,23,42,0.25)',
    }}>
      <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>SmartLedger</div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button style={navButtonStyle(currentView === 'users')} onClick={() => setView('users')}>View Users</button>
        <button style={navButtonStyle(currentView === 'register')} onClick={() => setView('register')}>Create User</button>
        <button style={navButtonStyle(currentView === 'dashboard')} onClick={() => setView('dashboard')}>Create Transaction</button>
        <button style={navButtonStyle(currentView === 'transactions')} onClick={() => setView('transactions')}>Transaction History</button>
      </div>
    </nav>
  );
}

function navButtonStyle(active) {
  return {
    border: 'none',
    borderRadius: '6px',
    padding: '0.55rem 0.9rem',
    background: active ? '#38bdf8' : '#1e293b',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  };
}