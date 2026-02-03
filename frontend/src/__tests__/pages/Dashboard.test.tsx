/**
 * Dashboard Page Tests
 * Tests for the main Dashboard component
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Dashboard from '../../pages/Dashboard';

// Mock the API services
jest.mock('../../services/waterQualityApi', () => ({
    locationsApi: {
        getStats: jest.fn(),
    },
    alertsApi: {
        getStats: jest.fn(),
        getActive: jest.fn(),
    },
}));

// Mock components that have complex dependencies
jest.mock('../../components/DashboardMap', () => {
    return function MockDashboardMap() {
        return <div data-testid="dashboard-map">Dashboard Map</div>;
    };
});

jest.mock('../../components/ExportDialog', () => {
    return function MockExportDialog({ open }: { open: boolean }) {
        return open ? <div data-testid="export-dialog">Export Dialog</div> : null;
    };
});

const { locationsApi, alertsApi } = require('../../services/waterQualityApi');

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

describe('Dashboard Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock responses
        locationsApi.getStats.mockResolvedValue({
            data: {
                total_locations: 150,
                states_covered: 12,
                average_wqi_score: 65,
                locations_with_alerts: 23,
            },
        });

        alertsApi.getStats.mockResolvedValue({
            data: {
                active_alerts: 5,
                total_alerts: 100,
                severity_distribution: { critical: 2, warning: 2, info: 1 },
            },
        });

        alertsApi.getActive.mockResolvedValue({
            data: [
                {
                    id: 1,
                    location_name: 'Delhi',
                    state: 'Delhi',
                    severity: 'critical',
                    parameter_name: 'pH',
                    message: 'pH level critical',
                    triggered_at: '2024-01-15T10:00:00Z',
                },
                {
                    id: 2,
                    location_name: 'Mumbai',
                    state: 'Maharashtra',
                    severity: 'warning',
                    parameter_name: 'Turbidity',
                    message: 'Turbidity elevated',
                    triggered_at: '2024-01-15T09:00:00Z',
                },
            ],
        });
    });

    describe('Rendering', () => {
        it('should render the dashboard title', async () => {
            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Water Quality Dashboard/i })).toBeInTheDocument();
            });
        });

        it('should render four metric cards', async () => {
            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Water Bodies Monitored/i)).toBeInTheDocument();
                expect(screen.getByText(/Active Alerts/i)).toBeInTheDocument();
                expect(screen.getByText(/Quality Score/i)).toBeInTheDocument();
                expect(screen.getByText(/States Covered/i)).toBeInTheDocument();
            });
        });

        it('should render the dashboard map', async () => {
            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByTestId('dashboard-map')).toBeInTheDocument();
            });
        });

        it('should render recent alerts section', async () => {
            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Recent Alerts/i })).toBeInTheDocument();
            });
        });
    });

    describe('API Integration', () => {
        it('should call location stats API on mount', async () => {
            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(locationsApi.getStats).toHaveBeenCalled();
            });
        });

        it('should call alert stats API on mount', async () => {
            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(alertsApi.getStats).toHaveBeenCalled();
            });
        });

        it('should call active alerts API on mount', async () => {
            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(alertsApi.getActive).toHaveBeenCalledWith({ limit: 5 });
            });
        });

        it('should display API data in metric cards', async () => {
            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('150')).toBeInTheDocument(); // total_locations
                expect(screen.getByText('5')).toBeInTheDocument(); // active_alerts
                expect(screen.getByText('12')).toBeInTheDocument(); // states_covered
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            locationsApi.getStats.mockRejectedValue(new Error('API Error'));

            render(<Dashboard />, { wrapper: createWrapper() });

            // Should still render without crashing
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Water Quality Dashboard/i })).toBeInTheDocument();
            });
        });

        it('should show 0 when API returns no data', async () => {
            locationsApi.getStats.mockResolvedValue({ data: null });
            alertsApi.getStats.mockResolvedValue({ data: null });

            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const zeroElements = screen.getAllByText('0');
                expect(zeroElements.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Alerts Display', () => {
        it('should display recent alerts from API', async () => {
            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getAllByText(/Delhi/i).length).toBeGreaterThan(0);
                expect(screen.getAllByText(/pH/i).length).toBeGreaterThan(0);
            });
        });

        it('should show empty state when no alerts', async () => {
            alertsApi.getActive.mockResolvedValue({ data: [] });

            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Recent Alerts/i })).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading hierarchy', async () => {
            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                const heading = screen.getByRole('heading', { level: 1 });
                expect(heading).toHaveTextContent(/Water Quality Dashboard/i);
            });
        });

        it('should have accessible metric cards', async () => {
            render(<Dashboard />, { wrapper: createWrapper() });

            await waitFor(() => {
                // MUI Cards use MuiCard-root class, we can look for that if role is not set
                const cards = document.querySelectorAll('.MuiCard-root');
                expect(cards.length).toBeGreaterThan(0);
            });
        });
    });
});
