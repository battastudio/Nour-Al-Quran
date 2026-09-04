import { useEffect } from 'react';
import { useLocation } from '@/store/location';
import { computeSchedule } from './engine';

// Tier D — in-app: while the app is open and permitted, fire a foreground
// Notification + play the adhan at the next prayer instant. Re-arms after each.
export function useInAppAdhan(): void {
  const loc = useLocation();

  useEffect(() => {
    if (loc.lat == null || loc.lng == null) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    let timer: number | undefined;
    let audio: HTMLAudioElement | null = null;

    const arm = () => {
      const next = computeSchedule(
        {
          lat: loc.lat!,
          lng: loc.lng!,
          method: loc.method,
          madhab: loc.madhab,
          enabledPrayers: loc.enabledPrayers,
          wirdTime: null,
          fridayKahf: false,
          city: loc.city,
        },
        2,
      )[0];
      if (!next) return;
      const ms = next.at.getTime() - Date.now();
      if (ms < 0 || ms > 2 ** 31 - 1) return;
      timer = window.setTimeout(() => {
        new Notification(next.title, { body: next.body });
        audio = new Audio(`${import.meta.env.BASE_URL}sounds/adhan_makkah.mp3`);
        void audio.play().catch(() => {});
        arm(); // schedule the following prayer
      }, ms);
    };
    arm();

    return () => {
      if (timer) clearTimeout(timer);
      audio?.pause();
    };
  }, [loc.lat, loc.lng, loc.method, loc.madhab, loc.enabledPrayers, loc.city]);
}
