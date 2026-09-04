import { createHashRouter, Outlet } from 'react-router-dom';
import { ShellLayout } from './ShellLayout';
import { ImmersiveLayout } from './ImmersiveLayout';
import { ToastHost } from '@/components/Toast';
import { Home } from '@/features/home/Home';
import { SurahIndex } from '@/features/reader/SurahIndex';
import { Reader } from '@/features/reader/Reader';
import { Search } from '@/features/search/Search';
import { Prayer } from '@/features/prayer/Prayer';
import { Qibla } from '@/features/prayer/Qibla';
import { Settings } from '@/features/settings/Settings';
import { ReadingSettings } from '@/features/settings/ReadingSettings';
import { NotificationSettings } from '@/features/notifications/NotificationSettings';
import { Hifz } from '@/features/hifz/Hifz';
import { HifzReview } from '@/features/hifz/HifzReview';
import { Tasmi } from '@/features/tasmi/Tasmi';
import { Saved } from '@/features/saved/Saved';
import { Stats } from '@/features/stats/Stats';
import { Adhkar } from '@/features/adhkar/Adhkar';
import { Tasbih } from '@/features/adhkar/Tasbih';
import { Downloads } from '@/features/downloads/Downloads';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { Drive } from '@/features/drive/Drive';
import { Night } from '@/features/night/Night';
import { Waqf } from '@/features/lab/Waqf';
import { Lab } from '@/features/lab/Lab';
import { Khatmah } from '@/features/khatmah/Khatmah';
import { SurahPath } from '@/features/hifz/SurahPath';
import { Similar } from '@/features/similar/Similar';
import { Account } from '@/features/settings/Account';
import { Circles } from '@/features/circles/Circles';
import { ComingSoon } from '@/features/_shared/ComingSoon';
import { MiniPlayer } from '@/features/audio/MiniPlayer';
import { useInAppAdhan } from '@/notifications/inApp';

// Global chrome (toasts, mini audio player, in-app adhan) that outlives route changes.
function RootChrome() {
  useInAppAdhan();
  return (
    <>
      <Outlet />
      <MiniPlayer />
      <ToastHost />
    </>
  );
}

export const router = createHashRouter([
  {
    element: <RootChrome />,
    children: [
      {
        element: <ShellLayout />,
        children: [
          { index: true, element: <Home />, handle: { title: 'نور القرآن' } },
          { path: 'read', element: <SurahIndex />, handle: { title: 'المصحف' } },
          { path: 'hifz', element: <Hifz />, handle: { title: 'الحفظ والمراجعة' } },
          { path: 'hifz/review', element: <HifzReview />, handle: { title: 'المراجعة' } },
          { path: 'hifz/path/:surah', element: <SurahPath />, handle: { title: 'مسار الإتقان' } },
          { path: 'similar/:s/:a', element: <Similar />, handle: { title: 'المتشابهات' } },
          { path: 'circles', element: <Circles />, handle: { title: 'الحلقات' } },
          { path: 'prayer', element: <Prayer />, handle: { title: 'مواقيت الصلاة' } },
          { path: 'prayer/qibla', element: <Qibla />, handle: { title: 'القبلة' } },
          { path: 'search', element: <Search />, handle: { title: 'البحث' } },
          { path: 'saved', element: <Saved />, handle: { title: 'المحفوظات' } },
          { path: 'stats', element: <Stats />, handle: { title: 'الإحصائيات' } },
          { path: 'khatmah', element: <Khatmah />, handle: { title: 'الختمة' } },
          { path: 'adhkar', element: <Adhkar />, handle: { title: 'الأذكار' } },
          { path: 'tasbih', element: <Tasbih />, handle: { title: 'المسبحة' } },
          { path: 'downloads', element: <Downloads />, handle: { title: 'التنزيلات' } },
          { path: 'night', element: <Night />, handle: { title: 'قيام الليل' } },
          { path: 'lab', element: <Lab />, handle: { title: 'المختبر' } },
          { path: 'lab/waqf', element: <Waqf />, handle: { title: 'الوقف والابتداء' } },
          { path: 'root/:root', element: <ComingSoon title="شجرة الجذور" />, handle: { title: 'الجذور' } },
          { path: 'settings', element: <Settings />, handle: { title: 'الإعدادات' } },
          { path: 'settings/reading', element: <ReadingSettings />, handle: { title: 'الخط والعرض والسمات' } },
          { path: 'settings/notifications', element: <NotificationSettings />, handle: { title: 'التنبيهات والأذان' } },
          { path: 'settings/account', element: <Account />, handle: { title: 'الملف الشخصي والمزامنة' } },
        ],
      },
      {
        element: <ImmersiveLayout />,
        children: [
          { path: 'read/:surah/:ayah?', element: <Reader /> },
          { path: 'tasmi', element: <Tasmi />, handle: { title: 'التسميع' } },
          { path: 'drive', element: <Drive />, handle: { title: 'وضع القيادة' } },
          { path: 'welcome', element: <Onboarding />, handle: { title: 'التهيئة' } },
        ],
      },
    ],
  },
]);
