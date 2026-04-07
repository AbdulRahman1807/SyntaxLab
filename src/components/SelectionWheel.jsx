import { useState, useRef, useCallback, useEffect } from 'react';
import MagneticButton from './MagneticButton';

// Weighted random — all teams equal weight
function weightedRandom(teams) {
  if (!teams.length) return null;
  return teams[Math.floor(Math.random() * teams.length)];
}

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
  } catch (e) { /* ignore */ }
}

// Easing function: smoother deceleration curve
function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

export default function SelectionWheel({ teams, onPicked, onReset, hasCompleted, onSpinStateChange }) {
  const [spinning, setSpinning] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [rotation, setRotation] = useState(0);
  const [settled, setSettled] = useState(false);
  const [winner, setWinner] = useState(null);
  const animFrameRef = useRef(null);
  const cardRef = useRef(null);

  // Show first team name on idle
  useEffect(() => {
    if (!spinning && teams.length > 0 && !winner) {
      setFrontText(teams[0]);
      setRotation(0);
    }
  }, [teams, spinning, winner]);

  // Determine which face is currently visible based on rotation
  const isFrontVisible = useCallback(() => {
    const normalized = ((rotation % 360) + 360) % 360;
    return normalized < 90 || normalized >= 270;
  }, [rotation]);

  const spin = useCallback(() => {
    if (spinning || teams.length === 0) return;

    setSpinning(true);
    setSettled(false);
    setWinner(null);
    if (onSpinStateChange) onSpinStateChange(true);

    const chosenWinner = weightedRandom(teams);

    // Build a sequence of teams to flip through backwards to guarantee no consecutive duplicates
    const totalFlips = 20 + Math.floor(Math.random() * 10);
    const sequence = new Array(totalFlips);
    sequence[totalFlips - 1] = chosenWinner;

    for (let i = totalFlips - 2; i >= 0; i--) {
      let candidates = teams;
      if (teams.length > 1) {
        // Prevent next flip object from being identical
        candidates = candidates.filter(t => t !== sequence[i + 1]);
      }
      sequence[i] = candidates[Math.floor(Math.random() * candidates.length)];
    }

    const totalDuration = 6000; // 6 seconds for slower animation
    let flipIndex = 0;
    let startTime = null;

    // Initialize faces
    setFrontText(sequence[0]);
    setBackText(sequence[1] || sequence[0]);
    setRotation(0);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      // How many flips should have happened by now (eased)
      const easedProgress = easeOutQuint(progress);
      const targetFlipIndex = Math.floor(easedProgress * totalFlips);

      // Process any new flips
      while (flipIndex < targetFlipIndex && flipIndex < totalFlips) {
        flipIndex++;
        playTick();

        const currentTeam = sequence[Math.min(flipIndex, sequence.length - 1)];
        const nextTeam = sequence[Math.min(flipIndex + 1, sequence.length - 1)];

        // Alternate which face shows the current team
        if (flipIndex % 2 === 0) {
          setFrontText(currentTeam);
          setBackText(nextTeam);
        } else {
          setBackText(currentTeam);
          setFrontText(nextTeam);
        }
      }

      // Smoothly interpolate rotation between flips
      const exactFlip = easedProgress * totalFlips;
      setRotation(exactFlip * 180);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Landed — ensure final state
        const finalRotation = totalFlips * 180;
        setRotation(finalRotation);

        // Make sure the winner is visible on the correct face
        if (totalFlips % 2 === 0) {
          setFrontText(chosenWinner);
        } else {
          setBackText(chosenWinner);
        }

        // Settle bounce
        setSettled(true);
        setWinner(chosenWinner);
        setSpinning(false);
        if (onSpinStateChange) onSpinStateChange(false);

        // Trigger onPicked after admiring
        setTimeout(() => {
          setSettled(false);
          if (onPicked) onPicked(chosenWinner);
        }, 1400);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [spinning, teams, onPicked, onSpinStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const hasTeams = teams.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
      {/* Rolodex card wrapper */}
      <div className="rolodex-perspective" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div
          ref={cardRef}
          className={`rolodex-card ${settled ? 'rolodex-settle' : ''}`}
          style={{
            transform: `rotateX(${rotation}deg)`,
            transition: spinning ? 'none' : 'transform 0.3s ease',
          }}
        >
          {/* Front face */}
          <div className={`rolodex-face ${winner && settled ? 'rolodex-winner' : ''}`}>
            {hasTeams ? (
              <span>{frontText}</span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 400 }}>
                No active teams
              </span>
            )}

            {/* Subtle horizontal lines for depth */}
            <div style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)'
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)'
            }} />
          </div>

          {/* Back face */}
          <div className={`rolodex-face rolodex-face--back ${winner && settled ? 'rolodex-winner' : ''}`}>
            <span>{backText}</span>

            <div style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)'
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)'
            }} />
          </div>
        </div>
      </div>

      {/* Subtle reflection beneath card */}
      <div style={{
        width: '60%',
        maxWidth: 240,
        height: 20,
        background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)',
        marginTop: -16,
        pointerEvents: 'none',
      }} />

      {/* Action button */}
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
          onClick={spin}
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
