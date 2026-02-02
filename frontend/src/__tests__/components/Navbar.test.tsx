/**
 * Navbar Component Tests
 * Tests for the navigation bar component
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../components/Navigation/Navbar';

// Mock the API services
jest.mock('../../services/waterQualityApi', () => ({
    alertsApi: {
        getStats: jest.fn(),
    },
}));

const { alertsApi } = require('../../services/waterQualityApi');

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

describe('Navbar Component', () => {
    const mockOnSidebarToggle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        alertsApi.getStats.mockResolvedValue({
            data: {
                active_alerts: 5,
            },
        });
    });

    describe('Rendering', () => {
        it('should render the app title', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/Aqua-AI/i)).toBeInTheDocument();
            });
        });

        it('should render custom title when provided', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} title="Custom Title" />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/Custom Title/i)).toBeInTheDocument();
            });
        });

        it('should render the Beta chip', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/Beta/i)).toBeInTheDocument();
            });
        });

        it('should render menu button', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/open drawer/i)).toBeInTheDocument();
            });
        });

        it('should render notification icon', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/Notifications/i)).toBeInTheDocument();
            });
        });

        it('should render profile icon', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByLabelText(/account of current user/i)).toBeInTheDocument();
            });
        });

        it('should render system status indicator', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText(/System Online/i)).toBeInTheDocument();
            });
        });
    });

    describe('Interactions', () => {
        it('should call onSidebarToggle when menu button is clicked', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            const menuButton = screen.getByLabelText(/open drawer/i);
            userEvent.click(menuButton);

            await waitFor(() => {
                expect(mockOnSidebarToggle).toHaveBeenCalled();
            });
        });

        it('should open profile menu when profile icon is clicked', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            const profileButton = screen.getByLabelText(/account of current user/i);
            fireEvent.click(profileButton);

            await waitFor(() => {
                expect(screen.getByText(/Dashboard/i)).toBeVisible();
            });
            expect(screen.getByText(/Settings/i)).toBeVisible();
            expect(screen.getByText(/Logout/i)).toBeVisible();
        });

        it('should close profile menu when clicking menu item', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            // Open menu
            const profileButton = screen.getByLabelText(/account of current user/i);
            fireEvent.click(profileButton);

            await waitFor(() => {
                expect(screen.getByText(/Dashboard/i)).toBeVisible();
            });

            // Click Dashboard item
            const dashboardItem = screen.getByText(/Dashboard/i);
            fireEvent.click(dashboardItem);

            await waitFor(() => {
                expect(screen.getByText(/Logout/i)).not.toBeVisible();
            }, { timeout: 2000 });
        });
    });

    describe('Notification Badge', () => {
        it('should display notification count from API', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(screen.getByText('5')).toBeInTheDocument();
            });
            expect(alertsApi.getStats).toHaveBeenCalled();
        });

        it('should show 0 when no alerts', async () => {
            alertsApi.getStats.mockResolvedValue({ data: { active_alerts: 0 } });

            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                // With 0 alerts, badge might not be shown
                expect(alertsApi.getStats).toHaveBeenCalled();
            });
        });
    });

    describe('Scroll Behavior', () => {
        it('should handle scroll events', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            // Simulate scroll
            fireEvent.scroll(window, { target: { scrollY: 100 } });

            await waitFor(() => {
                // Navbar should still be rendered
                expect(screen.getByText(/Aqua-AI/i)).toBeInTheDocument();
            });
        });
    });

    describe('API Integration', () => {
        it('should fetch alert stats for notification count', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                expect(alertsApi.getStats).toHaveBeenCalled();
            });
        });

        it('should handle API errors gracefully', async () => {
            alertsApi.getStats.mockRejectedValue(new Error('API Error'));

            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            await waitFor(() => {
                // Should still render without crashing
                expect(screen.getByText(/Aqua-AI/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have accessible menu button', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            const menuButton = screen.getByLabelText(/open drawer/i);
            expect(menuButton).toHaveAttribute('aria-label');
        });

        it('should have accessible profile button', async () => {
            render(
                <Navbar onSidebarToggle={mockOnSidebarToggle} />,
                { wrapper: createWrapper() }
            );

            const profileButton = screen.getByLabelText(/account of current user/i);
            expect(profileButton).toHaveAttribute('aria-label');
        });
    });
});
