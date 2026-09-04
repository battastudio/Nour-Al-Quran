import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useRouteTitle } from './ShellLayout';

// Immersive screens (reader, tasmi): back-arrow header, no bottom nav.
export function ImmersiveLayout() {
  const title = useRouteTitle();
  return (
    <>
      <Header title={title} variant="back" />
      <main className="mx-auto min-h-dvh max-w-max-content-width px-gutter-mobile pt-safe-16 pb-safe">
        <Outlet />
      </main>
    </>
  );
}
