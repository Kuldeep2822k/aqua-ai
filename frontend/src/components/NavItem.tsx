import React from 'react';

type PageType = 'dashboard' | 'map' | 'alerts' | 'analytics' | 'settings';

interface NavItemProps {
  page: PageType;
  label: string;
  icon: React.ReactNode;
  currentPage: string;
  onNavigate: (page: PageType) => void;
}

export function NavItem({
  page,
  label,
  icon,
  currentPage,
  onNavigate,
}: NavItemProps) {
  const isActive = currentPage === page;

  return (
    <button
      onClick={() => onNavigate(page)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
