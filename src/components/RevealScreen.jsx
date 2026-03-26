import { motion } from 'framer-motion';

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
      {/* Radial glow background */}
      <div style={{
        position: 'absolute',
        width: 700,
        height: 700,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Animated ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'backOut' }}
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          borderRadius: '50%',
          border: '2px solid rgba(99,102,241,0.3)',
          pointerEvents: 'none',
        }}
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'backOut', delay: 0.1 }}
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.15)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '0 32px' }}>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            marginBottom: 16,
          }}
        >
          🎉 Selected Team
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 180, damping: 16 }}
          style={{
            fontSize: 'clamp(3rem, 10vw, 6rem)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #a5b4fc, #818cf8, #c4b5fd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: 48,
          }}
        >
          {teamName}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <button
            className="btn btn-success"
            onClick={onStartLab}
            style={{ fontSize: '1.1rem', padding: '14px 48px' }}
          >
            🚀 Start Lab
          </button>
          <button
            className="btn btn-ghost"
            onClick={onBack}
            style={{ fontSize: '1rem', padding: '14px 28px' }}
          >
            ← Back to Lobby
          </button>
        </motion.div>
      </div>
    </div>
  );
}
