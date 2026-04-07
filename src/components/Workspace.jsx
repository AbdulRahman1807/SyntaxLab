import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// High-performance Canvas Background
function WorkspaceBackground({ isRunning }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    // Wait for layout
    setTimeout(resize, 0);
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: 0.3 + Math.random() * 0.7,
      size: 1 + Math.random() * 1.5,
      flash: Math.random() * 100
    }));

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Faint isometric/dotted background grid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      const spacing = 40;
      for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Flowing data packets
      particles.forEach(p => {
        p.y += isRunning ? p.speed * 4 : p.speed * 1;
        if (p.y > canvas.height + 50) {
          p.y = -50;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        if (isRunning) {
          // Soft ambient pulse when running
          ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + (Math.sin(time * p.speed * 10) * 0.15)})`;
          ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
        } else {
          // Idling small dust
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
      });

      frameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, [isRunning]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

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

  // Load databases
  const refreshDatabases = useCallback(() => {
    setDbLoading(true);
    axios.get('/api/databases')
      .then(res => {
        setDatabases(res.data);
        // Only select the first database if the current one was dropped or doesn't exist
        setSelectedDb(prev => {
          if (prev && res.data.includes(prev)) return prev;
          return res.data.length > 0 ? res.data[0] : '';
        });
      })
      .catch(err => {
        setDatabases([]);
        console.error('Failed to load databases:', err);
      })
      .finally(() => setDbLoading(false));
  }, []);

  useEffect(() => {
    refreshDatabases();
  }, [refreshDatabases]);

  const refreshTables = useCallback(() => {
    if (!selectedDb) return;
    setTablesLoading(true);
    setTables([]);
    axios.get(`/api/tables/${selectedDb}`)
      .then(res => setTables(res.data))
      .catch(() => setTables([]))
      .finally(() => setTablesLoading(false));
  }, [selectedDb]);

  // Load tables when selectedDb changes
  useEffect(() => {
    refreshTables();
  }, [refreshTables]);

  const isDDL = (q) => {
    const upper = q.trim().toUpperCase();
    return upper.startsWith('CREATE ') || upper.startsWith('ALTER ') || upper.startsWith('DROP ') || upper.startsWith('RENAME ');
  };

  const uppercaseKeywords = (text) => {
    const keywords = new Set(['ABORT', 'ABSOLUTE', 'ACCESS', 'ACTION', 'ADD', 'ADMIN', 'AFTER', 'AGGREGATE', 'ALL', 'ALSO', 'ALTER', 'ALWAYS', 'ANALYSE', 'ANALYZE', 'AND', 'ANY', 'ARRAY', 'AS', 'ASC', 'ASSERTION', 'ASSIGNMENT', 'ASYMMETRIC', 'AT', 'AUTHORIZATION', 'BACKWARD', 'BEFORE', 'BEGIN', 'BETWEEN', 'BIGINT', 'BINARY', 'BIT', 'BOOLEAN', 'BOTH', 'BY', 'CACHE', 'CALLED', 'CASCADE', 'CASCADED', 'CASE', 'CAST', 'CATALOG', 'CHAIN', 'CHAR', 'CHARACTER', 'CHARACTERISTICS', 'CHECK', 'CHECKPOINT', 'CLASS', 'CLOSE', 'CLUSTER', 'COALESCE', 'COLLATE', 'COLLATION', 'COLUMN', 'COMMENT', 'COMMENTS', 'COMMIT', 'COMMITTED', 'CONCURRENTLY', 'CONFIGURATION', 'CONNECTION', 'CONSTRAINT', 'CONSTRAINTS', 'CONTENT', 'CONTINUE', 'CONVERSION', 'COPY', 'COST', 'CREATE', 'CROSS', 'CSV', 'CUBE', 'CURRENT', 'CURRENT_CATALOG', 'CURRENT_DATE', 'CURRENT_ROLE', 'CURRENT_SCHEMA', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CURRENT_USER', 'CURSOR', 'CYCLE', 'DATA', 'DATABASE', 'DAY', 'DEALLOCATE', 'DEC', 'DECIMAL', 'DECLARE', 'DEFAULT', 'DEFAULTS', 'DEFERRABLE', 'DEFERRED', 'DEFINER', 'DELETE', 'DELIMITER', 'DELIMITERS', 'DESC', 'DICTIONARY', 'DISABLE', 'DISCARD', 'DISTINCT', 'DO', 'DOCUMENT', 'DOMAIN', 'DOUBLE', 'DROP', 'EACH', 'ELSE', 'ENABLE', 'ENCODING', 'ENCRYPTED', 'END', 'ENUM', 'ESCAPE', 'EVENT', 'EXCEPT', 'EXCLUDE', 'EXCLUDING', 'EXCLUSIVE', 'EXECUTE', 'EXISTS', 'EXPLAIN', 'EXTENSION', 'EXTERNAL', 'EXTRACT', 'FALSE', 'FAMILY', 'FETCH', 'FILTER', 'FIRST', 'FLOAT', 'FOLLOWING', 'FOR', 'FORCE', 'FOREIGN', 'FORWARD', 'FREEZE', 'FROM', 'FULL', 'FUNCTION', 'FUNCTIONS', 'GLOBAL', 'GRANT', 'GRANTED', 'GREATEST', 'GROUP', 'GROUPING', 'HANDLER', 'HAVING', 'HEADER', 'HOLD', 'HOUR', 'IDENTITY', 'IF', 'ILIKE', 'IMMEDIATE', 'IMMUTABLE', 'IMPLICIT', 'IMPORT', 'IN', 'INCLUDING', 'INCREMENT', 'INDEX', 'INDEXES', 'INHERIT', 'INHERITS', 'INITIALLY', 'INLINE', 'INNER', 'INOUT', 'INPUT', 'INSENSITIVE', 'INSERT', 'INSTEAD', 'INT', 'INTEGER', 'INTERSECT', 'INTERVAL', 'INTO', 'INVOKER', 'IS', 'ISNULL', 'ISOLATION', 'JOIN', 'KEY', 'LABEL', 'LANGUAGE', 'LARGE', 'LAST', 'LATERAL', 'LEADING', 'LEAKPROOF', 'LEAST', 'LEFT', 'LEVEL', 'LIKE', 'LIMIT', 'LISTEN', 'LOAD', 'LOCAL', 'LOCALTIME', 'LOCALTIMESTAMP', 'LOCATION', 'LOCK', 'LOCKED', 'LOGGED', 'MAPPING', 'MATCH', 'MATERIALIZED', 'MAXVALUE', 'MINUTE', 'MINVALUE', 'MODE', 'MONTH', 'MOVE', 'NAME', 'NAMES', 'NATIONAL', 'NATURAL', 'NCHAR', 'NEXT', 'NO', 'NONE', 'NOT', 'NOTHING', 'NOTIFY', 'NOTNULL', 'NOWAIT', 'NULL', 'NULLIF', 'NULLS', 'NUMERIC', 'OBJECT', 'OF', 'OFF', 'OFFSET', 'OIDS', 'ON', 'ONLY', 'OPERATOR', 'OPTION', 'OPTIONS', 'OR', 'ORDER', 'ORDINALITY', 'OUT', 'OUTER', 'OVER', 'OVERLAPS', 'OVERLAY', 'OWNED', 'OWNER', 'PARSER', 'PARTIAL', 'PARTITION', 'PASSING', 'PASSWORD', 'PLACING', 'PLANS', 'POLICY', 'POSITION', 'PRECEDING', 'PRECISION', 'PREPARE', 'PREPARED', 'PRESERVE', 'PRIMARY', 'PRIOR', 'PRIVILEGES', 'PROCEDURAL', 'PROCEDURE', 'PROGRAM', 'QUOTE', 'RANGE', 'READ', 'REAL', 'REASSIGN', 'RECHECK', 'RECURSIVE', 'REF', 'REFERENCES', 'REFERENCING', 'REFRESH', 'REINDEX', 'RELATIVE', 'RELEASE', 'RENAME', 'REPEATABLE', 'REPLACE', 'REPLICA', 'RESET', 'RESTART', 'RESTRICT', 'RETURNING', 'RETURNS', 'REVOKE', 'RIGHT', 'ROLE', 'ROLLBACK', 'ROLLUP', 'ROW', 'ROWS', 'RULE', 'SAVEPOINT', 'SCHEMA', 'SCROLL', 'SEARCH', 'SECOND', 'SECURITY', 'SELECT', 'SEQUENCE', 'SEQUENCES', 'SERIALIZABLE', 'SERVER', 'SESSION', 'SESSION_USER', 'SET', 'SETOF', 'SETS', 'SHARE', 'SHOW', 'SIMILAR', 'SIMPLE', 'SMALLINT', 'SNAPSHOT', 'SOME', 'SQL', 'STABLE', 'STANDALONE', 'START', 'STATEMENT', 'STATISTICS', 'STDIN', 'STDOUT', 'STORAGE', 'STRICT', 'STRIP', 'SUBSTRING', 'SYMMETRIC', 'SYSID', 'SYSTEM', 'TABLE', 'TABLES', 'TABLESPACE', 'TEMP', 'TEMPLATE', 'TEMPORARY', 'TEXT', 'THEN', 'TIME', 'TIMESTAMP', 'TO', 'TRAILING', 'TRANSACTION', 'TRANSFORM', 'TREAT', 'TRIGGER', 'TRIM', 'TRUE', 'TRUNCATE', 'TRUSTED', 'TYPE', 'TYPES', 'UNBOUNDED', 'UNCOMMITTED', 'UNENCRYPTED', 'UNION', 'UNIQUE', 'UNKNOWN', 'UNLISTEN', 'UNLOGGED', 'UNTIL', 'UPDATE', 'USER', 'USING', 'VACUUM', 'VALID', 'VALIDATE', 'VALIDATOR', 'VALUE', 'VALUES', 'VARCHAR', 'VARIADIC', 'VARYING', 'VERBOSE', 'VERSION', 'VIEW', 'VIEWS', 'VOLATILE', 'WHEN', 'WHERE', 'WINDOW', 'WITH', 'WITHIN', 'WITHOUT', 'WORK', 'WRAPPER', 'WRITE', 'XML', 'XMLATTRIBUTES', 'XMLCONCAT', 'XMLELEMENT', 'XMLEXISTS', 'XMLFOREST', 'XMLPARSE', 'XMLPI', 'XMLROOT', 'XMLSERIALIZE', 'YEAR', 'YES', 'ZONE']);
    const words = text.split(/(\s+|[(),;])/);
    return words.map((word, index) => {
      const upper = word.toUpperCase();
      if (keywords.has(upper)) {
        // Wait until the user finishes the word (by hitting space/punctuation)
        // If it's the very last token in the array, they are currently still typing it
        if (index === words.length - 1) {
          return word;
        }
        return upper;
      }
      return word;
    }).join('');
  };

  const executeQuery = useCallback(async () => {
    if (!query.trim() || !selectedDb) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post('/api/execute', { dbName: selectedDb, query });
      setResult(res.data);
      
      const upperQ = query.trim().toUpperCase();
      if (upperQ.includes('CREATE DATABASE') || upperQ.includes('DROP DATABASE')) {
        refreshDatabases();
      }
      
      if (isDDL(query)) {
        refreshTables();
      }
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  }, [query, selectedDb, refreshTables, refreshDatabases]);

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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <WorkspaceBackground isRunning={loading} />
        
        {/* Child components need z-index up to sit above canvas */}
        {/* Toolbar */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'relative',
          zIndex: 2,
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
          position: 'relative',
          zIndex: 2,
        }}>
          <textarea
            ref={editorRef}
            className={`mono input-field editor-glow ${loading ? 'is-running' : result?.error ? 'is-error' : result && !result.error ? 'is-success' : ''}`}
            value={query}
            onChange={e => {
              setResult(null); // Clear success state so neon re-triggers
              setQuery(uppercaseKeywords(e.target.value));
            }}
            onKeyDown={handleEditorKeyDown}
            rows={8}
            spellCheck={false}
            style={{
              width: '100%',
              resize: 'vertical',
              minHeight: 120,
              fontSize: '0.9rem',
              lineHeight: 1.7,
              tabSize: 2,
              background: 'var(--bg-base)',
              borderRadius: 10,
              color: '#e6edf3',
              padding: '14px 16px',
            }}
          />
        </div>

        {/* Results area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20, position: 'relative', zIndex: 2 }}>
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
                        <tr key={ri} 
                          className="results-table-row"
                          style={{
                            background: ri % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-panel)',
                            animationDelay: `${ri * 0.03}s` // staggered entry cascade
                          }}
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

        {/* Keyboard Shortcuts Footer */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-panel)',
          borderTop: '1px solid var(--border)',
        }}>
          <div className="shortcuts-bar">
            <div className="shortcut-item">
              <span className="shortcut-key">⌘</span>
              <span className="shortcut-key">Enter</span>
              <span>Run query</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">Tab</span>
              <span>Auto-indent</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">⌘</span>
              <span className="shortcut-key">K</span>
              <span>Quick format SQL</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">Esc</span>
              <span>Cancel selection</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
