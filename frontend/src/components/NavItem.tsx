import type React from 'react';
import type { Page } from '../types/navigation';

interface NavItemProps {
  page: Page;
  label: string;
  icon: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
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
      type="button"
      onClick={() => onNavigate(page)}
      className={`flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-all ${
        isActive
          ? 'bg-white text-cyan-700 shadow-sm ring-1 ring-slate-200 dark:bg-cyan-300 dark:text-slate-950 dark:ring-cyan-300'
          : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
