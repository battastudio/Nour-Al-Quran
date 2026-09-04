import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

// RTL order: الرئيسية · المصحف · [التسميع mic FAB] · الحفظ · الإعدادات
const TABS = [
  { to: '/', icon: 'home', label: 'الرئيسية', end: true },
  { to: '/read', icon: 'menu_book', label: 'المصحف', end: false },
  { to: '/hifz', icon: 'auto_stories', label: 'الحفظ', end: false },
  { to: '/settings', icon: 'settings', label: 'الإعدادات', end: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-surface-container-lowest/90 backdrop-blur-2xl pb-safe">
      <div className="relative mx-auto flex h-16 max-w-max-content-width items-stretch justify-between px-space-md">
        {/* first two tabs */}
        {TABS.slice(0, 2).map((t) => (
          <Tab key={t.to} {...t} />
        ))}

        {/* centre raised mic FAB */}
        <div className="flex w-16 items-start justify-center">
          <NavLink
            to="/tasmi"
            aria-label="التسميع"
            className="-mt-6 flex flex-col items-center gap-0.5"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-lg ring-2 ring-secondary/40 ${
                    isActive ? 'ring-secondary' : ''
                  }`}
                >
                  <Icon name="mic" filled={isActive} size={28} />
                </span>
                <span className="font-sans text-label-sm text-on-surface-variant">التسميع</span>
              </>
            )}
          </NavLink>
        </div>

        {/* last two tabs */}
        {TABS.slice(2).map((t) => (
          <Tab key={t.to} {...t} />
        ))}
      </div>
    </nav>
  );
}

function Tab({ to, icon, label, end }: { to: string; icon: string; label: string; end: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 text-on-surface-variant"
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} filled={isActive} className={isActive ? 'text-primary' : ''} />
          <span
            className={`font-sans text-label-sm ${isActive ? 'font-semibold text-primary' : ''}`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
