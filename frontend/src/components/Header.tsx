import {
  Search,
  Bell,
  User,
  Settings,
  Sun,
  Moon,
  Home,
  Map,
  AlertTriangle,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useClickOutside } from '../hooks/useClickOutside';
import { timeAgo } from '../utils/time';
import { NavItem } from './NavItem';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface HeaderProps {
  currentPage: 'dashboard' | 'map' | 'alerts' | 'analytics' | 'settings';
  onNavigate: (
    page: 'dashboard' | 'map' | 'alerts' | 'analytics' | 'settings'
  ) => void;
  theme: 'light' | 'dark' | 'auto';
  onThemeToggle: () => void;
}

export function Header({
  currentPage,
  onNavigate,
  theme,
  onThemeToggle,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(notificationRef, () => setShowNotifications(false));
  useClickOutside(profileRef, () => setShowProfile(false));

  const {
    notifications,
    unreadCount,
    error: notificationsError,
  } = useNotifications();

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
          <nav className="hidden md:flex items-center gap-2">
            <NavItem
              page="dashboard"
              label="Dashboard"
              icon={<Home size={18} />}
              currentPage={currentPage}
              onNavigate={onNavigate}
            />
            <NavItem
              page="map"
              label="Interactive Map"
              icon={<Map size={18} />}
              currentPage={currentPage}
              onNavigate={onNavigate}
            />
            <NavItem
              page="alerts"
              label="Alerts"
              icon={<AlertTriangle size={18} />}
              currentPage={currentPage}
              onNavigate={onNavigate}
            />
            <NavItem
              page="analytics"
              label="Analytics"
              icon={<BarChart3 size={18} />}
              currentPage={currentPage}
              onNavigate={onNavigate}
            />
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
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} new`
                    : 'Notifications'
                }
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
                      <Home size={16} />
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
                      <Settings size={16} />
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
                      <BarChart3 size={16} />
                      My Analytics
                    </button>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <button
                            type="button"
                            disabled
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                  {/* Logout */}
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <button
                            type="button"
                            disabled
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </header>
  );
}
