import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertsPage } from '../pages/AlertsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { Dashboard } from '../pages/Dashboard';
import { MapViewPage } from '../pages/MapViewPage';
import { SettingsPage } from '../pages/SettingsPage';
import { alertsApi, locationsApi, waterQualityApi } from '../services/api';

vi.mock('../services/api', () => ({
  alertsApi: {
    getAll: vi.fn(),
    getStats: vi.fn(),
    getActive: vi.fn(),
  },
  locationsApi: {
    getAll: vi.fn(),
    getStats: vi.fn(),
    getGeoJSON: vi.fn(),
    search: vi.fn(),
  },
  waterQualityApi: {
    getStats: vi.fn(),
    getAllReadings: vi.fn(),
    getParameters: vi.fn(),
  },
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
  },
  divIcon: vi.fn(() => ({})),
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: vi.fn(),
    },
  },
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile" />,
  CircleMarker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="circle">{children}</div>
  ),
  useMap: () => ({
    fitBounds: vi.fn(),
    setView: vi.fn(),
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  BarChart: () => <div />,
  Bar: () => <div />,
  PieChart: () => <div />,
  Pie: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  AreaChart: () => <div />,
  Area: () => <div />,
}));

const mockAlertsApi = alertsApi as vi.Mocked<typeof alertsApi>;

const mockLocationsApi = locationsApi as vi.Mocked<typeof locationsApi>;

const mockWaterQualityApi = waterQualityApi as vi.Mocked<typeof waterQualityApi>;

const createDeferred = <T,>() => {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAlertsApi.getAll.mockResolvedValue({ data: [], pagination: {} });
  mockAlertsApi.getStats.mockResolvedValue({
    data: {
      active_alerts: 0,
      resolved_alerts: 0,
      severity_distribution: { low: 0, medium: 0, high: 0, critical: 0 },
      status_distribution: { active: 0, resolved: 0, dismissed: 0 },
      alert_types: [],
      parameters: [],
      locations_with_alerts: 0,
      average_resolution_time: null,
    },
  });
  mockAlertsApi.getActive.mockResolvedValue({ data: [] });
  mockLocationsApi.getAll.mockResolvedValue({ data: [] });
  mockLocationsApi.getStats.mockResolvedValue({
    data: {
      total_locations: 0,
      states_covered: 0,
      water_body_types: [],
      locations_with_alerts: 0,
      average_wqi_score: null,
    },
  });
  mockLocationsApi.getGeoJSON.mockResolvedValue({
    data: { type: 'FeatureCollection', features: [] },
  });
  mockLocationsApi.search.mockResolvedValue({ data: [] });
  mockWaterQualityApi.getStats.mockResolvedValue({
    data: {
      total_readings: 0,
      risk_level_distribution: { low: 0, medium: 0, high: 0, critical: 0 },
      average_quality_score: null,
      parameters_monitored: [],
      states_monitored: [],
      latest_reading: null,
    },
  });
  mockWaterQualityApi.getAllReadings.mockResolvedValue({ data: [] });
  mockWaterQualityApi.getParameters.mockResolvedValue({ data: [] });
});

describe('pages render', () => {
  it('triggers dashboard navigation actions', async () => {
    const user = userEvent.setup();
    const onNavigateToMap = vi.fn();
    const onNavigateToAnalytics = vi.fn();
    const onNavigateToAlerts = vi.fn();
    render(
      <Dashboard
        onNavigateToMap={onNavigateToMap}
        onNavigateToAnalytics={onNavigateToAnalytics}
        onNavigateToAlerts={onNavigateToAlerts}
      />
    );
    expect(screen.getByText('Water Quality Dashboard')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View Full Map' }));
    await user.click(screen.getByRole('button', { name: 'View Analytics' }));
    await user.click(screen.getByRole('button', { name: 'View All' }));
    expect(onNavigateToMap).toHaveBeenCalledTimes(1);
    expect(onNavigateToAnalytics).toHaveBeenCalledTimes(1);
    expect(onNavigateToAlerts).toHaveBeenCalledTimes(1);
  });

  it('renders the map view', async () => {
    render(<MapViewPage />);
    expect(await screen.findByText('Interactive Map')).toBeInTheDocument();
  });

  it('shows loading for map view data', () => {
    const deferred = createDeferred();
    mockLocationsApi.getAll.mockReturnValueOnce(deferred.promise);
    render(<MapViewPage />);
    expect(screen.getByText('Loading map data…')).toBeInTheDocument();
  });

  it('shows map view error state', async () => {
    mockLocationsApi.getAll.mockRejectedValueOnce(new Error('Map load failed'));
    render(<MapViewPage />);
    expect(await screen.findByText('Map load failed')).toBeInTheDocument();
  });

  it('shows alerts loading state', () => {
    const deferred = createDeferred();
    mockAlertsApi.getAll.mockReturnValueOnce(deferred.promise);
    mockAlertsApi.getStats.mockReturnValueOnce(deferred.promise);
    render(<AlertsPage />);
    expect(screen.getByText('Loading alerts…')).toBeInTheDocument();
  });

  it('shows alerts error state', async () => {
    mockAlertsApi.getAll.mockRejectedValueOnce(new Error('Alerts load failed'));
    render(<AlertsPage />);
    expect(await screen.findByText('Alerts load failed')).toBeInTheDocument();
  });

  it('shows analytics loading placeholders', () => {
    const deferred = createDeferred();
    mockWaterQualityApi.getStats.mockReturnValueOnce(deferred.promise);
    render(<AnalyticsPage />);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
  });

  it('shows analytics error state', async () => {
    mockWaterQualityApi.getStats.mockRejectedValueOnce(
      new Error('Analytics load failed')
    );
    render(<AnalyticsPage />);
    expect(
      await screen.findByText('Analytics load failed')
    ).toBeInTheDocument();
  });

  it('triggers theme change actions', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    render(<SettingsPage theme="light" onThemeChange={onThemeChange} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    const appearanceButton = screen.getByRole('button', {
      name: /appearance/i,
    });
    await user.click(appearanceButton);
    const darkButton = screen.getByRole('button', { name: /dark/i });
    await user.click(darkButton);
    expect(onThemeChange).toHaveBeenCalledWith('dark');
  });
});
