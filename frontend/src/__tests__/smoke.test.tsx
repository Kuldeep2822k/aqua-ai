import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import App from '../App';

vi.mock('../services/api', () => ({
  alertsApi: {
    getActive: vi.fn().mockResolvedValue({ data: [] }),
  },
  locationsApi: {
    getAll: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getStats: vi.fn().mockResolvedValue({ data: null }),
    getGeoJSON: vi.fn().mockResolvedValue({ data: { type: 'FeatureCollection', features: [] } }),
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
  waterQualityApi: {
    getStats: vi.fn().mockResolvedValue({ data: null }),
    getAllReadings: vi.fn().mockResolvedValue({ data: [] }),
    getParameters: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('frontend smoke', () => {
  it('runs', () => {
    render(<App />);
    expect(screen.getByText('Aqua-AI')).toBeInTheDocument();
  });
});
