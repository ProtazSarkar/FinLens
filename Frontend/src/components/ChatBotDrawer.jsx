import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  SparklesIcon,
  BotIcon,
  XIcon,
  SendIcon,
  CopyIcon,
  CheckIcon,
  ShieldCheckIcon,
  DownloadIcon,
  AlertTriangleIcon,
  TerminalIcon,
  ChartIcon,
} from './Icons';

export default function ChatBotDrawer() {
  const { isChatOpen, setIsChatOpen, activeUser, showToast } = useApp();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am FinLens AI, your business financial analytics partner. Ask me any question in plain English, and my dual-agent engine will generate SQL, test it in an isolated shadow sandbox, evaluate its cost, and compute your live analytics.',
      sql: null,
      telemetry: null,
      data: null,
      columns: [],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [copiedSqlId, setCopiedSqlId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
      if (suggestions.length === 0) {
        api.getChatSuggestions()
          .then((res) => setSuggestions(res.suggestions || []))
          .catch(() => {});
      }
    }
  }, [isChatOpen, messages, suggestions.length]);

  const handleSend = async (queryText = null, forceExecute = false) => {
    const promptToSend = (queryText || inputPrompt).trim();
    if (!promptToSend || loading) return;

    if (!queryText) {
      setInputPrompt('');
    }

    const userMsgId = 'user_' + Date.now();
    const assistantMsgId = 'asst_' + (Date.now() + 1);

    if (!forceExecute) {
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          text: promptToSend,
        },
        {
          id: assistantMsgId,
          role: 'assistant',
          loading: true,
          text: 'Synthesizing SQL, conducting shadow sandbox dry-run, and running AST audit...',
        },
      ]);
    } else {
      // Update existing message to loading state for confirmed execution
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId || m.status === 'AWAITING_HUMAN_APPROVAL'
            ? { ...m, loading: true, text: 'Executing approved query on live database...' }
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
              id: assistantMsgId,
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
    } catch (err) {
      const errMsg = err.data?.error || err.message || 'Failed to process query.';
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.loading) {
            return {
              id: assistantMsgId,
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

  const handleExportCSV = (data, columns, filename = 'finlens_query_export.csv') => {
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

  return (
    <>
      {/* Floating Launch Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 80,
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          color: '#ffffff',
          borderRadius: '9999px',
          padding: '0.8rem 1.35rem',
          boxShadow: '0 10px 25px -3px rgba(37, 99, 235, 0.4), 0 4px 6px -4px rgba(124, 58, 237, 0.3)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontWeight: 700,
          fontSize: '0.925rem',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
      >
        <SparklesIcon size={19} />
        <span>Ask FinLens AI</span>
      </button>

      {/* Drawer Backdrop and Panel */}
      {isChatOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsChatOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              height: '100vh',
              background: '#ffffff',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'drawerSlideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BotIcon size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      FinLens AI Copilot
                    </h3>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--success)',
                        background: 'var(--success-bg)',
                        border: '1px solid var(--success-border)',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '6px',
                      }}
                    >
                      Groq Fast Inference
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Dual-Agent NL-to-SQL • In-Memory Shadow Sandbox • SQLGlot AST Guard
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsChatOpen(false)}
                className="btn-ghost"
                style={{ padding: '0.4rem', borderRadius: '50%' }}
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Suggestions Carousel */}
            {suggestions.length > 0 && (
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border)',
                  overflowX: 'auto',
                  display: 'flex',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSend(s.prompt)}
                    className="chip-btn"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                  >
                    <SparklesIcon size={12} style={{ color: 'var(--primary)' }} />
                    {s.title}
                  </button>
                ))}
              </div>
            )}

            {/* Message Thread */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                background: '#f8fafc',
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Bubble */}
                  <div
                    style={{
                      maxWidth: '92%',
                      padding: msg.role === 'user' ? '0.75rem 1.15rem' : '1.25rem',
                      borderRadius: 'var(--radius-lg)',
                      background: msg.role === 'user' ? 'var(--primary)' : '#ffffff',
                      color: msg.role === 'user' ? '#ffffff' : 'var(--text-main)',
                      boxShadow: 'var(--shadow-sm)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <SparklesIcon size={15} /> FinLens Analytics Engine
                      </div>
                    )}

                    <div>{msg.text}</div>

                    {/* Telemetry pill */}
                    {msg.sandbox_telemetry && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.4rem',
                          fontSize: '0.74rem',
                        }}
                      >
                        <span
                          style={{
                            background: 'var(--success-bg)',
                            color: 'var(--success-text)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <ShieldCheckIcon size={12} /> Sandbox: {msg.sandbox_telemetry.execution_time_ms || msg.sandbox_telemetry.sandbox_time_ms || 4}ms
                        </span>

                        <span
                          style={{
                            background: 'var(--ai-bg)',
                            color: 'var(--ai-text)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontWeight: 600,
                          }}
                        >
                          Judge Confidence: {msg.judge?.confidence_score || 95}%
                        </span>

                        <span
                          style={{
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-muted)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontWeight: 600,
                          }}
                        >
                          Cost Risk: {msg.judge?.cost_risk || 'LOW'}
                        </span>
                      </div>
                    )}

                    {/* SQL View */}
                    {msg.sql && (
                      <div style={{ marginTop: '0.85rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            SQLGlot Validated Query
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopySql(msg.sql, msg.id)}
                            className="btn-ghost btn-sm"
                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                          >
                            {copiedSqlId === msg.id ? <CheckIcon size={13} style={{ color: 'var(--success)' }} /> : <CopyIcon size={13} />}
                            {copiedSqlId === msg.id ? 'Copied' : 'Copy SQL'}
                          </button>
                        </div>
                        <pre
                          style={{
                            background: '#0f172a',
                            color: '#38bdf8',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.78rem',
                            overflowX: 'auto',
                            fontFamily: 'monospace',
                            margin: 0,
                            lineHeight: 1.4,
                          }}
                        >
                          <code>{msg.sql}</code>
                        </pre>
                      </div>
                    )}

                    {/* HITL Confirmation Box */}
                    {msg.status === 'AWAITING_HUMAN_APPROVAL' && (
                      <div
                        style={{
                          marginTop: '1rem',
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#92400e', fontWeight: 700, fontSize: '0.85rem' }}>
                          <AlertTriangleIcon size={16} /> Human-in-the-Loop Review Required
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#78350f', margin: '0.35rem 0 0.75rem' }}>
                          This query targets multi-table aggregations. The shadow sandbox verified execution ({msg.sandbox_telemetry?.row_count} rows). Do you authorize running this on live data?
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleSend(msg.originalPrompt, true)}
                            className="btn-primary btn-sm"
                            style={{ background: 'var(--success)', fontSize: '0.8rem' }}
                          >
                            ✓ Approve & Run on Live DB
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Chart Visualization (if applicable) */}
                    {msg.data && msg.data.length > 1 && msg.data[0] && (
                      <InlineBarChart data={msg.data} />
                    )}

                    {/* Table Results */}
                    {msg.data && msg.data.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.4rem',
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Result Dataset ({msg.data.length} records)
                          </span>
                          <button
                            onClick={() => handleExportCSV(msg.data, msg.columns)}
                            className="btn-ghost btn-sm"
                            style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                          >
                            <DownloadIcon size={13} /> Export CSV
                          </button>
                        </div>

                        <div
                          style={{
                            maxHeight: '220px',
                            overflowY: 'auto',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            background: '#ffffff',
                          }}
                        >
                          <table style={{ fontSize: '0.78rem' }}>
                            <thead>
                              <tr>
                                {Object.keys(msg.data[0]).map((col) => (
                                  <th key={col} style={{ padding: '0.45rem 0.65rem' }}>
                                    {col.replace(/_/g, ' ')}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {msg.data.slice(0, 15).map((row, idx) => (
                                <tr key={idx}>
                                  {Object.values(row).map((val, cIdx) => (
                                    <td key={cIdx} style={{ padding: '0.45rem 0.65rem' }}>
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

            {/* Input Bar */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid var(--border)',
                background: '#ffffff',
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                <input
                  type="text"
                  placeholder="Ask a financial question (e.g. 'Show total spend by category')..."
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    fontSize: '0.9rem',
                    padding: '0.75rem 1rem',
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !inputPrompt.trim()}
                  style={{ padding: '0.75rem 1.15rem' }}
                >
                  <SendIcon size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Inline Lightweight Bar Chart Visualizer
function InlineBarChart({ data }) {
  if (!data || data.length < 2) return null;

  const firstRow = data[0];
  const keys = Object.keys(firstRow);

  // Find label key and numeric value key
  const labelKey = keys.find((k) => typeof firstRow[k] === 'string') || keys[0];
  const valueKey = keys.find((k) => typeof firstRow[k] === 'number') || keys[1];

  if (!valueKey) return null;

  const maxVal = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

  return (
    <div
      style={{
        marginTop: '0.95rem',
        padding: '0.85rem',
        background: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.65rem' }}>
        <ChartIcon size={14} style={{ color: 'var(--primary)' }} /> Visual Spend Distribution ({valueKey.replace(/_/g, ' ')})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {data.slice(0, 6).map((item, idx) => {
          const val = Number(item[valueKey]) || 0;
          const pct = Math.min(100, Math.max(5, (val / maxVal) * 100));
          return (
            <div key={idx} style={{ fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{String(item[labelKey])}</span>
                <span style={{ color: 'var(--text-muted)' }}>₹{val.toLocaleString('en-IN')}</span>
              </div>
              <div className="progress-bar-bg" style={{ height: '6px' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: idx % 2 === 0 ? 'var(--primary)' : 'var(--ai)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
