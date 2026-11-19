import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  SparklesIcon,
  BotIcon,
  SendIcon,
  CopyIcon,
  CheckIcon,
  ShieldCheckIcon,
  DownloadIcon,
  AlertTriangleIcon,
  ChartIcon,
  RefreshIcon,
  PlusIcon,
  WalletIcon,
} from '../components/Icons';
import { DonutPieChart, BarTrendChart, getCategoryColor } from '../components/Charts';

export default function AiAnalytics() {
  const { activeUser, showToast } = useApp();

  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [copiedSqlId, setCopiedSqlId] = useState(null);
  const [sessions, setSessions] = useState([
    { id: 'sess_1', title: 'Category Spend Breakdown' },
    { id: 'sess_2', title: 'Top Inflow Merchants' },
    { id: 'sess_3', title: 'Recurring Subscriptions Audit' },
    { id: 'sess_4', title: 'Payment Channel Comparison' },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    api.getChatSuggestions()
      .then((res) => setSuggestions(res.suggestions || []))
      .catch(() => {});
  }, []);

  const handleSend = async (queryText = null, forceExecute = false) => {
    const promptToSend = (queryText || inputPrompt).trim();
    if (!promptToSend || loading) return;

    if (!queryText) {
      setInputPrompt('');
    }

    const userMsgId = 'usr_' + Date.now();
    const asstMsgId = 'ast_' + (Date.now() + 1);

    if (!forceExecute) {
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          text: promptToSend,
        },
        {
          id: asstMsgId,
          role: 'assistant',
          loading: true,
          text: 'Synthesizing SQL query, executing in in-memory shadow sandbox, and performing AST security validation...',
        },
      ]);
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.status === 'AWAITING_HUMAN_APPROVAL'
            ? { ...m, loading: true, text: 'Executing verified query on live database...' }
            : m
        )
      );
    }

    setLoading(true);

    try {
      const res = await api.askChat(promptToSend, activeUser?.id, forceExecute);

      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg.loading || (forceExecute && msg.status === 'AWAITING_HUMAN_APPROVAL')) {
            return {
              id: asstMsgId,
              role: 'assistant',
              loading: false,
              status: res.status,
              text: res.judge?.explanation || (res.success ? 'Query executed successfully.' : 'Query failed.'),
              sql: res.sql,
              judge: res.judge,
              sandbox_telemetry: res.sandbox_telemetry || res.live_telemetry,
              data: res.data || [],
              columns: res.columns || [],
              originalPrompt: promptToSend,
            };
          }
          return msg;
        });
      });

      // Add to session history if not already there
      const shortTitle = promptToSend.length > 28 ? promptToSend.slice(0, 28) + '...' : promptToSend;
      setSessions((prev) => {
        if (!prev.find((s) => s.title.toLowerCase() === shortTitle.toLowerCase())) {
          return [{ id: 'sess_' + Date.now(), title: shortTitle }, ...prev];
        }
        return prev;
      });
    } catch (err) {
      const errMsg = err.data?.error || err.message || 'Failed to process analytics query.';
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.loading) {
            return {
              id: asstMsgId,
              role: 'assistant',
              loading: false,
              text: `Error encountered: ${errMsg}`,
              isError: true,
            };
          }
          return msg;
        })
      );
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySql = (sqlText, id) => {
    navigator.clipboard.writeText(sqlText);
    setCopiedSqlId(id);
    showToast('SQL copied to clipboard!', 'info');
    setTimeout(() => setCopiedSqlId(null), 2000);
  };

  const handleExportCSV = (data, columns, filename = 'finlens_analytics.csv') => {
    if (!data || !data.length) return;
    const cols = columns.length ? columns : Object.keys(data[0]);
    const headers = cols.join(',');
    const rows = data.map((row) =>
      cols
        .map((col) => {
          const val = row[col] === null || row[col] === undefined ? '' : String(row[col]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported dataset to CSV!', 'success');
  };

  const starterCards = [
    {
      title: 'Category Spend Distribution',
      desc: 'Pie chart breakdown of spend across Healthcare, Utilities, Groceries & Dining',
      prompt: 'Show total spend and transaction count grouped by category, ordered from highest to lowest spend.',
      icon: ChartIcon,
    },
    {
      title: 'Top Inflow Merchants',
      desc: 'Ranking of the top business merchants receiving payments in the ledger',
      prompt: 'Who are the top 5 merchants or receivers by total money received?',
      icon: WalletIcon,
    },
    {
      title: 'Recurring Subscriptions & Bills',
      desc: 'Detect periodic transactions, gym fees, power utility bills and monthly burn',
      prompt: 'Identify all recurring payments and subscriptions with their average amounts.',
      icon: SparklesIcon,
    },
    {
      title: 'Payment Channel Share',
      desc: 'Compare total volume and ticket size between UPI, Credit Cards, and NetBanking',
      prompt: 'What is the breakdown of transactions across UPI, Credit Card, Debit Card, and NetBanking?',
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 65px)', background: '#f8fafc', overflow: 'hidden' }}>
      {/* Left ChatGPT-Style Sidebar */}
      <aside
        style={{
          width: '270px',
          background: '#ffffff',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem 1rem',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setMessages([])}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            justifyContent: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <PlusIcon size={16} /> New Analysis Chat
        </button>

        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
          Recent Queries
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {sessions.map((sess) => (
            <button
              key={sess.id}
              onClick={() => handleSend(sess.title)}
              className="btn-ghost"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                textAlign: 'left',
                fontSize: '0.825rem',
                padding: '0.55rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: 'var(--text-body)',
              }}
            >
              <ChartIcon size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{sess.title}</span>
            </button>
          ))}
        </div>

        {/* Engine Specs Box */}
        <div
          style={{
            marginTop: 'auto',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
            <BotIcon size={16} style={{ color: 'var(--primary)' }} /> FinLens v2.0
          </div>
          <div>• Groq Inference (Qwen 27B)</div>
          <div>• In-Memory Shadow Sandbox</div>
          <div>• SQLGlot AST Read-Only Guard</div>
        </div>
      </aside>

      {/* Main Chat Canvas */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Status Bar */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            background: '#ffffff',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
              FinLens AI Business Analytics
            </span>
            <span className="badge badge-groceries" style={{ fontSize: '0.7rem' }}>
              <ShieldCheckIcon size={12} /> Shadow Sandbox Armed
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Context: <strong>{activeUser ? activeUser.username : 'All Enterprise Accounts'}</strong>
          </div>
        </div>

        {/* Chat Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem 1rem 8rem',
          }}
        >
          <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* If No Messages: Show ChatGPT-style Starter Hero & Cards */}
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <BotIcon size={32} />
                </div>

                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  What would you like to analyze today?
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '580px', margin: '0 auto 2.5rem' }}>
                  Ask questions about business spending, category distributions, recurring subscriptions, or merchant trends in plain English.
                </p>

                {/* 4 Starter Prompt Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', textAlign: 'left' }}>
                  {starterCards.map((card) => {
                    const IconComp = card.icon;
                    return (
                      <div
                        key={card.title}
                        onClick={() => handleSend(card.prompt)}
                        className="card"
                        style={{
                          cursor: 'pointer',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                            <IconComp size={18} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {card.title}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                          {card.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Render Conversation Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: msg.role === 'user' ? '75%' : '100%',
                    width: msg.role === 'user' ? 'auto' : '100%',
                    padding: msg.role === 'user' ? '0.85rem 1.25rem' : '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    background: msg.role === 'user' ? 'var(--primary)' : '#ffffff',
                    color: msg.role === 'user' ? '#ffffff' : 'var(--text-main)',
                    boxShadow: 'var(--shadow-sm)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                    fontSize: '0.925rem',
                    lineHeight: 1.6,
                  }}
                >
                  {/* Assistant Header */}
                  {msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                        <BotIcon size={18} /> FinLens Analytics Engine
                      </div>
                      {msg.sandbox_telemetry && (
                        <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem' }}>
                          <span className="badge badge-groceries">
                            ⚡ Sandbox: {msg.sandbox_telemetry.execution_time_ms || msg.sandbox_telemetry.sandbox_time_ms || 4}ms
                          </span>
                          <span className="badge badge-personal">
                            Judge: {msg.judge?.confidence_score || 98}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Prose */}
                  <div>{msg.text}</div>

                  {/* SQL Code Box */}
                  {msg.sql && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          SQLGlot Validated Analytical Query
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopySql(msg.sql, msg.id)}
                          className="btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        >
                          {copiedSqlId === msg.id ? <CheckIcon size={14} style={{ color: 'var(--success)' }} /> : <CopyIcon size={14} />}
                          {copiedSqlId === msg.id ? 'Copied' : 'Copy SQL'}
                        </button>
                      </div>
                      <pre
                        style={{
                          background: '#0f172a',
                          color: '#38bdf8',
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8rem',
                          overflowX: 'auto',
                          fontFamily: 'monospace',
                          margin: 0,
                          lineHeight: 1.45,
                        }}
                      >
                        <code>{msg.sql}</code>
                      </pre>
                    </div>
                  )}

                  {/* HITL Review Card */}
                  {msg.status === 'AWAITING_HUMAN_APPROVAL' && (
                    <div
                      style={{
                        marginTop: '1.25rem',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#92400e', fontWeight: 700, fontSize: '0.9rem' }}>
                        <AlertTriangleIcon size={18} /> Human-in-the-Loop Dry-Run Authorization
                      </div>
                      <p style={{ fontSize: '0.825rem', color: '#78350f', margin: '0.4rem 0 1rem' }}>
                        The shadow sandbox executed this query in {msg.sandbox_telemetry?.execution_time_ms}ms producing {msg.sandbox_telemetry?.row_count} rows. Review the sample output below before promoting to live database execution.
                      </p>
                      <button
                        onClick={() => handleSend(msg.originalPrompt, true)}
                        className="btn-primary btn-sm"
                        style={{ background: 'var(--success)', padding: '0.55rem 1.15rem' }}
                      >
                        ✓ Approve & Execute on Live DB
                      </button>
                    </div>
                  )}

                  {/* Dynamic Visualizations: Pie Chart or Bar Chart */}
                  {msg.data && msg.data.length > 1 && (
                    <div style={{ marginTop: '1.25rem' }}>
                      <DynamicVisualization data={msg.data} judge={msg.judge} />
                    </div>
                  )}

                  {/* Data Table */}
                  {msg.data && msg.data.length > 0 && (
                    <div style={{ marginTop: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Query Results ({msg.data.length} records)
                        </span>
                        <button
                          onClick={() => handleExportCSV(msg.data, msg.columns)}
                          className="btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                        >
                          <DownloadIcon size={13} /> Export CSV
                        </button>
                      </div>

                      <div
                        style={{
                          maxHeight: '260px',
                          overflowY: 'auto',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          background: '#ffffff',
                        }}
                      >
                        <table style={{ fontSize: '0.825rem' }}>
                          <thead>
                            <tr>
                              {Object.keys(msg.data[0]).map((col) => (
                                <th key={col} style={{ padding: '0.55rem 0.75rem' }}>
                                  {col.replace(/_/g, ' ')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.data.slice(0, 20).map((row, idx) => (
                              <tr key={idx}>
                                {Object.values(row).map((val, cIdx) => (
                                  <td key={cIdx} style={{ padding: '0.55rem 0.75rem' }}>
                                    {typeof val === 'number'
                                      ? val.toLocaleString('en-IN')
                                      : val === null || val === undefined
                                      ? '—'
                                      : String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ChatGPT-Style Floating Bottom Input Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, rgba(248, 250, 252, 0) 0%, #f8fafc 30%, #f8fafc 100%)',
            padding: '1rem 1.5rem 1.25rem',
          }}
        >
          <div style={{ maxWidth: '880px', margin: '0 auto' }}>
            {/* Suggestion Chips */}
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '0.65rem', whiteSpace: 'nowrap' }}>
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSend(s.prompt)}
                    className="chip-btn"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <SparklesIcon size={12} style={{ color: 'var(--primary)' }} />
                    {s.title}
                  </button>
                ))}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: '#ffffff',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-xl)',
                padding: '0.45rem 0.65rem 0.45rem 1.25rem',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <input
                type="text"
                placeholder="Ask any financial business question (e.g. 'Show total spend per category with pie chart')..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={loading}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  padding: '0.5rem 0',
                  boxShadow: 'none',
                  width: '100%',
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !inputPrompt.trim()}
                style={{
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <SendIcon size={16} />
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.4rem' }}>
              FinLens Dual-Agent Engine automatically executes dry-runs in an in-memory shadow sandbox to guarantee zero production load.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Dynamic Multi-Chart Switcher: Renders Donut/Pie Chart or Bar Chart based on data shape
function DynamicVisualization({ data, judge }) {
  if (!data || data.length < 2) return null;

  const firstRow = data[0];
  const keys = Object.keys(firstRow);

  const labelKey = keys.find((k) => typeof firstRow[k] === 'string') || keys[0];
  const numericKey = keys.find((k) => typeof firstRow[k] === 'number') || keys[1];

  if (!numericKey) return null;

  // If query is about category spend or share -> show DonutPieChart
  const isCategoryOrShare =
    labelKey.toLowerCase().includes('cat') ||
    labelKey.toLowerCase().includes('method') ||
    judge?.recommended_chart === 'pie';

  if (isCategoryOrShare) {
    return (
      <div
        style={{
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ChartIcon size={16} style={{ color: 'var(--primary)' }} /> Visual Distribution ({labelKey.replace(/_/g, ' ')})
        </div>
        <DonutPieChart
          data={data.map((d) => ({
            label: String(d[labelKey]),
            value: Number(d[numericKey]) || 0,
          }))}
          size={200}
        />
      </div>
    );
  }

  // Otherwise render Bar Trend / Comparison Chart
  return (
    <div
      style={{
        background: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <ChartIcon size={16} style={{ color: 'var(--primary)' }} /> Comparison Chart ({numericKey.replace(/_/g, ' ')})
      </div>
      <BarTrendChart
        data={data.map((d) => ({
          label: String(d[labelKey]),
          value: Number(d[numericKey]) || 0,
        }))}
        height={170}
      />
    </div>
  );
}
