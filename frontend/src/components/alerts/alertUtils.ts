import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export function timeAgo(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) {
    return '';
  }
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  const mins = Math.floor(diffSec / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) {
    return `${days}d ago`;
  }
  if (hrs > 0) {
    return `${hrs}h ago`;
  }
  if (mins > 0) {
    return `${mins}m ago`;
  }
  return 'just now';
}

export const severityConfig = {
  critical: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-500',
    gradient: 'from-red-500 to-red-600',
  },
  high: {
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-500',
    gradient: 'from-orange-500 to-orange-600',
  },
  medium: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-500',
    gradient: 'from-yellow-500 to-yellow-600',
  },
  low: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
  },
};

export const statusConfig = {
  active: {
    label: 'Active',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  dismissed: {
    label: 'Dismissed',
    icon: XCircle,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-700/50',
  },
};
