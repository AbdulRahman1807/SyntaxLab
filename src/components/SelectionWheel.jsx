import { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

// Weighted random — all teams equal weight for now
function weightedRandom(teams) {
  if (!teams.length) return null;
  return teams[Math.floor(Math.random() * teams.length)];
}

const SLOT_HEIGHT = 56;
const VISIBLE_SLOTS = 7;

export default function SelectionWheel({ teams, onPicked }) {
  const [spinning, setSpinning] = useState(false);
  const [displayList, setDisplayList] = useState(teams);
  const controls = useAnimation();
  const containerRef = useRef(null);

  async function spin() {
    if (spinning || teams.length === 0) return;
    setSpinning(true);

    const winner = weightedRandom(teams);
    // Build a long padded list so wheel scrolls through many slots
    const repeats = 40;
    const extended = [];
    for (let i = 0; i < repeats; i++) {
      extended.push(...teams);
    }
    // Force the winner at a certain position near the end
    const targetIndex = Math.floor(repeats * teams.length * 0.8) + teams.indexOf(winner);
    extended.splice(targetIndex, 1, winner);
    setDisplayList(extended);

    // Scroll to center on targetIndex
    const targetY = -(targetIndex * SLOT_HEIGHT) + (Math.floor(VISIBLE_SLOTS / 2) * SLOT_HEIGHT);

    // Reset position instantly
    await controls.set({ y: 0 });

    // Spin animation
    await controls.start({
      y: targetY,
      transition: {
        duration: 3.2,
        ease: [0.1, 0.6, 0.4, 1],
      }
    });

    setSpinning(false);
    if (onPicked) onPicked(winner);
  }

  const listToShow = displayList.length > 0 ? displayList : teams;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {/* Wheel container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 340,
          height: SLOT_HEIGHT * VISIBLE_SLOTS,
          overflow: 'hidden',
          borderRadius: 16,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Gradient overlays for fade effect */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, var(--bg-panel) 0%, transparent 30%, transparent 70%, var(--bg-panel) 100%)'
        }} />

        {/* Center highlight */}
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0,
          height: SLOT_HEIGHT,
          transform: 'translateY(-50%)',
          background: 'rgba(99,102,241,0.12)',
          borderTop: '1px solid rgba(99,102,241,0.5)',
          borderBottom: '1px solid rgba(99,102,241,0.5)',
          zIndex: 1, pointerEvents: 'none',
        }} />

        {/* Scrolling list */}
        <motion.div ref={containerRef} animate={controls} style={{ willChange: 'transform' }}>
          {listToShow.map((team, i) => (
            <div key={i} style={{
              height: SLOT_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.02em',
              userSelect: 'none',
            }}>
              {team}
            </div>
          ))}
        </motion.div>

        {/* Empty state */}
        {teams.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: '0.9rem', zIndex: 3
          }}>
            No active teams
          </div>
        )}
      </div>

      {/* Spin button */}
      <motion.button
        className="btn btn-primary"
        onClick={spin}
        disabled={spinning || teams.length === 0}
        style={{ fontSize: '1rem', padding: '12px 40px', opacity: teams.length === 0 ? 0.4 : 1 }}
        whileHover={!spinning && teams.length > 0 ? { scale: 1.04 } : {}}
        whileTap={!spinning && teams.length > 0 ? { scale: 0.97 } : {}}
      >
        {spinning ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
            Spinning...
          </>
        ) : '🎲 Spin the Wheel'}
      </motion.button>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
