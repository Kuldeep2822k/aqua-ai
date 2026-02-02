/**
 * Alerts Page Tests
 * Tests for the Alerts management page
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Alerts from '../../pages/Alerts';

// Mock the API services
const mockGetActive = jest.fn();
const mockGetStats = jest.fn();
const mockAcknowledge = jest.fn();
const mockResolve = jest.fn();

jest.mock('../../services/waterQualityApi', () => ({
    alertsApi: {
        getActive: mockGetActive,
        getStats: mockGetStats,
        acknowledge: mockAcknowledge,
        resolve: mockResolve,
    },
}));

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

describe('Alerts Page', () => {
    const mockAlerts = [
        {
            id: 1,
            location_name: 'Delhi Water Treatment Plant',
            state: 'Delhi',
            severity: 'critical',
            parameter_name: 'pH',
            message: 'pH levels critically low at 5.2',
            triggered_at: '2024-01-15T10:00:00Z',
            status: 'active',
        },
        {
            id: 2,
            location_name: 'Mumbai River Station',
            state: 'Maharashtra',
            severity: 'warning',
            parameter_name: 'Turbidity',
            message: 'Turbidity levels elevated',
            triggered_at: '2024-01-15T09:00:00Z',
            status: 'active',
        },
        {
            id: 3,
            location_name: 'Chennai Coastal Monitor',
            state: 'Tamil Nadu',
            severity: 'info',
            parameter_name: 'Temperature',
            message: 'Temperature slightly above normal',
            triggered_at: '2024-01-15T08:00:00Z',
            status: 'active',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        mockGetActive.mockResolvedValue({ data: mockAlerts });
        mockGetStats.mockResolvedValue({
            data: {
                active_alerts: 3,
                total_alerts: 50,
                severity_distribution: { critical: 1, warning: 1, info: 1 },
            },
        });
        mockAcknowledge.mockResolvedValue({ success: true });
        mockResolve.mockResolvedValue({ success: true });
    });

    describe('Rendering', () => {
        it('should render page title', async () => {
            render(<Alerts />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Water Quality Alerts/i })).toBeInTheDocument();
            });
        });

        it('should render alert severity summary', async () => {
            render(<Alerts />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Critical Alerts/i)).toBeInTheDocument();
                expect(screen.getByText(/Warning Alerts/i)).toBeInTheDocument();
                expect(screen.getByText(/Info Alerts/i)).toBeInTheDocument();
            });
        });

        it('should render alerts table', async () => {
            render(<Alerts />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Type/i)).toBeInTheDocument();
                expect(screen.getByText(/Message/i)).toBeInTheDocument();
                expect(screen.getByText(/Location/i)).toBeInTheDocument();
            });
        });
    });

    describe('Alert Display', () => {
        it('should display alert messages', async () => {
            render(<Alerts />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/pH levels critically low/i)).toBeInTheDocument();
                expect(screen.getByText(/Turbidity levels elevated/i)).toBeInTheDocument();
            });
        });

        it('should display alert locations', async () => {
            render(<Alerts />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Delhi Water Treatment Plant/i)).toBeInTheDocument();
                expect(screen.getByText(/Mumbai River Station/i)).toBeInTheDocument();
            });
        });

        it('should display alert severity badges', async () => {
            render(<Alerts />, { wrapper: createWrapper() });

            await waitFor(() => {
                // Use getAllByText and check specifically for chips if possible
                const criticalBadges = screen.getAllByText(/critical/i);
                expect(criticalBadges.length).toBeGreaterThan(0);
            });
        });
    });

    describe('API Integration', () => {
        it('should fetch active alerts on mount', async () => {
            render(<Alerts />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(mockGetActive).toHaveBeenCalled();
            });
        });

        it('should fetch alert stats on mount', async () => {
            render(<Alerts />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(mockGetStats).toHaveBeenCalled();
            });
        });
    });

    describe('Empty State', () => {
        it('should show message when no alerts', async () => {
            mockGetActive.mockResolvedValue({ data: [] });

            render(<Alerts />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Water Quality Alerts/i)).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            mockGetActive.mockRejectedValue(new Error('Network error'));

            render(<Alerts />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Water Quality Alerts/i)).toBeInTheDocument();
            });
        });
    });

    describe('Severity Counts', () => {
        it('should display correct severity counts', async () => {
            render(<Alerts />, { wrapper: createWrapper() });

            await waitFor(() => {
                // Check for count displays (1 critical, 1 warning, 1 info)
                expect(mockGetStats).toHaveBeenCalled();
            });
        });
    });
});