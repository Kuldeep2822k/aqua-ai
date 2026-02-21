import { Search, Bell, User, Settings, Sun, Moon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { alertsApi, type ActiveAlert } from '../services/api';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface HeaderProps {
  currentPage: 'dashboard' | 'map' | 'alerts' | 'analytics' | 'settings';
  onNavigate: (
    page: 'dashboard' | 'map' | 'alerts' | 'analytics' | 'settings'
  ) => void;
  theme: 'light' | 'dark' | 'auto';
  onThemeToggle: () => void;
}

function timeAgo(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  const mins = Math.floor(diffSec / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

export function Header({
  currentPage,
  onNavigate,
  theme,
  onThemeToggle,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<ActiveAlert[]>([]);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        setNotificationsError(null);
        const res = await alertsApi.getActive({ limit: 4 });
        if (!canceled) setNotifications(res?.data ?? []);
      } catch (e: unknown) {
        if (!canceled) {
          setNotifications([]);
          setNotificationsError(
            e instanceof Error ? e.message : 'Failed to load notifications'
          );
        }
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.length;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  Aqua-AI
                </span>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs rounded">
                  BETA
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={
                currentPage === 'dashboard'
                  ? 'text-blue-500 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('map')}
              className={
                currentPage === 'map'
                  ? 'text-blue-500 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            >
              Interactive Map
            </button>
            <button
              type="button"
              onClick={() => onNavigate('alerts')}
              className={
                currentPage === 'alerts'
                  ? 'text-blue-500 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            >
              Alerts
            </button>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className={
                currentPage === 'analytics'
                  ? 'text-blue-500 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            >
              Analytics
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                aria-label="Search"
                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-gray-900 dark:text-white placeholder-gray-500"
              />
            </div>

            {/* Notifications Dropdown */}
            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notificationsError && (
                      <div className="p-4 text-sm text-red-600 dark:text-red-400">
                        {notificationsError}
                      </div>
                    )}
                    {!notificationsError && notifications.length === 0 && (
                      <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
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
                          className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-2 h-2 rounded-full mt-2 ${
                                notification.severity === 'critical'
                                  ? 'bg-red-500'
                                  : notification.severity === 'high'
                                    ? 'bg-orange-500'
                                    : notification.severity === 'medium'
                                      ? 'bg-yellow-500'
                                      : 'bg-blue-500'
                              }`}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                  {notification.location_name}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                {notification.parameter_name} •{' '}
                                {notification.alert_type}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {timeAgo(notification.triggered_at)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>

                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('alerts');
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      View All Alerts
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onThemeToggle}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('settings')}
              aria-label="Settings"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setShowProfile(!showProfile)}
                aria-label="Profile menu"
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <User className="w-5 h-5 text-white" />
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
                  {/* Profile Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        JD
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          John Doe
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          john.doe@example.com
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-lg font-medium">
                        Administrator
                      </span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded-lg font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          12
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Locations
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                          3
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Critical
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          47
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Reports
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('dashboard');
                        setShowProfile(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      Dashboard
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('settings');
                        setShowProfile(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('analytics');
                        setShowProfile(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      My Analytics
                    </button>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <button
                            type="button"
                            disabled
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg transition-colors opacity-50 cursor-not-allowed"
                          >
                            <svg
                              className="w-5 h-5"
                              aria-hidden="true"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Help & Support
                          </button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Help center coming soon</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Logout */}
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <button
                            type="button"
                            disabled
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg transition-colors font-medium opacity-50 cursor-not-allowed"
                          >
                            <svg
                              className="w-5 h-5"
                              aria-hidden="true"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
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
      </div>
    </header>
  );
}
