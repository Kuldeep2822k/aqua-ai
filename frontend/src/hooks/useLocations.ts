import { useState, useEffect } from 'react';
import { locationsApi, type Location } from '../services/api';

export function useLocations(limit = 100) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      try {
        setLoading(true);
        const response = await locationsApi.getAll({ limit });
        if (mounted) {
          setLocations(response.data || []);
          setError(null);
        }
      } catch {
        if (mounted) {
          setError('Failed to load locations');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetch();
    return () => {
      mounted = false;
    };
  }, [limit]);

  return { locations, loading, error };
}
