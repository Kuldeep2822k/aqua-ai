import { useState, useEffect } from 'react';
import { alertsApi, type ActiveAlert } from '../services/api';

export function useNotifications(limit = 4, pollInterval = 60000) {
  const [notifications, setNotifications] = useState<ActiveAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await alertsApi.getActive({ limit });
        if (mounted) {
          setNotifications(res.data || []);
          setError(null);
        }
      } catch {
        if (mounted) {
          setError('Failed to load notifications');
        }
      }
    };

    load();
    const interval = setInterval(load, pollInterval);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [limit, pollInterval]);

  const unreadCount = notifications.length;

  return { notifications, unreadCount, error };
}
