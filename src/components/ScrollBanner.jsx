import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY',
  'LIMIT', 'JOIN', 'ON', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'
];

const SNIPPETS = {
  'SELECT': 'Retrieve specific data columns', 'FROM': 'Specify data source tables',
  'WHERE': 'Filter rows by condition', 'GROUP BY': 'Aggregate data by common values',
  'HAVING': 'Filter aggregated group results', 'ORDER BY': 'Sort query result sequence',
  'LIMIT': 'Restrict total returned rows', 'JOIN': 'Combine tables by relationship',
  'ON': 'Define table join condition', 'CASE': 'Conditional if-then logic branch',
  'WHEN': 'Condition to test inside CASE', 'THEN': 'Result if WHEN is true',
  'ELSE': 'Fallback if no WHEN matches', 'END': 'Terminate a CASE expression',
  'INSERT': 'Add new rows to table', 'UPDATE': 'Modify existing table data',
  'DELETE': 'Remove rows from a table', 'CREATE': 'Define new database objects',
  'ALTER': 'Modify database object structure', 'DROP': 'Permanently delete database objects'
};

function HoverWord({ word, setHoverSnippet }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', paddingRight: '4rem' }}
      onMouseEnter={() => { setHover(true); setHoverSnippet(SNIPPETS[word]); }}
      onMouseLeave={() => { setHover(false); setHoverSnippet(null); }}
    >
      <span style={{
        color: hover ? '#ffffff' : 'rgba(255, 255, 255, 1)',
        WebkitTextStroke: 'none',
        cursor: 'default',
        transition: 'color 0.15s',
      }}>
        {word}
      </span>
    </div>
  );
}
// Repeater function
const generateTrack = (setHoverSnippet) => (
  <>
    {KEYWORDS.map((w, i) => <HoverWord key={`a-${i}`} word={w} setHoverSnippet={setHoverSnippet} />)}
    {KEYWORDS.map((w, i) => <HoverWord key={`b-${i}`} word={w} setHoverSnippet={setHoverSnippet} />)}
    {KEYWORDS.map((w, i) => <HoverWord key={`c-${i}`} word={w} setHoverSnippet={setHoverSnippet} />)}
  </>
);

export default function ScrollBanner() {
  const [hoverSnippet, setHoverSnippet] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <>
      <div className="scroll-banner-container pointer-events-auto">
        <div className="scroll-track scroll-left">
          <div className="scroll-content">
            {generateTrack(setHoverSnippet)}
          </div>
        </div>

        <div className="scroll-track scroll-right">
          <div className="scroll-content">
            {generateTrack(setHoverSnippet)}
          </div>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {hoverSnippet && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              style={{
                position: 'fixed',
                top: mousePos.y - 60, left: mousePos.x + 20,
                background: 'rgba(10,10,10,0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#ededed',
                fontFamily: 'JetBrains Mono, monospace',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 99999,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
              }}
            >
              {hoverSnippet}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
