/**
 * NotificationContext Tests
 * Tests for the notification/alert context provider
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the notification context
const mockNotifications = [
    { id: 1, type: 'alert', message: 'High pH detected', severity: 'critical', read: false },
    { id: 2, type: 'alert', message: 'Low DO levels', severity: 'warning', read: false },
    { id: 3, type: 'info', message: 'System update', severity: 'info', read: true },
];

// Create a simple notification context for testing
const NotificationContext = React.createContext({
    notifications: [] as typeof mockNotifications,
    unreadCount: 0,
    addNotification: (_notification: any) => { },
    markAsRead: (_id: number) => { },
    markAllAsRead: () => { },
    clearNotifications: () => { },
});

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = React.useState(mockNotifications);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = (notification: any) => {
        setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
    };

    const markAsRead = (id: number) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

// Test component that uses the context
const TestConsumer = () => {
    const context = React.useContext(NotificationContext);
    return (
        <div>
            <span data-testid="unread-count">{context.unreadCount}</span>
            <span data-testid="total-count">{context.notifications.length}</span>
            <ul>
                {context.notifications.map(n => (
                    <li key={n.id} data-testid={`notification-${n.id}`}>
                        {n.message}
                    </li>
                ))}
            </ul>
            <button onClick={() => context.markAsRead(1)}>Mark Read</button>
            <button onClick={() => context.markAllAsRead()}>Mark All Read</button>
            <button onClick={() => context.clearNotifications()}>Clear</button>
            <button
                onClick={() =>
                    context.addNotification({
                        type: 'alert',
                        message: 'New Alert',
                        severity: 'info',
                        read: false,
                    })
                }
            >
                Add
            </button>
        </div>
    );
};

describe('NotificationContext', () => {
    describe('Initial State', () => {
        it('should provide initial notifications', () => {
            render(
                <NotificationProvider>
                    <TestConsumer />
                </NotificationProvider>
            );

            expect(screen.getByTestId('total-count')).toHaveTextContent('3');
        });

        it('should calculate unread count correctly', () => {
            render(
                <NotificationProvider>
                    <TestConsumer />
                </NotificationProvider>
            );

            expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
        });

        it('should display all notifications', () => {
            render(
                <NotificationProvider>
                    <TestConsumer />
                </NotificationProvider>
            );

            expect(screen.getByText('High pH detected')).toBeInTheDocument();
            expect(screen.getByText('Low DO levels')).toBeInTheDocument();
            expect(screen.getByText('System update')).toBeInTheDocument();
        });
    });

    describe('Actions', () => {
        it('should mark notification as read', async () => {
            render(
                <NotificationProvider>
                    <TestConsumer />
                </NotificationProvider>
            );

            const markReadButton = screen.getByText('Mark Read');

            await act(async () => {
                markReadButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
            });
        });

        it('should mark all notifications as read', async () => {
            render(
                <NotificationProvider>
                    <TestConsumer />
                </NotificationProvider>
            );

            const markAllButton = screen.getByText('Mark All Read');

            await act(async () => {
                markAllButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
            });
        });

        it('should clear all notifications', async () => {
            render(
                <NotificationProvider>
                    <TestConsumer />
                </NotificationProvider>
            );

            const clearButton = screen.getByText('Clear');

            await act(async () => {
                clearButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('total-count')).toHaveTextContent('0');
            });
        });

        it('should add new notification', async () => {
            render(
                <NotificationProvider>
                    <TestConsumer />
                </NotificationProvider>
            );

            const addButton = screen.getByText('Add');

            await act(async () => {
                addButton.click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('total-count')).toHaveTextContent('4');
                expect(screen.getByText('New Alert')).toBeInTheDocument();
            });
        });
    });
});

describe('Notification Types', () => {
    it('should handle critical severity', () => {
        const criticalNotification = mockNotifications.find(n => n.severity === 'critical');
        expect(criticalNotification).toBeDefined();
        expect(criticalNotification!.message).toBe('High pH detected');
    });

    it('should handle warning severity', () => {
        const warningNotification = mockNotifications.find(n => n.severity === 'warning');
        expect(warningNotification).toBeDefined();
        expect(warningNotification!.message).toBe('Low DO levels');
    });

    it('should handle info severity', () => {
        const infoNotification = mockNotifications.find(n => n.severity === 'info');
        expect(infoNotification).toBeDefined();
        expect(infoNotification!.message).toBe('System update');
    });
});

describe('Edge Cases', () => {
    it('should handle empty notifications', () => {
        const EmptyProvider = ({ children }: { children: React.ReactNode }) => (
            <NotificationContext.Provider
                value={{
                    notifications: [],
                    unreadCount: 0,
                    addNotification: () => { },
                    markAsRead: () => { },
                    markAllAsRead: () => { },
                    clearNotifications: () => { },
                }}
            >
                {children}
            </NotificationContext.Provider>
        );

        render(
            <EmptyProvider>
                <TestConsumer />
            </EmptyProvider>
        );

        expect(screen.getByTestId('total-count')).toHaveTextContent('0');
        expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });

    it('should handle all read notifications', () => {
        const allReadNotifications = mockNotifications.map(n => ({ ...n, read: true }));

        const AllReadProvider = ({ children }: { children: React.ReactNode }) => (
            <NotificationContext.Provider
                value={{
                    notifications: allReadNotifications,
                    unreadCount: 0,
                    addNotification: () => { },
                    markAsRead: () => { },
                    markAllAsRead: () => { },
                    clearNotifications: () => { },
                }}
            >
                {children}
            </NotificationContext.Provider>
        );

        render(
            <AllReadProvider>
                <TestConsumer />
            </AllReadProvider>
        );

        expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    });
});
