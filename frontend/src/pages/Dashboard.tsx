import { MetricsCards } from '../components/MetricsCards';
import { QuickActions } from '../components/QuickActions';
import { RecentAlerts } from '../components/RecentAlerts';
import { RiskHotspots } from '../components/RiskHotspots';
import { MapView } from '../components/MapView';

interface DashboardProps {
  onNavigateToMap: () => void;
  onNavigateToAnalytics: () => void;
}

export function Dashboard({
  onNavigateToMap,
  onNavigateToAnalytics,
}: DashboardProps) {
  return (
    <main className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Page Title */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl text-gray-900 dark:text-white transition-colors duration-200">
            Water Quality Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                System Online
              </span>
            </div>
            <span className="text-sm text-gray-400 dark:text-gray-500 transition-colors duration-200">
              Last updated: Just now
            </span>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">
          Real-time monitoring and AI-powered insights for India's water bodies.
        </p>
      </div>

      {/* Metrics Cards */}
      <MetricsCards />

      {/* Quick Actions */}
      <QuickActions
        onNavigateToMap={onNavigateToMap}
        onNavigateToAnalytics={onNavigateToAnalytics}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column - Alerts & Hotspots */}
        <div className="space-y-6">
          <RecentAlerts />
          <RiskHotspots />
        </div>

        {/* Right Column - Map */}
        <div className="lg:col-span-2">
          <MapView />
        </div>
      </div>
    </main>
  );
}
