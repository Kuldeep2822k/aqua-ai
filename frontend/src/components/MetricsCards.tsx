import { useEffect, useMemo, useState } from 'react';
import { alertsApi, locationsApi, waterQualityApi } from '../services/api';

export function MetricsCards() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationsTotal, setLocationsTotal] = useState<number | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<number | null>(null);
  const [avgWqiScore, setAvgWqiScore] = useState<string | null>(null);
  const [totalReadings, setTotalReadings] = useState<number | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [locStats, alertStats, waterStats] = await Promise.all([
          locationsApi.getStats(),
          alertsApi.getStats(),
          waterQualityApi.getStats(),
        ]);
        if (canceled) {
          return;
        }

        setLocationsTotal(locStats?.data?.total_locations ?? null);
        setActiveAlerts(alertStats?.data?.active_alerts ?? null);
        setAvgWqiScore(locStats?.data?.average_wqi_score ?? null);
        setTotalReadings(waterStats?.data?.total_readings ?? null);
      } catch (cause: unknown) {
        if (!canceled) {
          setError(cause instanceof Error ? cause.message : 'Failed to load metrics');
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, []);

  const metrics = useMemo(
    () => [
      {
        value: locationsTotal === null ? '—' : locationsTotal.toLocaleString(),
        label: 'STATIONS REVIEWED',
      },
      {
        value: activeAlerts === null ? '—' : activeAlerts.toLocaleString(),
        label: 'NEED VERIFICATION',
      },
      {
        value: avgWqiScore === null ? '—' : avgWqiScore,
        label: 'MEDIAN WATER QUALITY',
      },
      {
        value: totalReadings === null ? '—' : totalReadings.toLocaleString(),
        label: 'TOTAL READINGS',
      },
    ],
    [activeAlerts, avgWqiScore, locationsTotal, totalReadings]
  );

  return (
    <section className="journal-stats" aria-label="Network summary">
      {error && (
        <p className="journal-data-error" role="alert">
          {error}
        </p>
      )}
      {metrics.map((metric) => (
        <div key={metric.label} className="journal-stat">
          <div className="journal-stat-value">{loading ? '…' : metric.value}</div>
          <div className="journal-stat-label">{metric.label}</div>
        </div>
      ))}
    </section>
  );
}
