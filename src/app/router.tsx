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
import { ComingSoon } from '@/features/_shared/ComingSoon';
import { useInAppAdhan } from '@/notifications/inApp';

// Global chrome (toasts + in-app adhan) that outlives route changes.
function RootChrome() {
  useInAppAdhan();
  return (
    <>
      <Outlet />
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
          { path: 'prayer', element: <Prayer />, handle: { title: 'مواقيت الصلاة' } },
          { path: 'prayer/qibla', element: <Qibla />, handle: { title: 'القبلة' } },
          { path: 'search', element: <Search />, handle: { title: 'البحث' } },
          { path: 'saved', element: <ComingSoon title="العلامات والملاحظات" />, handle: { title: 'المحفوظات' } },
          { path: 'stats', element: <ComingSoon title="الإحصائيات والأوسمة" />, handle: { title: 'الإحصائيات' } },
          { path: 'khatmah', element: <ComingSoon title="خطة الختمة" />, handle: { title: 'الختمة' } },
          { path: 'adhkar', element: <ComingSoon title="الأذكار" />, handle: { title: 'الأذكار' } },
          { path: 'tasbih', element: <ComingSoon title="المسبحة" />, handle: { title: 'المسبحة' } },
          { path: 'downloads', element: <ComingSoon title="إدارة التنزيل" />, handle: { title: 'التنزيلات' } },
          { path: 'root/:root', element: <ComingSoon title="شجرة الجذور" />, handle: { title: 'الجذور' } },
          { path: 'settings', element: <Settings />, handle: { title: 'الإعدادات' } },
          { path: 'settings/reading', element: <ReadingSettings />, handle: { title: 'الخط والعرض والسمات' } },
          { path: 'settings/notifications', element: <NotificationSettings />, handle: { title: 'التنبيهات والأذان' } },
        ],
      },
      {
        element: <ImmersiveLayout />,
        children: [
          { path: 'read/:surah/:ayah?', element: <Reader /> },
          { path: 'tasmi', element: <Tasmi />, handle: { title: 'التسميع' } },
          { path: 'welcome', element: <ComingSoon title="مرحباً بك في نور القرآن" />, handle: { title: 'التهيئة' } },
        ],
      },
    ],
  },
]);
