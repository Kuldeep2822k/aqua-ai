/**
 * Water Quality API Service Tests
 * Tests all API functions in waterQualityApi.ts
 */

import { waterQualityApi, locationsApi, alertsApi, calculateRiskLevel } from '../../services/waterQualityApi';
import api from '../../services/api'; // Import the api instance

// Mock axios
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => ({
            get: jest.fn(),
            interceptors: {
                request: { use: jest.fn() },
                response: { use: jest.fn() }
            },
            defaults: { headers: { common: {} } }
        })),
        AxiosHeaders: class {},
    }
}));

describe('waterQualityApi', () => {
    const mockGet = api.get as jest.Mock;

    beforeEach(() => {
        mockGet.mockReset();
    });

    describe('getReadings', () => {
        it('should fetch water quality readings without params', async () => {
            const mockData = { data: [{ id: 1, ph: 7.2 }], total: 1 };
            mockGet.mockResolvedValueOnce({
                data: mockData,
            });

            const result = await waterQualityApi.getReadings();

            expect(mockGet).toHaveBeenCalledWith(
                expect.stringContaining('/water-quality'),
                expect.any(Object)
            );
            expect(result).toEqual(mockData);
        });

        it('should include query params when provided', async () => {
            const mockData = { data: [], total: 0 };
            mockGet.mockResolvedValueOnce({
                data: mockData,
            });

            await waterQualityApi.getReadings({
                location_id: 123,
                start_date: '2024-01-01',
                end_date: '2024-12-31',
                limit: 50,
            });

            expect(mockGet).toHaveBeenCalledWith(
                expect.stringContaining('/water-quality'),
                expect.objectContaining({
                    params: expect.objectContaining({
                        location_id: 123
                    })
                })
            );
        });

        it('should handle fetch errors', async () => {
            mockGet.mockRejectedValueOnce(new Error('Network error'));

            await expect(waterQualityApi.getReadings()).rejects.toThrow('Network error');
        });
    });

    describe('getStats', () => {
        it('should fetch water quality statistics', async () => {
            const mockStats = {
                data: {
                    total_readings: 1000,
                    average_ph: 7.1,
                    parameters_monitored: ['ph', 'turbidity', 'dissolved_oxygen'],
                },
            };
            mockGet.mockResolvedValueOnce({
                data: mockStats,
            });

            const result = await waterQualityApi.getStats();

            expect(mockGet).toHaveBeenCalledWith(
                expect.stringContaining('/water-quality/stats'),
                expect.any(Object)
            );
            expect(result).toEqual(mockStats);
        });
    });
});

describe('locationsApi', () => {
    const mockGet = api.get as jest.Mock;

    beforeEach(() => {
        mockGet.mockReset();
    });

    describe('getGeoJSON', () => {
        it('should fetch locations in GeoJSON format', async () => {
            const mockGeoJSON = {
                data: {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            geometry: { type: 'Point', coordinates: [77.209, 28.6139] },
                            properties: { name: 'Delhi', avg_wqi_score: 45 },
                        },
                    ],
                },
            };
            mockGet.mockResolvedValueOnce({
                data: mockGeoJSON,
            });

            const result = await locationsApi.getGeoJSON();

            expect(mockGet).toHaveBeenCalledWith(
                expect.stringContaining('/locations/geojson')
            );
            expect(result.data.type).toBe('FeatureCollection');
        });

        it('should include state filter when provided', async () => {
            mockGet.mockResolvedValueOnce({
                data: { data: { type: 'FeatureCollection', features: [] } },
            });

            await locationsApi.getGeoJSON();

            expect(mockGet).toHaveBeenCalledWith(
                expect.stringContaining('/locations/geojson')
            );
        });
    });

    describe('getStats', () => {
        it('should fetch location statistics', async () => {
            const mockStats = {
                data: {
                    total_locations: 150,
                    states_covered: 12,
                    average_wqi_score: 65,
                    locations_with_alerts: 23,
                },
            };
            mockGet.mockResolvedValueOnce({
                data: mockStats,
            });

            const result = await locationsApi.getStats();

            expect(result.data.total_locations).toBe(150);
            expect(result.data.states_covered).toBe(12);
        });
    });
});

