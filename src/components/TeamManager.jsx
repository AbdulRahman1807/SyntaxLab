import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from './MagneticButton';
import { playThock } from '../utils/audio';

export default function TeamManager({ activeTeams, completedTeams, onAdd, onAddMultiple, onDelete, onReset, onClearAll, disabled }) {
  const [input, setInput] = useState('');
  const [nInput, setNInput] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!input.trim()) return;
    playThock();
    onAdd(input);
    setInput('');
  }

  function handleAddMultiple(e) {
    e.preventDefault();
    const n = parseInt(nInput, 10);
    if (isNaN(n) || n < 1) return;
    playThock();
    const teamsToGenerate = Array.from({ length: n }, (_, i) => `Team ${i + 1}`);
    onAddMultiple(teamsToGenerate);
    setNInput('');
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
        <MagneticButton type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={disabled}>
          + Add
        </MagneticButton>
      </form>

      {/* Bulk Generate */}
      <form onSubmit={handleAddMultiple} style={{ display: 'flex', gap: 8 }}>
        <input
          className="input-field"
          type="number"
          min="1"
          max="100"
          value={nInput}
          onChange={e => setNInput(e.target.value)}
          placeholder="e.g. 10"
          style={{ width: 100 }}
        />
        <MagneticButton type="submit" className="btn btn-ghost" style={{ whiteSpace: 'nowrap', flex: 1 }} disabled={disabled}>
          + Generate Teams
        </MagneticButton>
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
                layout
                key={team}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="team-chip" 
                style={{ cursor: 'default' }}
              >
                {team}
                <button
                  onClick={() => { if (!disabled) { playThock(); onDelete(team); } }}
                  disabled={disabled}
                  style={{
                    background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                    color: 'var(--text-secondary)', fontSize: '0.9rem',
                    lineHeight: 1, padding: '0 0 0 4px', opacity: disabled ? 0.3 : 0.7
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
                  layout
                  key={team} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                  className="team-chip done"
                >
                  {team}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Reset & Clear */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {completedTeams.length > 0 && (
          <MagneticButton className="btn btn-ghost" onClick={onReset} style={{ flex: 1 }} disabled={disabled}>
            ↺ Reset Session
          </MagneticButton>
        )}
        {(activeTeams.length > 0 || completedTeams.length > 0) && (
          <MagneticButton className="btn btn-danger" onClick={onClearAll} style={{ flex: 1 }} disabled={disabled}>
            ✖ Clear All
          </MagneticButton>
        )}
      </div>
    </div>
  );
}
