import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import {
  SearchIcon,
  DownloadIcon,
  RefreshIcon,
  ShieldCheckIcon,
  SparklesIcon,
  EyeIcon,
  CreditCardIcon,
  ArrowUpRightIcon,
} from '../components/Icons';
import TransactionDetailModal from '../components/TransactionDetailModal';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAllTransactions();
      setTransactions(res.transactions || []);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load ledger transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const categoriesList = [
    'ALL',
    'Healthcare',
    'Groceries',
    'Shopping',
    'Restaurants',
    'Entertainment',
    'Travel',
    'Utilities',
  ];

  // Client-side filtering & sorting
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    // Category filter
    if (selectedCategory !== 'ALL') {
      list = list.filter((tx) => {
        const cat = (tx.predicted_category || tx.category || '').toLowerCase();
        return cat.includes(selectedCategory.toLowerCase());
      });
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((tx) => {
        const idMatch = String(tx.id).includes(q);
        const senderMatch = (tx.sender_username || '').toLowerCase().includes(q);
        const receiverMatch = (tx.receiver_username || '').toLowerCase().includes(q);
        const locMatch = (tx.location || '').toLowerCase().includes(q);
        const catMatch = (tx.predicted_category || tx.category || '').toLowerCase().includes(q);
        const methodMatch = (tx.payment_method || '').toLowerCase().includes(q);
        return idMatch || senderMatch || receiverMatch || locMatch || catMatch || methodMatch;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
      }
      if (sortBy === 'amount_high') {
        return (b.amount || 0) - (a.amount || 0);
      }
      if (sortBy === 'amount_low') {
        return (a.amount || 0) - (b.amount || 0);
      }
      return 0;
    });

    return list;
  }, [transactions, selectedCategory, searchTerm, sortBy]);

  // Summary stats for filtered set
  const filteredVolume = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
  }, [filteredTransactions]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredTransactions.length) return;
    const headers = ['ID', 'Timestamp', 'Sender', 'Receiver', 'Amount_INR', 'Payment_Method', 'Location', 'AI_Category', 'Confidence'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.timestamp || '',
      `"${tx.sender_username || tx.sender_id}"`,
      `"${tx.receiver_username || tx.receiver_id}"`,
      tx.amount,
      `"${tx.payment_method || ''}"`,
      `"${(tx.location || '').replace(/"/g, '""')}"`,
      `"${tx.predicted_category || tx.category || ''}"`,
      tx.predicted_confidence ?? tx.confidence ?? '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartledger_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (!filteredTransactions.length) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredTransactions, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `smartledger_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>Ledger Transaction History</h1>
          <p className="view-subtitle">
            Cryptographically signed immutable transaction records with automated AI categories
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={loadTransactions} className="btn-secondary btn-sm">
            <RefreshIcon size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleExportCSV} className="btn-secondary btn-sm" disabled={filteredTransactions.length === 0}>
            <DownloadIcon size={14} /> Export CSV
          </button>
          <button onClick={handleExportJSON} className="btn-secondary btn-sm" disabled={filteredTransactions.length === 0}>
            <DownloadIcon size={14} /> Export JSON
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.85rem 1rem',
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger-text)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
        }}>
          {error}
        </div>
      )}

      {/* Filter and Search Bar Card */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-light)',
            }}>
              <SearchIcon size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by ID, sender, receiver, merchant location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>

          {/* Sort dropdown */}
          <div style={{ width: '200px' }}>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount: High to Low</option>
              <option value="amount_low">Amount: Low to High</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Filter by Category:
          </span>
          <div className="chip-group" style={{ marginTop: '0.4rem' }}>
            {categoriesList.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Summary Metrics */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <div>
            Showing <strong>{filteredTransactions.length}</strong> of {transactions.length} records
          </div>
          <div>
            Filtered Total Volume:{' '}
            <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
              ₹{filteredVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshIcon size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
          Loading ledger records...
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Merchant Descriptor</th>
                <th>AI Classification</th>
                <th>Confidence</th>
                <th>Date & Time</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No matching transactions found. Try adjusting your search query or filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const cat = tx.predicted_category || tx.category || 'General';
                  const catLower = cat.toLowerCase().replace(/\s+/g, '_');
                  const conf = tx.predicted_confidence ?? tx.confidence;
                  const confPct = conf !== undefined && conf !== null ? `${(Number(conf) * 100).toFixed(1)}%` : '99.0%';

                  return (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                        #{tx.id}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {tx.sender_username || `User #${tx.sender_id}`}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {tx.receiver_username || `User #${tx.receiver_id}`}
                        </span>
                      </td>
                      <td>
                        <span className="currency-amount amount-neutral" style={{ fontSize: '0.95rem' }}>
                          ₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {tx.payment_method || 'UPI'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.location || 'Direct Transfer'}
                      </td>
                      <td>
                        <span className={`badge badge-${catLower}`}>
                          {cat}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {confPct}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="btn-ghost btn-sm"
                          style={{ color: 'var(--primary)', padding: '0.3rem 0.6rem' }}
                          title="Inspect cryptographic receipt"
                        >
                          <EyeIcon size={15} /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction Detail & Verification Modal */}
      {selectedTx && (
        <TransactionDetailModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
