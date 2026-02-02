/**
 * Analytics Page Tests
 * Tests for the Analytics page with charts
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Analytics from '../../pages/Analytics';

// Mock the API services
jest.mock('../../services/waterQualityApi', () => ({
    locationsApi: {
        getStats: jest.fn(),
    },
    alertsApi: {
        getStats: jest.fn(),
    },
    waterQualityApi: {
        getStats: jest.fn(),
    },
}));

// Mock LazyChart to avoid chart rendering issues in tests
jest.mock('../../components/LazyChart', () => ({
    useReChartsComponents: () => ({
        components: {
            LineChart: () => <div data-testid="line-chart">LineChart</div>,
            Line: () => null,
            XAxis: () => null,
            YAxis: () => null,
            CartesianGrid: () => null,
            Tooltip: () => null,
            Legend: () => null,
            ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
            BarChart: () => <div data-testid="bar-chart">BarChart</div>,
            Bar: () => null,
            PieChart: () => <div data-testid="pie-chart">PieChart</div>,
            Pie: () => null,
            Cell: () => null,
        },
        loading: false,
        error: null,
    }),
}));

const { locationsApi, alertsApi, waterQualityApi } = require('../../services/waterQualityApi');

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

describe('Analytics Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        locationsApi.getStats.mockResolvedValue({
            data: {
                total_locations: 100,
                states_covered: 10,
                water_body_types: ['river', 'lake', 'coastal'],
            },
        });

        alertsApi.getStats.mockResolvedValue({
            data: {
                active_alerts: 10,
                severity_distribution: { critical: 2, warning: 5, info: 3 },
            },
        });

        waterQualityApi.getStats.mockResolvedValue({
            data: {
                total_readings: 5000,
                average_ph: 7.2,
            },
        });
    });

    describe('Rendering', () => {
        it('should render the page title', async () => {
            render(<Analytics />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Water Quality Analytics/i)).toBeInTheDocument();
            });
        });

        it('should render chart sections', async () => {
            render(<Analytics />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Water Quality Parameter Trends/i)).toBeInTheDocument();
            });
        });

        it('should render location distribution section', async () => {
            render(<Analytics />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Monitoring Sites Distribution/i)).toBeInTheDocument();
            });
        });

        it('should render alert frequency section', async () => {
            render(<Analytics />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Alert Frequency by Type/i)).toBeInTheDocument();
            });
        });
    });

    describe('API Integration', () => {
        it('should fetch location stats', async () => {
            render(<Analytics />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(locationsApi.getStats).toHaveBeenCalled();
            });
        });

        it('should fetch alert stats', async () => {
            render(<Analytics />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(alertsApi.getStats).toHaveBeenCalled();
            });
        });
    });

    describe('Charts', () => {
        it('should render line chart for trends', async () => {
            render(<Analytics />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByTestId('line-chart')).toBeInTheDocument();
            });
        });

        it('should render pie chart for distribution', async () => {
            render(<Analytics />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
            });
        });

        it('should render bar chart for alerts', async () => {
            render(<Analytics />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
            });
        });
    });

    describe('Loading States', () => {
        it('should show loading state initially', () => {
            // Override mock to simulate loading
            jest.doMock('../../components/LazyChart', () => ({
                useReChartsComponents: () => ({
                    components: null,
                    loading: true,
                    error: null,
                }),
            }));

            // Component should handle loading gracefully
            render(<Analytics />, { wrapper: createWrapper() });
            expect(screen.getByText(/Water Quality Analytics/i)).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            locationsApi.getStats.mockRejectedValue(new Error('API Error'));

            render(<Analytics />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Water Quality Analytics/i)).toBeInTheDocument();
            });
        });
    });
});