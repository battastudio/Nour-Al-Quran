import { useEffect } from 'react';

// Keep the screen awake while a component is mounted (reader, tasmi).
// No-ops gracefully where the Wake Lock API is unavailable.
export function useWakeLock(active = true): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let released = false;

    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        /* user gesture / permission may be required — ignore */
      }
    };
    void request();

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !released) void request();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}