describe('alertsApi', () => {
    const mockGet = api.get as jest.Mock;

    beforeEach(() => {
        mockGet.mockReset();
    });

    describe('getActive', () => {
        it('should fetch active alerts', async () => {
            const mockAlerts = {
                data: [
                    { id: 1, severity: 'critical', message: 'High pH detected', location_name: 'Delhi' },
                    { id: 2, severity: 'warning', message: 'Turbidity elevated', location_name: 'Mumbai' },
                ],
            };
            mockGet.mockResolvedValueOnce({
                data: mockAlerts,
            });

            const result = await alertsApi.getActive();

            expect(mockGet).toHaveBeenCalledWith(
                expect.stringContaining('/alerts/active'),
                expect.any(Object)
            );
            expect(result.data).toHaveLength(2);
        });

        it('should respect limit parameter', async () => {
            mockGet.mockResolvedValueOnce({
                data: { data: [] },
            });

            await alertsApi.getActive({ limit: 5 });

            expect(mockGet).toHaveBeenCalledWith(
                expect.stringContaining('/alerts/active'),
                expect.objectContaining({
                    params: expect.objectContaining({ limit: 5 })
                })
            );
        });

        it('should filter by severity', async () => {
            mockGet.mockResolvedValueOnce({
                data: { data: [] },
            });

            await alertsApi.getActive({ severity: 'critical' });

            expect(mockGet).toHaveBeenCalledWith(
                expect.stringContaining('/alerts/active'),
                expect.objectContaining({
                    params: expect.objectContaining({ severity: 'critical' })
                })
            );
        });
    });

    describe('getStats', () => {
        it('should fetch alert statistics', async () => {
            const mockStats = {
                data: {
                    active_alerts: 15,
                    total_alerts: 234,
                    severity_distribution: {
                        critical: 3,
                        warning: 8,
                        info: 4,
                    },
                },
            };
            mockGet.mockResolvedValueOnce({
                data: mockStats,
            });

            const result = await alertsApi.getStats();

            expect(result.data.active_alerts).toBe(15);
            expect(result.data.severity_distribution.critical).toBe(3);
        });
    });

    describe('getById', () => {
        it('should fetch alert by ID', async () => {
            mockGet.mockResolvedValueOnce({
                data: { data: { id: 123, severity: 'critical' } },
            });

            const result = await alertsApi.getById(123);

            expect(mockGet).toHaveBeenCalledWith(
                expect.stringContaining('/alerts/123')
            );
            expect(result.data.id).toBe(123);
        });
    });
});

describe('calculateRiskLevel', () => {
    it('should return "critical" for WQI score < 40', () => {
        expect(calculateRiskLevel(20)).toBe('critical');
        expect(calculateRiskLevel(0)).toBe('critical');
        expect(calculateRiskLevel(39)).toBe('critical');
    });

    it('should return "high" for WQI score 40-59', () => {
        expect(calculateRiskLevel(40)).toBe('high');
        expect(calculateRiskLevel(50)).toBe('high');
        expect(calculateRiskLevel(59)).toBe('high');
    });

    it('should return "medium" for WQI score 60-79', () => {
        expect(calculateRiskLevel(60)).toBe('medium');
        expect(calculateRiskLevel(70)).toBe('medium');
        expect(calculateRiskLevel(79)).toBe('medium');
    });

    it('should return "low" for WQI score >= 80', () => {
        expect(calculateRiskLevel(80)).toBe('low');
        expect(calculateRiskLevel(90)).toBe('low');
        expect(calculateRiskLevel(100)).toBe('low');
    });

    it('should handle null scores', () => {
        expect(calculateRiskLevel(null)).toBe('medium');
    });

    it('should handle edge cases', () => {
        expect(calculateRiskLevel(-10)).toBe('critical');
        expect(calculateRiskLevel(150)).toBe('low');
    });
});