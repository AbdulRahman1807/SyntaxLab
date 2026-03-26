import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeamManager({ activeTeams, completedTeams, onAdd, onDelete, onReset }) {
  const [input, setInput] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!input.trim()) return;
    onAdd(input);
    setInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Add team form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
        <input
          className="input-field"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a team..."
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          + Add
        </button>
      </form>

      {/* Active teams */}
      <div>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Active ({activeTeams.length})
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {activeTeams.length === 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No active teams</span>
          )}
          <AnimatePresence>
            {activeTeams.map(team => (
              <motion.span 
                key={team}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="team-chip" 
                style={{ cursor: 'default' }}
              >
                {team}
                <button
                  onClick={() => onDelete(team)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', fontSize: '0.9rem',
                    lineHeight: 1, padding: '0 0 0 4px', opacity: 0.7
                  }}
                  title="Remove team"
                >×</button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Completed teams */}
      {completedTeams.length > 0 && (
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Completed ({completedTeams.length})
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <AnimatePresence>
              {completedTeams.map(team => (
                <motion.span 
                  key={team} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="team-chip done"
                >
                  {team}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Reset */}
      {completedTeams.length > 0 && (
        <button className="btn btn-ghost" onClick={onReset} style={{ alignSelf: 'flex-start' }}>
          ↺ Reset Session
        </button>
      )}
    </div>
  );
}
