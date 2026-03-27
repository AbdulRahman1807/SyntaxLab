import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MagneticButton from './MagneticButton';
import { playThock } from '../utils/audio';

// --- Hexadecimal Decryptor Component ---
const CHARS = '0123456789ABCDEF!@#$%^&*()_+';
function DecryptText({ text, duration = 1200 }) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let startTime = Date.now();
    let interval = setInterval(() => {
      let elapsed = Date.now() - startTime;
      let result = '';
      for (let i = 0; i < text.length; i++) {
        let lockTime = (i / text.length) * duration;
        if (elapsed > lockTime) {
          result += text[i];
        } else if (text[i] === ' ') {
          result += ' '; // Preserve spaces immediately
        } else {
          result += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      setDisplayText(result);

      if (elapsed > duration) {
        setDisplayText(text);
        clearInterval(interval);
      }
    }, 40); // 25fps glitch loop

    return () => clearInterval(interval);
  }, [text, duration]);

  return <span>{displayText}</span>;
}

// --- Live Grid Crosshair Component ---
function CrosshairGrid() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  return (
    <div 
      style={{
        position: 'absolute', inset: 0, zIndex: 0,
        pointerEvents: 'auto', // Catches all mouse moves over the screen safely
        overflow: 'hidden',
        backgroundSize: '80px 80px', // Massive blueprint coordinates
        backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)'
      }}
      onMouseMove={(e) => setPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })}
    >
      {/* Horizontal Alignment Line */}
      <div style={{
        position: 'absolute', top: pos.y, left: 0, right: 0, height: 1,
        background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
      }} />
      {/* Vertical Alignment Line */}
      <div style={{
        position: 'absolute', left: pos.x, top: 0, bottom: 0, width: 1,
        background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
      }} />
      {/* Dynamic Activated Cell */}
      <div style={{
        position: 'absolute',
        left: Math.floor(pos.x / 80) * 80, top: Math.floor(pos.y / 80) * 80,
        width: 80, height: 80, background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        transition: 'left 0.1s linear, top 0.1s linear' // Adds slight smoothness to cell jumps
      }} />
    </div>
  );
}

// --- Faux Terminal Boot Log ---
const BOOT_LOGS = [
  "Initializing PostgreSQL connection pool...",
  "Loading schema for sandbox environment...",
  "Running core framework migrations [OK]",
  "Connecting to worker node 0x1A...",
  "Preparing volatile memory space...",
  "[{team}] Sandbox allocated successfully.",
  "System ready. Awaiting START instruction_"
];

function TerminalBootLog({ teamName }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let s = 0;
    const interval = setInterval(() => {
      s++;
      if (s <= BOOT_LOGS.length) {
        setStep(s);
        playThock();
      } else {
        clearInterval(interval);
      }
    }, 500); // Renders a new line every half second
    return () => clearInterval(interval);
  }, [teamName]);

  return (
    <div style={{
      position: 'absolute', bottom: 40, left: 40,
      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem',
      color: 'rgba(255,255,255,0.4)', textAlign: 'left', zIndex: 10, pointerEvents: 'none'
    }}>
      {BOOT_LOGS.slice(0, step).map((log, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <span style={{ color: 'rgba(0, 255, 150, 0.6)', marginRight: 8 }}>{`>`}</span>
          {log.replace('{team}', teamName)}
          {i === step - 1 && i !== BOOT_LOGS.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              style={{ display: 'inline-block', width: 8, height: 14, background: 'rgba(255,255,255,0.5)', marginLeft: 4, verticalAlign: 'middle' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// --- Main Assembly ---
export default function RevealScreen({ teamName, onStartLab, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Component Layers */}
      <CrosshairGrid />
      <TerminalBootLog teamName={teamName} />

      {/* Front-and-Center Content */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '0 32px', zIndex: 10, pointerEvents: 'none' }}>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: 16,
          }}
        >
          Allocating Resources For:
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 180, damping: 16 }}
          style={{
            fontSize: 'clamp(3rem, 10vw, 6rem)',
            fontWeight: 900,
            color: 'var(--text-primary)',
            letterSpacing: '0.05em', // Spread out slightly for terminal block styling
            lineHeight: 1.1,
            marginBottom: 48,
            fontFamily: 'JetBrains Mono, monospace' // Makes the decoding perfectly monospaced
          }}
        >
          {/* Inject Hexadecimal Decoding Here */}
          <DecryptText text={teamName} duration={1400} />
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }} // Delayed so it pops in right as the final boot logs finish
          style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', pointerEvents: 'auto' }}
        >
          <MagneticButton
            className="btn btn-success"
            onClick={onStartLab}
            style={{ fontSize: '1.1rem', padding: '14px 48px' }}
          >
            Start Lab
          </MagneticButton>
          <MagneticButton
            className="btn btn-ghost"
            onClick={onBack}
            style={{ fontSize: '1rem', padding: '14px 28px' }}
          >
            Cancel Selection
          </MagneticButton>
        </motion.div>
      </div>
    </div>
  );
}
