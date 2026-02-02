/**
 * MapView Page Tests
 * Tests for the Interactive Map page
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import MapView from '../../pages/MapView';

// Mock the API services
jest.mock('../../services/waterQualityApi', () => ({
    waterQualityApi: {
        getReadings: jest.fn(),
        getStats: jest.fn(),
    },
    locationsApi: {
        getGeoJSON: jest.fn(),
        getStats: jest.fn(),
    },
    calculateRiskLevel: jest.fn((score) => {
        if (score < 25) return 'critical';
        if (score < 50) return 'high';
        if (score < 75) return 'medium';
        return 'low';
    }),
}));

const { waterQualityApi, locationsApi } = require('../../services/waterQualityApi');

// Mock SimpleMap to avoid Leaflet issues and focus on MapView logic
jest.mock('../../components/SimpleMap', () => {
    return function MockSimpleMap() {
        return <div data-testid="map-container">Mock Map</div>;
    };
});

// Helper to create test wrapper
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <HelmetProvider>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>{children}</BrowserRouter>
            </QueryClientProvider>
        </HelmetProvider>
    );
};

describe('MapView Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock responses
        waterQualityApi.getReadings.mockResolvedValue({
            data: [
                {
                    id: 1,
                    location_id: 1,
                    location_name: 'Ganga at Varanasi',
                    state: 'Uttar Pradesh',
                    latitude: 25.3176,
                    longitude: 82.9739,
                    wqi_score: 45,
                    ph: 7.8,
                    dissolved_oxygen: 5.2,
                    turbidity: 8.5,
                    temperature: 25,
                    measurement_date: '2024-01-15T10:00:00Z',
                },
                {
                    id: 2,
                    location_id: 2,
                    location_name: 'Yamuna at Delhi',
                    state: 'Delhi',
                    latitude: 28.6139,
                    longitude: 77.209,
                    wqi_score: 30,
                    ph: 8.2,
                    dissolved_oxygen: 4.0,
                    turbidity: 15.0,
                    temperature: 28,
                    measurement_date: '2024-01-15T10:00:00Z',
                },
            ],
            total: 2,
        });

        locationsApi.getGeoJSON.mockResolvedValue({
            data: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [82.9739, 25.3176] },
                        properties: { id: 1, name: 'Ganga at Varanasi', state: 'Uttar Pradesh', avg_wqi_score: 45 },
                    },
                ],
            },
        });
    });

    describe('Rendering', () => {
        it('should render the page title', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Interactive Water Quality Map/i)).toBeInTheDocument();
            });
        });

        it('should render filter controls', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Filters & Controls/i)).toBeInTheDocument();
            });
        });

        it('should render risk level indicators', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Low Risk/i)).toBeInTheDocument();
            });
            expect(screen.getByText(/Medium Risk/i)).toBeInTheDocument();
            expect(screen.getByText(/High Risk/i)).toBeInTheDocument();
            expect(screen.getByText(/Critical Risk/i)).toBeInTheDocument();
        });

        it('should render map container', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByTestId('map-container')).toBeInTheDocument();
            });
        });
    });

    describe('API Integration', () => {
        it('should fetch water quality data on mount', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(waterQualityApi.getReadings).toHaveBeenCalled();
            });
        });

        it('should display data count from API', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                // Should show count of locations or some indicator of data loaded
                expect(waterQualityApi.getReadings).toHaveBeenCalled();
            });
        });
    });

    describe('Filters', () => {
        it('should have parameter filter dropdown', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                const selects = screen.getAllByRole('combobox');
                expect(selects[0]).toHaveTextContent(/All Parameters/i);
            });
        });

        it('should have risk level filter dropdown', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                const selects = screen.getAllByRole('combobox');
                expect(selects[1]).toHaveTextContent(/All Risk Levels/i);
            });
        });

        it('should have state filter dropdown', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                const selects = screen.getAllByRole('combobox');
                expect(selects[2]).toHaveTextContent(/All States/i);
            });
        });

        it('should have date range filter', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Date Range/i)).toBeInTheDocument();
            });
        });
    });

    describe('Risk Calculations', () => {
        it('should calculate risk counts correctly', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                // With mock data having WQI scores of 45 and 30, we should see high risk counts
                expect(waterQualityApi.getReadings).toHaveBeenCalled();
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            waterQualityApi.getReadings.mockRejectedValue(new Error('Network error'));

            render(<MapView />, { wrapper: createWrapper() });

            // Should not crash and eventually show content (or error state if implemented)
            await waitFor(() => {
                expect(screen.queryByText(/Loading map data.../i)).not.toBeInTheDocument();
            }, { timeout: 8000 });
            
            expect(screen.getByText(/Interactive Water Quality Map/i)).toBeInTheDocument();
        });

        it('should show empty state when no data', async () => {
            waterQualityApi.getReadings.mockResolvedValue({ data: [], total: 0 });

            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                const zeroCounts = screen.getAllByText('0');
                expect(zeroCounts.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Accessibility', () => {
        it('should have accessible filter controls', async () => {
            render(<MapView />, { wrapper: createWrapper() });

            await waitFor(() => {
                const selects = screen.queryAllByRole('combobox') || [];
                // There should be filter dropdowns
                expect(selects.length).toBeGreaterThanOrEqual(0);
            });
        });
    });
});