import { Bell, Search, User, Waves } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { useNotifications } from '../hooks/useNotifications';
import type { Page } from '../types/navigation';
import { timeAgo } from '../utils/time';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onNavigateHome?: () => void;
  theme: 'light' | 'dark' | 'auto';
  onThemeToggle: () => void;
}

function getSearchTarget(query: string): Page {
  const normalizedQuery = query.trim().toLowerCase();
  if (/map|location|river|lake/.test(normalizedQuery)) {
    return 'map';
  }
  if (/alert|critical|warning|incident/.test(normalizedQuery)) {
    return 'alerts';
  }
  if (/trend|report|analytic|reading/.test(normalizedQuery)) {
    return 'analytics';
  }
  if (/setting|account|profile/.test(normalizedQuery)) {
    return 'settings';
  }
  return 'dashboard';
}

const navigation: Array<{ page: Page; label: string }> = [
  { page: 'dashboard', label: 'Briefing' },
  { page: 'map', label: 'Map' },
  { page: 'analytics', label: 'Reports' },
  { page: 'settings', label: 'Settings' },
];

export function Header({
  currentPage,
  onNavigate,
  onNavigateHome,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount } = useNotifications();
  const editionDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date())
    .toUpperCase();

  useClickOutside(notificationRef, () => setShowNotifications(false));
  useClickOutside(profileRef, () => setShowProfile(false));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    onNavigate(getSearchTarget(searchQuery));
    setSearchQuery('');
  };

  return (
    <header className="journal-masthead">
      <div className="journal-masthead-inner">
        <button
          type="button"
          onClick={onNavigateHome}
          className="journal-wordmark"
          aria-label="Return to Aqua-AI home"
        >
          <Waves aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          <span>Aqua-AI</span>
          <span className="journal-wordmark-detail">Field Journal</span>
        </button>

        <nav aria-label="Primary navigation" className="journal-primary-nav">
          {navigation.map((item) => (
            <button
              key={item.page}
              type="button"
              aria-current={currentPage === item.page ? 'page' : undefined}
              onClick={() => onNavigate(item.page)}
              className={currentPage === item.page ? 'is-active' : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="journal-header-actions">
          <form role="search" onSubmit={handleSubmit} className="journal-search">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6c66]"
            />
            <input
              type="search"
              aria-label="Search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search"
              className="h-8 w-full bg-transparent pl-6 text-sm text-[#182522] outline-none placeholder:text-[#7b857f]"
            />
          </form>
          <p className="journal-date">{editionDate}</p>

          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((open) => !open)}
              aria-label={
                unreadCount
                  ? `Notifications, ${unreadCount} new`
                  : 'Notifications'
              }
              className="journal-icon-button relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#b33d26]" />
              )}
            </button>
            {showNotifications && (
              <div className="journal-popover absolute right-0 z-50 mt-3 w-80 overflow-hidden">
                <div className="border-b border-[#d4d0c4] px-4 py-3">
                  <p className="text-sm font-semibold text-[#182522]">Alerts</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-[#66736d]">No active alerts.</p>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          onNavigate('alerts');
                          setShowNotifications(false);
                        }}
                        className="w-full border-b border-[#e2ded2] px-4 py-3 text-left last:border-0 hover:bg-[#eeeade]"
                      >
                        <span className="block text-sm font-medium text-[#182522]">
                          {notification.location_name}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#66736d]">
                          {notification.parameter_name} · {notification.alert_type}
                        </span>
                        <span className="mt-1 block text-xs text-[#8a928c]">
                          {timeAgo(notification.triggered_at)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              aria-label="Profile menu"
              onClick={() => setShowProfile((open) => !open)}
              className="journal-icon-button"
            >
              <User className="h-4 w-4" />
            </button>
            {showProfile && (
              <div className="journal-popover absolute right-0 z-50 mt-3 w-56 overflow-hidden">
                <div className="border-b border-[#d4d0c4] px-4 py-3">
                  <p className="text-sm font-medium text-[#182522]">John Doe</p>
                  <p className="mt-0.5 text-xs text-[#66736d]">Administrator</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('settings')}
                  className="w-full px-4 py-3 text-left text-sm text-[#45534d] hover:bg-[#eeeade]"
                >
                  Account settings
                </button>
                <button
                  type="button"
                  disabled
                  className="w-full px-4 py-3 text-left text-sm text-[#8a928c] disabled:cursor-not-allowed"
                >
                  Sign out (demo)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
