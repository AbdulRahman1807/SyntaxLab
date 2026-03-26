import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export default function Workspace({ teamName, onExit }) {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [tables, setTables] = useState([]);
  const [query, setQuery] = useState('-- Write your SQL here\nSELECT 1;');
  const [result, setResult] = useState(null); // { columns, rows, stats } | { error }
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(false);
  const editorRef = useRef(null);

  // Load databases on mount
  useEffect(() => {
    axios.get('/api/databases')
      .then(res => {
        setDatabases(res.data);
        if (res.data.length > 0) setSelectedDb(res.data[0]);
      })
      .catch(err => {
        setDatabases([]);
        console.error('Failed to load databases:', err);
      })
      .finally(() => setDbLoading(false));
  }, []);

  // Load tables when selectedDb changes
  useEffect(() => {
    if (!selectedDb) return;
    setTablesLoading(true);
    setTables([]);
    axios.get(`/api/tables/${selectedDb}`)
      .then(res => setTables(res.data))
      .catch(() => setTables([]))
      .finally(() => setTablesLoading(false));
  }, [selectedDb]);

  const executeQuery = useCallback(async () => {
    if (!query.trim() || !selectedDb) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post('/api/execute', { dbName: selectedDb, query });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  }, [query, selectedDb]);

  // Ctrl+Enter shortcut
  function handleEditorKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  }

  // Insert table name into editor on click
  function insertTable(tableName) {
    setQuery(prev => prev + `\nSELECT * FROM ${tableName} LIMIT 50;`);
    editorRef.current?.focus();
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>
      {/* ===== SIDEBAR ===== */}
      <aside style={{
        width: 260,
        minWidth: 220,
        maxWidth: 300,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 18px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-panel)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{
              fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700,
            }}>SyntaxLab</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px',
            background: 'var(--bg-elevated)', borderRadius: 6,
            border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Team</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{teamName}</span>
          </div>
        </div>

        {/* Database selector */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Database
          </label>
          {dbLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>
          ) : databases.length === 0 ? (
            <div style={{ color: 'var(--accent-error)', fontSize: '0.75rem' }}>No DB connection</div>
          ) : (
            <div style={{ position: 'relative' }}>
              <select
                className="select-field"
                value={selectedDb}
                onChange={e => setSelectedDb(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              >
                {databases.map(db => (
                  <option key={db} value={db}>{db}</option>
                ))}
              </select>
              <span style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none', fontSize: '0.8rem'
              }}>▾</span>
            </div>
          )}
        </div>

        {/* Schema explorer */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Tables
          </label>
          {tablesLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading schema...</div>
          ) : tables.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No tables found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {tables.map(table => (
                <button
                  key={table}
                  onClick={() => insertTable(table)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', padding: '6px 10px', borderRadius: 6,
                    color: 'var(--text-secondary)', fontSize: '0.82rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { e.target.style.background = 'var(--bg-elevated)'; e.target.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = 'var(--text-secondary)'; }}
                  title="Click to insert SELECT"
                >
                  <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>⊞</span>
                  {table}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Exit to Lobby */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={onExit} style={{ width: '100%', fontSize: '0.8rem' }}>
            ← Back to Lobby
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {selectedDb ? (
              <><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedDb}</span> · SQL Editor</>
            ) : 'No database selected'}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ctrl+Enter to run</span>
          <button
            className="btn btn-primary"
            onClick={executeQuery}
            disabled={loading || !selectedDb}
            style={{ padding: '7px 20px', fontSize: '0.85rem' }}
          >
            {loading ? '⏳ Running...' : '▶ Run Query'}
          </button>
        </div>

        {/* Editor area */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}>
          <textarea
            ref={editorRef}
            className="mono input-field"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleEditorKeyDown}
            rows={8}
            spellCheck={false}
            style={{
              resize: 'vertical',
              minHeight: 120,
              fontSize: '0.9rem',
              lineHeight: 1.7,
              tabSize: 2,
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: '#e6edf3',
              padding: '14px 16px',
            }}
          />
        </div>

        {/* Results area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {!result && !loading && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: 'var(--text-muted)', gap: 12,
            }}>
              <span style={{ fontSize: 40, opacity: 0.3 }}>⌨</span>
              <p style={{ fontSize: '0.9rem' }}>Write a query and press <kbd style={{ background: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 4, fontSize: '0.8rem', border: '1px solid var(--border-bright)' }}>Ctrl+Enter</kbd> to execute</p>
            </div>
          )}

          {loading && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: 20 }}>
              Executing query...
            </div>
          )}

          {result?.error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: 'var(--accent-error)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  ✗ Error
                </span>
              </div>
              <pre className="mono" style={{
                color: '#fca5a5', fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0
              }}>
                {result.error}
              </pre>
            </div>
          )}

          {result && !result.error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Stats bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '8px 14px',
                background: 'var(--bg-panel)', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: '0.78rem',
              }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Success</span>
                <span style={{ color: 'var(--text-muted)' }}>Rows: <strong style={{ color: 'var(--text-primary)' }}>{result.rows?.length ?? 0}</strong></span>
                <span style={{ color: 'var(--text-muted)' }}>Time: <strong style={{ color: 'var(--text-primary)' }}>{result.stats?.time}</strong></span>
              </div>

              {/* Results table */}
              {result.columns?.length > 0 ? (
                <div style={{ overflow: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <table style={{
                    width: '100%', borderCollapse: 'collapse',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem',
                  }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-panel)' }}>
                        {result.columns.map(col => (
                          <th key={col} style={{
                            padding: '10px 14px', textAlign: 'left', fontWeight: 500,
                            color: 'var(--text-secondary)', fontSize: '0.78rem',
                            borderBottom: '1px solid var(--border)',
                            letterSpacing: '0.04em', whiteSpace: 'nowrap',
                          }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, ri) => (
                        <tr key={ri} style={{
                          background: ri % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-panel)',
                          transition: 'background 0.1s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                          onMouseLeave={e => e.currentTarget.style.background = ri % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-panel)'}
                        >
                          {result.columns.map(col => (
                            <td key={col} style={{
                              padding: '9px 14px', color: 'var(--text-secondary)',
                              borderBottom: '1px solid var(--border)',
                              maxWidth: 320, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {row[col] === null
                                ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>
                                : String(row[col])
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.rows.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Query returned 0 rows
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Command executed successfully (no result set)
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
