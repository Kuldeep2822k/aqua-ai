import {
  AlertTriangle,
  BarChart3,
  Bell,
  Home,
  LogOut,
  Map,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Waves,
} from 'lucide-react';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { useNotifications } from '../hooks/useNotifications';
import type { Page } from '../types/navigation';
import { timeAgo } from '../utils/time';
import { NavItem } from './NavItem';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onNavigateHome?: () => void;
  theme: 'light' | 'dark' | 'auto';
  onThemeToggle: () => void;
}

interface HeaderNavItem {
  page: Page;
  label: string;
  mobileLabel?: string;
  icon: ReactNode;
}

const navItems: HeaderNavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
  {
    page: 'map',
    label: 'Interactive Map',
    mobileLabel: 'Map',
    icon: <Map size={18} />,
  },
  { page: 'alerts', label: 'Alerts', icon: <AlertTriangle size={18} /> },
  { page: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
];

function getSearchTarget(query: string): Page {
  const normalizedQuery = query.trim().toLowerCase();

  if (
    normalizedQuery.includes('map') ||
    normalizedQuery.includes('location') ||
    normalizedQuery.includes('river')
  ) {
    return 'map';
  }
  if (
    normalizedQuery.includes('alert') ||
    normalizedQuery.includes('critical') ||
    normalizedQuery.includes('warning')
  ) {
    return 'alerts';
  }
  if (
    normalizedQuery.includes('trend') ||
    normalizedQuery.includes('report') ||
    normalizedQuery.includes('analytics')
  ) {
    return 'analytics';
  }
  if (normalizedQuery.includes('setting')) {
    return 'settings';
  }

  return 'dashboard';
}

export function Header({
  currentPage,
  onNavigate,
  onNavigateHome,
  theme,
  onThemeToggle,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(notificationRef, () => setShowNotifications(false));
  useClickOutside(profileRef, () => setShowProfile(false));

  const {
    notifications,
    unreadCount,
    error: notificationsError,
  } = useNotifications();

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    onNavigate(getSearchTarget(searchQuery));
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 shadow-sm shadow-slate-900/5 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-950/80 dark:shadow-black/20">
      <div className="mx-auto max-w-[1500px] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-cyan-200 shadow-[0_12px_35px_rgba(8,47,73,0.22)] ring-1 ring-cyan-200/20 dark:bg-cyan-300 dark:text-slate-950">
              <Waves className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-xl font-semibold tracking-normal text-slate-950 dark:text-white">
                  Aqua-AI
                </span>
                <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-300/10 dark:text-cyan-200 dark:ring-cyan-300/20">
                  BETA
                </span>
              </span>
              <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                Water intelligence console
              </span>
            </span>
          </button>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-inner shadow-white/80 md:flex dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none"
          >
            {navItems.map((item) => (
              <NavItem
                key={item.page}
                page={item.page}
                label={item.label}
                icon={item.icon}
                currentPage={currentPage}
                onNavigate={onNavigate}
              />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <form
              role="search"
              onSubmit={handleSearchSubmit}
              className="relative hidden lg:block"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search locations, alerts..."
                aria-label="Search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-72 rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
              />
            </form>

            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} new`
                    : 'Notifications'
                }
                className="relative rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
              >
                <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 z-50 mt-3 w-96 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/16 dark:border-white/10 dark:bg-slate-900">
                  <div className="border-b border-slate-200 p-4 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-950 dark:text-white">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notificationsError && (
                      <div className="p-4 text-sm text-red-600 dark:text-red-300">
                        {notificationsError}
                      </div>
                    )}
                    {!notificationsError && notifications.length === 0 && (
                      <div className="p-4 text-sm text-slate-600 dark:text-slate-400">
                        No active alerts.
                      </div>
                    )}
                    {!notificationsError &&
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            onNavigate('alerts');
                            setShowNotifications(false);
                          }}
                          className="w-full border-b border-slate-100 p-4 text-left transition hover:bg-cyan-50/60 last:border-0 dark:border-white/10 dark:hover:bg-white/[0.06]"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-2 h-2 w-2 rounded-full ${
                                notification.severity === 'critical'
                                  ? 'bg-red-500'
                                  : notification.severity === 'high'
                                    ? 'bg-orange-500'
                                    : notification.severity === 'medium'
                                      ? 'bg-yellow-500'
                                      : 'bg-cyan-500'
                              }`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-slate-950 dark:text-white">
                                {notification.location_name}
                              </span>
                              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">
                                {notification.parameter_name} •{' '}
                                {notification.alert_type}
                              </span>
                              <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
                                {timeAgo(notification.triggered_at)}
                              </span>
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>

                  <div className="border-t border-slate-200 p-3 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('alerts');
                        setShowNotifications(false);
                      }}
                      className="w-full rounded-md py-2 text-center text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:text-cyan-300 dark:hover:bg-white/[0.06]"
                    >
                      View All Alerts
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onThemeToggle}
              className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              ) : (
                <Sun className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('settings')}
              aria-label="Settings"
              className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
            >
              <Settings className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </button>

            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setShowProfile(!showProfile)}
                aria-label="Profile menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm transition hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
              >
                <User className="h-5 w-5" />
              </button>

              {showProfile && (
                <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/16 dark:border-white/10 dark:bg-slate-900">
                  <div className="border-b border-slate-200 bg-slate-950 p-4 text-white dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-300 text-lg font-bold text-slate-950">
                        JD
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">John Doe</p>
                        <p className="truncate text-sm text-slate-300">
                          john.doe@example.com
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-cyan-100">
                        Administrator
                      </span>
                      <span className="flex items-center gap-1 rounded-md bg-emerald-300/15 px-2 py-1 text-xs font-medium text-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-slate-950 dark:text-white">
                          12
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Locations
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-300">
                          3
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Critical
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-cyan-700 dark:text-cyan-300">
                          47
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Reports
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('dashboard');
                        setShowProfile(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-cyan-50 dark:text-slate-300 dark:hover:bg-white/[0.06]"
                    >
                      <Home size={16} />
                      Dashboard
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('settings');
                        setShowProfile(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-cyan-50 dark:text-slate-300 dark:hover:bg-white/[0.06]"
                    >
                      <Settings size={16} />
                      Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('analytics');
                        setShowProfile(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-cyan-50 dark:text-slate-300 dark:hover:bg-white/[0.06]"
                    >
                      <BarChart3 size={16} />
                      My Analytics
                    </button>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <button
                            type="button"
                            disabled
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300"
                          >
                            <AlertTriangle size={16} />
                            Help & Support
                          </button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Help center coming soon</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="border-t border-slate-200 p-2 dark:border-white/10">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <button
                            type="button"
                            disabled
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Not available in demo mode</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="mt-3 grid grid-cols-4 gap-1 md:hidden"
        >
          {navItems.map((item) => (
            <NavItem
              key={item.page}
              page={item.page}
              label={item.mobileLabel ?? item.label}
              icon={item.icon}
              currentPage={currentPage}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>
    </header>
  );
}
