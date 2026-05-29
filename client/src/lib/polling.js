import { useEffect, useRef } from 'react';

export function usePolling(fn, intervalMs = 60000) {
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; }, [fn]);
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try { await fnRef.current(); } catch (e) { /* swallow */ }
      if (cancelled) return;
      const jitter = (Math.random() - 0.5) * 10000;
      setTimeout(tick, Math.max(5000, intervalMs + jitter));
    };
    tick();
    return () => { cancelled = true; };
  }, [intervalMs]);
}
