import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { computeSchedule, type ScheduleOptions } from './engine';

// Tier A — native local notifications (Android now; iOS when the Apple account
// exists). Rolling reschedule: cancel our pending, schedule the next 7 days.
// TODO(device): verify adhan fires with the app killed + after reboot on Android.

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function ensurePermission(): Promise<boolean> {
  if (!isNative()) return false;
  const cur = await LocalNotifications.checkPermissions();
  if (cur.display === 'granted') return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === 'granted';
}

async function ensureChannels(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  await LocalNotifications.createChannel({
    id: 'adhan',
    name: 'الأذان',
    importance: 5,
    sound: 'adhan_makkah.mp3', // bundled in android/app/src/main/res/raw
    visibility: 1,
    vibration: true,
  });
  await LocalNotifications.createChannel({
    id: 'wird',
    name: 'الورد والتذكيرات',
    importance: 4,
    visibility: 1,
  });
}

/** Cancel our pending notifications and schedule the next `days`. */
export async function reschedule(opts: ScheduleOptions, days = 7): Promise<void> {
  if (!isNative()) return;
  if (!(await ensurePermission())) return;
  await ensureChannels();

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  }

  const schedule = computeSchedule(opts, days);
  if (!schedule.length) return;

  await LocalNotifications.schedule({
    notifications: schedule.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      channelId: n.channel,
      schedule: { at: n.at, allowWhileIdle: true },
      extra: { url: n.url },
      smallIcon: 'ic_stat_icon',
    })),
  });
}

/** Route taps to the right screen. Call once at app start. */
export async function initNotificationTaps(): Promise<void> {
  if (!isNative()) return;
  await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const url = (action.notification.extra as { url?: string } | undefined)?.url;
    if (url) location.hash = url.replace(/^#/, '');
  });
}
