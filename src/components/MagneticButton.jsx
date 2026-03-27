import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function MagneticButton({ children, onClick, className, style, disabled, type = 'button' }) {
  const ref = useRef(null);
  
  // Motion values for X and Y cursor displacement
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Apply spring physics to the raw motion values
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    if (disabled) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    
    // Calculate the distance from center
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    
    // Pull the button towards cursor, but limit strength
    x.set(middleX * 0.2);
    y.set(middleY * 0.2);
  };

  const handleMouseLeave = () => {
    // Snap back to 0 abruptly with spring physics doing the easing
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: springX,
        y: springY,
        ...style
      }}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {/* Inner wrapper to apply inverse motion if desired, but button-level motion is usually enough */}
      <motion.span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        {children}
      </motion.span>
    </motion.button>
  );
}
