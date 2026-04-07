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

// --- Wave Squares Grid Component (Canvas) ---
function WaveSquaresGrid() {
  const canvasRef = React.useRef(null);
  const mouseRef = React.useRef({ x: -1000, y: -1000 });
  const ripplesRef = React.useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const size = 50; // Grid cell spacing
    const maxSize = 34; // Maximum size of a square

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.ceil(canvas.width / size) + 2;
      const rows = Math.ceil(canvas.height / size) + 2;

      // Update outgoing ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += 8; // wave expansion speed
        r.life -= 0.015; // wave dissipation
        if (r.life <= 0) ripplesRef.current.splice(i, 1);
      }

      // Draw squares
      for (let y = -1; y < rows; y++) {
        for (let x = -1; x < cols; x++) {
          const cx = x * size + size / 2;
          const cy = y * size + size / 2;

          // 1. Natural Sloshing Physics
          const wave1 = Math.sin(time * 0.8 + x * 0.1 + y * 0.15);
          const wave2 = Math.cos(time * 0.5 - x * 0.2 + y * 0.1);
          const wave3 = Math.sin(time * 0.4 + x * 0.05 - y * 0.2);
          const slosh = (wave1 + wave2 + wave3) / 3; // Normalize from -1 to 1

          let scale = 0.2 + slosh * 0.15; // Base continuous breathing
          let brightness = 0.05 + ((slosh + 1) / 2) * 0.1;

          // 2. Cursor Proximity Glow
          const dx = mouseRef.current.x - cx;
          const dy = mouseRef.current.y - cy;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          if (distToMouse < 200) {
            const effect = 1 - (distToMouse / 200);
            scale += effect * 0.3;
            brightness += effect * 0.4;
          }

          // 3. Outgoing Cursor Ripples ("Waves of Brightness")
          for (const r of ripplesRef.current) {
            const rdx = r.x - cx;
            const rdy = r.y - cy;
            const distToRipple = Math.sqrt(rdx * rdx + rdy * rdy);
            
            // Influence ring around the expanding radius
            const ringDist = Math.abs(distToRipple - r.radius);
            if (ringDist < 80) {
              const effect = (1 - (ringDist / 80)) * r.life;
              scale += effect * 0.6;
              brightness += effect * 0.7;
            }
          }

          // Clamp values
          scale = Math.min(Math.max(scale, 0.05), 1);
          brightness = Math.min(Math.max(brightness, 0.01), 1);

          const finalSize = maxSize * scale;

          ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
          ctx.beginPath();
          
          // Draw standard squares, centered perfectly
          ctx.rect(cx - finalSize / 2, cy - finalSize / 2, finalSize, finalSize);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    
    // Add a ripple if the mouse moves far enough or if it's the first move
    if (mouseRef.current.x === -1000) {
      ripplesRef.current.push({ x: clientX, y: clientY, radius: 0, life: 1 });
    } else {
      const dx = clientX - mouseRef.current.x;
      const dy = clientY - mouseRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 40) { 
        ripplesRef.current.push({ x: clientX, y: clientY, radius: 0, life: 1 });
      }
    }
    
    mouseRef.current = { x: clientX, y: clientY };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000 };
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'auto',
      }}
    />
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
      <WaveSquaresGrid />
      <TerminalBootLog teamName={teamName} />

      {/* Front-and-Center Content */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '0 32px', zIndex: 10, pointerEvents: 'none', mixBlendMode: 'difference' }}>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#fff',
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
            color: '#fff',
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
