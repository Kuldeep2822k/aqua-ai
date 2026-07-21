import { ArrowUpRight } from 'lucide-react';
import { MapView } from '../components/MapView';
import { MetricsCards } from '../components/MetricsCards';
import { useLocations } from '../hooks/useLocations';

interface DashboardProps {
  onNavigateToMap: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToAlerts: () => void;
}

function conditionForScore(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return { label: 'Awaiting sample', tone: 'neutral' };
  }
  if (score < 40) {
    return { label: 'Review sample', tone: 'critical' };
  }
  if (score < 60) {
    return { label: 'Watch', tone: 'watch' };
  }
  return { label: 'Stable', tone: 'stable' };
}

function FieldReports({ onNavigateToAnalytics }: { onNavigateToAnalytics: () => void }) {
  const { locations, loading, error } = useLocations();
  const reports = [...locations]
    .sort((left, right) => (left.avg_wqi_score ?? 100) - (right.avg_wqi_score ?? 100))
    .slice(0, 3);

  return (
    <section className="journal-reports" aria-labelledby="reports-heading">
      <div className="journal-reports-intro">
        <p id="reports-heading" className="journal-section-label">
          Reports from the field
        </p>
        <p>Latest readings, ordered by condition.</p>
      </div>
      <div className="journal-report-list">
        <div className="journal-report-headings" aria-hidden="true">
          <span>Station</span>
          <span>Condition</span>
          <span>WQI</span>
          <span>Observation</span>
        </div>
        {loading && <p className="journal-report-state">Loading field reports…</p>}
        {error && <p className="journal-report-state journal-data-error">{error}</p>}
        {!loading && !error && reports.length === 0 && (
          <p className="journal-report-state">No station reports are available yet.</p>
        )}
        {!loading &&
          !error &&
          reports.map((location) => {
            const condition = conditionForScore(location.avg_wqi_score);
            const score = location.avg_wqi_score ?? null;
            return (
              <button
                key={location.id}
                type="button"
                className="journal-report-row"
                onClick={onNavigateToAnalytics}
              >
                <span className="journal-station-name">{location.name}</span>
                <span className={`journal-condition journal-condition-${condition.tone}`}>
                  <i aria-hidden="true" />
                  {condition.label}
                </span>
                <span>{score === null ? '—' : score}</span>
                <span className="journal-observation">
                  {score === null
                    ? 'No water-quality index has been published.'
                    : `Current index: ${score}`}
                </span>
              </button>
            );
          })}
      </div>
    </section>
  );
}

export function Dashboard({
  onNavigateToMap,
  onNavigateToAnalytics,
  onNavigateToAlerts,
}: DashboardProps) {
  return (
    <main className="journal-page">
      <section className="journal-briefing">
        <div className="journal-lead">
          <p className="journal-kicker">Morning briefing / India</p>
          <h1>The water picture,<br />at a glance.</h1>
          <p className="journal-summary">
            A concise daily readout for the field team: where water quality is changing,
            what needs verification, and which station reports deserve attention.
          </p>
          <MapView />
        </div>

        <aside className="journal-field-note">
          <p className="journal-kicker">Field note / today</p>
          <h2>Readings that need a closer look.</h2>
          <p>
            Review the stations marked in the map before publishing an update. The
            report list below keeps the lowest water-quality index readings in view.
          </p>
          <div className="journal-note-rule" />
          <p className="journal-note-meta">Next check</p>
          <p className="journal-note-value">Review the active alert queue</p>
          <button type="button" className="journal-text-link" onClick={onNavigateToAlerts}>
            Open alert queue <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="journal-secondary-link" onClick={onNavigateToMap}>
            Explore full map
          </button>
        </aside>
      </section>

      <MetricsCards />
      <FieldReports onNavigateToAnalytics={onNavigateToAnalytics} />
    </main>
  );
}
