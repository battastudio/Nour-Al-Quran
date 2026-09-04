import { Outlet, useMatches } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

export function useRouteTitle(): string | undefined {
  const matches = useMatches();
  for (let i = matches.length - 1; i >= 0; i--) {
    const t = (matches[i].handle as { title?: string } | undefined)?.title;
    if (t) return t;
  }
  return undefined;
}

// Standard screens: fixed header + bottom nav, 780px content spine.
export function ShellLayout() {
  const title = useRouteTitle();
  return (
    <>
      <Header title={title} />
      <main className="mx-auto min-h-dvh max-w-max-content-width px-gutter-mobile pt-safe-16 pb-safe-28">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
