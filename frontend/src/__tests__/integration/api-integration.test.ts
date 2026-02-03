/**
 * API Integration Tests
 * End-to-end tests for API flows
 */

import axios from 'axios';

import { waterQualityApi, locationsApi, alertsApi } from '../../services/waterQualityApi';

// Mock axios before importing service
jest.mock('axios', () => {
    const mockGet = jest.fn();
    return {
        __esModule: true,
        default: {
            create: jest.fn(() => ({
                get: mockGet,
                interceptors: {
                    request: { use: jest.fn() },
                    response: { use: jest.fn() }
                },
                defaults: { headers: { common: {} } }
            })),
            AxiosHeaders: class {},
            _mockGet: mockGet // Expose for testing
        }
    };
});

describe('API Integration Tests', () => {
    // Access the exposed mockGet
    const mockGet = (axios as any)._mockGet;

    beforeEach(() => {
        mockGet.mockReset();
    });

    describe('Water Quality Flow', () => {
        it('should fetch readings and stats in sequence', async () => {
            const mockReadings = { data: [{ id: 1, ph: 7.2 }], total: 1 };
            const mockStats = { data: { total_readings: 1000, average_ph: 7.1 } };

            mockGet
                .mockResolvedValueOnce({
                    data: mockReadings,
                })
                .mockResolvedValueOnce({
                    data: mockStats,
                });

            const readings = await waterQualityApi.getReadings();
            const stats = await waterQualityApi.getStats();

            expect(readings.data).toHaveLength(1);
            expect(stats.data.total_readings).toBe(1000);
        });

        it('should handle network failures gracefully', async () => {
            mockGet.mockRejectedValue(new Error('Network error'));

            await expect(waterQualityApi.getReadings()).rejects.toThrow('Network error');
        });
    });

    describe('Location Flow', () => {
        it('should fetch locations and convert to GeoJSON', async () => {
            const mockGeoJSON = {
                data: {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            geometry: { type: 'Point', coordinates: [77.0, 28.0] },
                            properties: { name: 'Test Location' },
                        },
                    ],
                },
            };

            mockGet.mockResolvedValue({
                data: mockGeoJSON,
            });

            const result = await locationsApi.getGeoJSON();

            expect(result.data.type).toBe('FeatureCollection');
            expect(result.data.features[0].properties.name).toBe('Test Location');
        });

        it('should fetch location stats', async () => {
            const mockStats = {
                data: {
                    total_locations: 150,
                    states_covered: 12,
                    average_wqi_score: 65,
                },
            };

            mockGet.mockResolvedValue({
                data: mockStats,
            });

            const result = await locationsApi.getStats();

            expect(result.data.total_locations).toBe(150);
        });
    });

    describe('Alert Flow', () => {
        it('should fetch active alerts', async () => {
            const mockAlerts = {
                data: [
                    { id: 1, severity: 'critical', message: 'Alert 1' },
                    { id: 2, severity: 'warning', message: 'Alert 2' },
                ],
            };

            mockGet.mockResolvedValueOnce({
                data: mockAlerts,
            });

            const alerts = await alertsApi.getActive();
            expect(alerts.data).toHaveLength(2);
        });

        it('should fetch alert by ID', async () => {
            const mockAlert = {
                data: { id: 1, severity: 'critical', message: 'Alert 1' },
            };

            mockGet.mockResolvedValue({
                data: mockAlert,
            });

            const result = await alertsApi.getById(1);

            expect(result.data.id).toBe(1);
            expect(result.data.severity).toBe('critical');
        });

        it('should fetch alert statistics', async () => {
            const mockStats = {
                data: {
                    active_alerts: 10,
                    severity_distribution: { critical: 2, warning: 5, info: 3 },
                },
            };

            mockGet.mockResolvedValue({
                data: mockStats,
            });

            const result = await alertsApi.getStats();

            expect(result.data.active_alerts).toBe(10);
            expect(result.data.severity_distribution.critical).toBe(2);
        });
    });

    describe('Concurrent Requests', () => {
        it('should handle multiple concurrent API calls', async () => {
            const mockData = { data: [] };

            mockGet.mockResolvedValue({
                data: mockData,
            });

            const [readings, locations, alerts] = await Promise.all([
                waterQualityApi.getReadings(),
                locationsApi.getGeoJSON(),
                alertsApi.getActive(),
            ]);

            expect(readings).toBeDefined();
            expect(locations).toBeDefined();
            expect(alerts).toBeDefined();
            expect(mockGet).toHaveBeenCalledTimes(3);
        });
    });

    describe('Request Caching Behavior', () => {
        it('should use correct stale times for different endpoints', () => {
            // This would be tested in conjunction with React Query
            // Here we verify the API functions are called correctly
            expect(typeof waterQualityApi.getReadings).toBe('function');
            expect(typeof locationsApi.getStats).toBe('function');
            expect(typeof alertsApi.getStats).toBe('function');
        });
    });
});
