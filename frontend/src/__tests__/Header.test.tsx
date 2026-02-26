import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Header } from '../components/Header';
import { alertsApi } from '../services/api';

vi.mock('../services/api', () => ({
  alertsApi: {
    getActive: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('Header Component', () => {
  const defaultProps = {
    currentPage: 'dashboard' as const,
    onNavigate: vi.fn(),
    theme: 'light' as const,
    onThemeToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation elements', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // Use getAllByLabelText in case of weird duplication, though there should be one
    const notificationButtons = screen.getAllByLabelText('Notifications');
    expect(notificationButtons.length).toBeGreaterThan(0);
  });

  it('displays correct notification count in aria-label', async () => {
    // Mock notifications
    vi.mocked(alertsApi.getActive).mockResolvedValue({
      data: [
        { id: '1', location_name: 'Loc1', severity: 'critical' },
        { id: '2', location_name: 'Loc2', severity: 'high' },
      ],
    } as any);

    render(<Header {...defaultProps} />);

    await waitFor(() => expect(alertsApi.getActive).toHaveBeenCalled());

    // Wait for notifications to load and update aria-label
    await waitFor(() => {
      const notificationButton = screen.getByLabelText('Notifications, 2 new');
      expect(notificationButton).toBeInTheDocument();
    });
  });

  it('renders accessible disabled buttons in profile menu', async () => {
    const user = userEvent.setup();
    render(<Header {...defaultProps} />);

    // Open profile menu
    const profileButtons = screen.getAllByLabelText('Profile menu');
    await user.click(profileButtons[0]);

    // Check Help & Support button
    const helpButton = screen.getByText('Help & Support').closest('button');
    expect(helpButton).not.toBeDisabled();
    expect(helpButton).toHaveAttribute('aria-disabled', 'true');

    // Check Sign Out button
    const signOutButton = screen.getByText('Sign Out').closest('button');
    expect(signOutButton).not.toBeDisabled();
    expect(signOutButton).toHaveAttribute('aria-disabled', 'true');
  });
});
