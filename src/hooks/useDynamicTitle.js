import { useEffect, useRef } from 'react';

const SPINNERS = ['[ - ]', '[ \\ ]', '[ | ]', '[ / ]'];

export function useDynamicTitle(isSpinning) {
  const frame = useRef(0);

  useEffect(() => {
    if (!isSpinning) {
      document.title = "SyntaxLab";
      return;
    }

    const interval = setInterval(() => {
      frame.current = (frame.current + 1) % SPINNERS.length;
      document.title = `${SPINNERS[frame.current]} Syncing Lab`;
    }, 100);

    return () => {
      clearInterval(interval);
      document.title = "SyntaxLab";
    };
  }, [isSpinning]);
}
