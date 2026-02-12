import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AlertsPage } from '../pages/AlertsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { Dashboard } from '../pages/Dashboard';
import { MapViewPage } from '../pages/MapViewPage';
import { SettingsPage } from '../pages/SettingsPage';

vi.mock('../services/api', () => ({
  alertsApi: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    getStats: vi.fn().mockResolvedValue({ data: null }),
    getActive: vi.fn().mockResolvedValue({ data: [] }),
  },
  locationsApi: {
    getAll: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getStats: vi.fn().mockResolvedValue({ data: null }),
    getGeoJSON: vi.fn().mockResolvedValue({
      data: { type: 'FeatureCollection', features: [] },
    }),
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
  waterQualityApi: {
    getStats: vi.fn().mockResolvedValue({ data: null }),
    getAllReadings: vi.fn().mockResolvedValue({ data: [] }),
    getParameters: vi.fn().mockResolvedValue({ data: [] }),
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

describe('pages render', () => {
  it('renders the dashboard', () => {
    render(
      <Dashboard
        onNavigateToMap={() => {}}
        onNavigateToAnalytics={() => {}}
        onNavigateToAlerts={() => {}}
      />
    );
    expect(
      screen.getByText('Water Quality Dashboard')
    ).toBeInTheDocument();
  });

  it('renders the map view', async () => {
    render(<MapViewPage />);
    expect(screen.getByText('Interactive Map')).toBeInTheDocument();
  });

  it('renders the alerts page', () => {
    render(<AlertsPage />);
    expect(screen.getByText('Alert Management')).toBeInTheDocument();
  });

  it('renders the analytics page', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders the settings page', () => {
    render(<SettingsPage theme="light" onThemeChange={() => {}} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
