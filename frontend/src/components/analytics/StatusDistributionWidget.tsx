import { Suspense, useMemo, lazy } from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { type Location } from '../../services/api';

const StatusDistributionChart = lazy(() =>
  import('./AnalyticsCharts').then((mod) => ({
    default: mod.StatusDistributionChart,
  }))
);

function riskToBucket(risk: string | null | undefined): 'critical' | 'warning' | 'good' {
  if (risk === 'critical' || risk === 'high') {return 'critical';}
  if (risk === 'medium') {return 'warning';}
  return 'good';
}

interface Props {
  locations: Location[];
}

export function StatusDistributionWidget({ locations }: Props) {
  const stateDistribution = useMemo(() => {
    const counts = { Critical: 0, Warning: 0, Good: 0 };
    for (const l of locations) {
      const bucket = riskToBucket(l.derived_risk_level || null);
      if (bucket === 'critical') {
        counts.Critical += 1;
      } else if (bucket === 'warning') {
        counts.Warning += 1;
      } else {
        counts.Good += 1;
      }
    }
    return [
      { name: 'Critical', value: counts.Critical, color: '#ef4444' },
      { name: 'Warning', value: counts.Warning, color: '#eab308' },
      { name: 'Good', value: counts.Good, color: '#22c55e' },
    ];
  }, [locations]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Current Status
      </h2>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-[200px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Loading…
            </div>
          }
        >
          <StatusDistributionChart data={stateDistribution} />
        </Suspense>
      </ErrorBoundary>
      <div className="space-y-2 mt-4">
        {stateDistribution.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {item.name}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {item.value} locations
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
