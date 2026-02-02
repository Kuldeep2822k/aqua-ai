/**
 * SimpleMap Component Tests
 * Tests for the map component used across the application
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mock the performance optimizer hook
jest.mock('../../hooks/usePerformanceOptimizer', () => ({
    usePerformanceOptimizer: () => ({
        batchDOMReads: (callbacks: (() => void)[]) => callbacks.forEach(cb => cb()),
        batchDOMWrites: (callbacks: (() => void)[]) => callbacks.forEach(cb => cb()),
        createDebouncedResizeHandler: jest.fn(),
    }),
}));

// Create mock marker
const createMockMarker = () => {
    const marker: any = {
        bindPopup: jest.fn().mockImplementation(function (this: any) { return this; }),
        addTo: jest.fn().mockImplementation(function (this: any) { return this; }),
        remove: jest.fn().mockImplementation(function (this: any) { return this; }),
    };
    return marker;
};

// Create mock tile layer
const createMockTileLayer = () => ({
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
});

// Mock the API services
jest.mock('../../services/waterQualityApi', () => ({
    locationsApi: {
        getGeoJSON: jest.fn(),
    },
    calculateRiskLevel: jest.fn((score: number) => {
        if (score < 25) return 'critical';
        if (score < 50) return 'high';
        if (score < 75) return 'medium';
        return 'low';
    }),
}));

// Import after mocking
import SimpleMap from '../../components/SimpleMap';
const { locationsApi } = require('../../services/waterQualityApi');

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
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
    );
};

describe('SimpleMap Component', () => {
    const mockGeoJSONData = {
        data: {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [82.9739, 25.3176] },
                    properties: {
                        id: 1,
                        name: 'Ganga at Varanasi',
                        state: 'Uttar Pradesh',
                        avg_wqi_score: 45,
                        water_body_type: 'river',
                    },
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [77.209, 28.6139] },
                    properties: {
                        id: 2,
                        name: 'Yamuna at Delhi',
                        state: 'Delhi',
                        avg_wqi_score: 30,
                        water_body_type: 'river',
                    },
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [72.8777, 19.076] },
                    properties: {
                        id: 3,
                        name: 'Mumbai Coastal',
                        state: 'Maharashtra',
                        avg_wqi_score: 65,
                        water_body_type: 'coastal',
                    },
                },
            ],
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        locationsApi.getGeoJSON.mockResolvedValue(mockGeoJSONData);
    });

    describe('Rendering', () => {
        it('should render map container with category selector', async () => {
            render(<SimpleMap />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('Select Parameter Category:')).toBeInTheDocument();
            });
        });

        it('should render category buttons', async () => {
            render(<SimpleMap />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /critical/i })).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /basic/i })).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /chemical/i })).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /environmental/i })).toBeInTheDocument();
            });
        });

        it('should render risk level legend', async () => {
            render(<SimpleMap />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('Risk Levels')).toBeInTheDocument();
                expect(screen.getByText('Low')).toBeInTheDocument();
                expect(screen.getByText('Medium')).toBeInTheDocument();
                expect(screen.getByText('High')).toBeInTheDocument();
                // Use getAllByText for 'Critical' because it appears in multiple places
                expect(screen.getAllByText('Critical').length).toBeGreaterThan(0);
            });
        });

        it('should accept height prop', async () => {
            const { container } = render(<SimpleMap height="500px" />, { wrapper: createWrapper() });

            await waitFor(() => {
                const box = container.firstChild;
                expect(box).toBeInTheDocument();
            });
        });

        it('should accept numeric height', async () => {
            const { container } = render(<SimpleMap height={400} />, { wrapper: createWrapper() });

            await waitFor(() => {
                const box = container.firstChild;
                expect(box).toBeInTheDocument();
            });
        });
    });

    describe('API Integration', () => {
        it('should fetch location data on mount', async () => {
            render(<SimpleMap />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(locationsApi.getGeoJSON).toHaveBeenCalled();
            });
        });

        it('should display location count after data loads', async () => {
            render(<SimpleMap />, { wrapper: createWrapper() });

            await waitFor(() => {
                // The component shows filtered count - critical/high risk by default
                expect(screen.getByText(/locations \(Critical\)/)).toBeInTheDocument();
            });
        });
    });

    describe('Category Selection', () => {
        it('should change category when clicking buttons', async () => {
            render(<SimpleMap />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /basic/i })).toBeInTheDocument();
            });

            fireEvent.click(screen.getByRole('button', { name: /basic/i }));

            await waitFor(() => {
                expect(screen.getByText(/locations \(Basic\)/)).toBeInTheDocument();
            });
        });

        it('should show different parameters for each category', async () => {
            render(<SimpleMap />, { wrapper: createWrapper() });

            // Default is Critical category
            await waitFor(() => {
                expect(screen.getByText(/BOD, Heavy Metals, Industrial, Coliform/)).toBeInTheDocument();
            });

            // Click Basic category
            fireEvent.click(screen.getByRole('button', { name: /basic/i }));

            await waitFor(() => {
                expect(screen.getByText(/pH, DO, TDS, Turbidity/)).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            locationsApi.getGeoJSON.mockRejectedValue(new Error('Network error'));

            render(<SimpleMap />, { wrapper: createWrapper() });

            // Should still render without crashing
            await waitFor(() => {
                expect(screen.getByText('Select Parameter Category:')).toBeInTheDocument();
            });
        });

        it('should handle empty data', async () => {
            locationsApi.getGeoJSON.mockResolvedValue({
                data: { type: 'FeatureCollection', features: [] },
            });

            render(<SimpleMap />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('Select Parameter Category:')).toBeInTheDocument();
                expect(screen.getByText(/0 locations/)).toBeInTheDocument();
            });
        });
    });
});

describe('SimpleMap Props', () => {
    beforeEach(() => {
        locationsApi.getGeoJSON.mockResolvedValue({
            data: { type: 'FeatureCollection', features: [] },
        });
    });

    const createWrapper = () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        return ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>{children}</BrowserRouter>
            </QueryClientProvider>
        );
    };

    it('should work without any props', async () => {
        render(<SimpleMap />, { wrapper: createWrapper() });

        await waitFor(() => {
            expect(screen.getByText('Select Parameter Category:')).toBeInTheDocument();
        });
    });
});
