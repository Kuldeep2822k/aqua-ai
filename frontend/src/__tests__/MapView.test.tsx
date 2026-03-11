import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MapView } from '../components/MapView';
import { locationsApi } from '../services/api';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    fitBounds: vi.fn(),
  }),
}));

// Mock API
vi.mock('../services/api', () => ({
  locationsApi: {
    getAll: vi.fn(),
  },
}));

describe('MapView Component', () => {
  const mockLocations = [
    {
      id: 1,
      name: 'Test River',
      state: 'Test State',
      district: 'Test District',
      latitude: 20.0,
      longitude: 70.0,
      water_body_type: 'river',
      station_code: 'ST-001',
      avg_wqi_score: 85.0,
      active_alerts: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders map and markers with live data', async () => {
    (locationsApi.getAll as any).mockResolvedValue({
      success: true,
      data: mockLocations,
    });

    render(<MapView />);

    expect(screen.getByText(/Loading map.../i)).toBeDefined();

    await waitFor(() => {
      expect(screen.queryByText(/Loading map.../i)).toBeNull();
    });

    expect(screen.getByTestId('map-container')).toBeDefined();
    expect(screen.getAllByTestId('marker')).toHaveLength(1);
  });

  it('displays station code in popup content', async () => {
    (locationsApi.getAll as any).mockResolvedValue({
      success: true,
      data: mockLocations,
    });

    render(<MapView />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading map.../i)).toBeNull();
    });

    // Use getAllByText if duplicates persist, but cleanup should fix it
    const elements = screen.getAllByText(/Test River/i);
    expect(elements.length).toBeGreaterThan(0);
    expect(screen.getByText(/ID: ST-001/i)).toBeDefined();
  });
});
