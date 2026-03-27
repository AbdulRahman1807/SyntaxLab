import { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import MagneticButton from './MagneticButton';

// Weighted random — all teams equal weight for now
function weightedRandom(teams) {
  if (!teams.length) return null;
  return teams[Math.floor(Math.random() * teams.length)];
}

const SLOT_HEIGHT = 56;
const VISIBLE_SLOTS = 7;

function playTick() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch(e) { /* ignore */ }
}

export default function SelectionWheel({ teams, onPicked, onReset, hasCompleted, onSpinStateChange }) {
  const [spinning, setSpinning] = useState(false);
  const [displayList, setDisplayList] = useState([]);
  const [pulse, setPulse] = useState(false);
  const [winIndex, setWinIndex] = useState(-1);
  const controls = useAnimation();
  const containerRef = useRef(null);

  async function spin() {
    if (spinning || teams.length === 0) return;
    setSpinning(true);
    if (onSpinStateChange) onSpinStateChange(true);

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
    setWinIndex(targetIndex);

    // Scroll to center on targetIndex
    const targetY = -(targetIndex * SLOT_HEIGHT) + (Math.floor(VISIBLE_SLOTS / 2) * SLOT_HEIGHT);

    // Reset position instantly
    await controls.set({ y: 0 });

    // Spin animation with custom onUpdate for tick sound
    let lastTickPosition = 0;
    
    await controls.start({
      y: targetY,
      transition: {
        duration: 4,
        ease: [0.1, 0.6, 0.2, 1],
      }
    });

    setSpinning(false);
    if (onSpinStateChange) onSpinStateChange(false);
    setPulse(true);
    setTimeout(() => {
      setPulse(false);
      if (onPicked) onPicked(winner);
    }, 1200); // Wait 1.2s to admire the pulse before moving to REVEAL
  }

  // Sync audio ticks to the actual wheel position
  const useSoundTick = (isSpinning) => {
    const lastIndex = useRef(-1);

    useEffect(() => {
      if (!isSpinning) return;
      
      let frameId;
      const checkPosition = () => {
        if (!containerRef.current) return;
        
        // Extract the translate from the computed style
        const transform = window.getComputedStyle(containerRef.current).transform;
        const matrix = new DOMMatrixReadOnly(transform);
        const currentY = matrix.m42;
        
        const currentIndex = Math.floor(Math.abs(currentY) / SLOT_HEIGHT);
        if (currentIndex !== lastIndex.current) {
          playTick();
          lastIndex.current = currentIndex;
        }
        
        frameId = requestAnimationFrame(checkPosition);
      };
      
      frameId = requestAnimationFrame(checkPosition);
      return () => cancelAnimationFrame(frameId);
    }, [isSpinning]);
  };

  useSoundTick(spinning);

  const startSpin = () => {
    spin();
  };

  const listToShow = displayList.length > 0 ? displayList : teams;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
      {/* Wheel container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          height: SLOT_HEIGHT * VISIBLE_SLOTS,
          overflow: 'hidden',
          borderRadius: 8,
          background: 'rgba(20, 20, 20, 0.4)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        {/* Gradient overlays for fade effect */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(16,16,16,0.95) 0%, transparent 40%, transparent 60%, rgba(16,16,16,0.95) 100%)'
        }} />

        {/* Center highlight */}
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0,
          height: SLOT_HEIGHT,
          transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid var(--border-bright)',
          borderBottom: '1px solid var(--border-bright)',
          zIndex: 1, pointerEvents: 'none',
          animation: pulse ? 'pulse-glow 1.2s ease-out' : 'none',
        }} />

        {/* Scrolling list */}
        <motion.div ref={containerRef} animate={controls} style={{ willChange: 'transform' }}>
          {listToShow.map((team, i) => (
            <div key={i} className={pulse && i === winIndex ? 'glitch-text' : ''} style={{
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

        {teams.length === 0 && hasCompleted ? (
          <MagneticButton
            className="btn btn-primary"
            onClick={onReset}
            style={{ fontSize: '1rem', padding: '12px 40px' }}
          >
            ↺ Reset Session
          </MagneticButton>
        ) : (
          <MagneticButton
            className="btn btn-primary"
            onClick={startSpin}
            disabled={spinning || teams.length === 0}
            style={{ fontSize: '1rem', padding: '12px 40px', opacity: teams.length === 0 ? 0.4 : 1 }}
          >
            {spinning ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                Selecting...
              </>
            ) : 'Select Team'}
          </MagneticButton>
        )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
