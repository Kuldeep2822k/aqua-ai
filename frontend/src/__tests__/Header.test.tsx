import { render, screen, waitFor, within } from '@testing-library/react';
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

  it('renders navigation elements', async () => {
    render(<Header {...defaultProps} />);
    const primaryNav = screen.getByRole('navigation', {
      name: /primary navigation/i,
    });
    expect(
      await within(primaryNav).findByText('Dashboard')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('routes search submissions to the matching section', async () => {
    const user = userEvent.setup();
    render(<Header {...defaultProps} />);

    await user.type(screen.getByLabelText('Search'), 'critical alerts{enter}');

    expect(defaultProps.onNavigate).toHaveBeenCalledWith('alerts');
  });

  it('displays correct notification count in aria-label', async () => {
    // Mock notifications
    vi.mocked(alertsApi.getActive).mockResolvedValue({
      data: [
        { id: '1', location_name: 'Loc1', severity: 'critical' },
        { id: '2', location_name: 'Loc2', severity: 'high' },
      ],
    } as never);

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
    expect(helpButton).toBeDisabled();

    // Check Sign Out button
    const signOutButton = screen.getByText('Sign Out').closest('button');
    expect(signOutButton).toBeDisabled();
  });
});
