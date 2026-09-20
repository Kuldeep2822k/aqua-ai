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

  it('renders primary navigation in the field journal masthead', () => {
    render(<Header {...defaultProps} />);
    const primaryNav = screen.getByRole('navigation', {
      name: 'Primary navigation',
    });
    expect(within(primaryNav).getByText('Briefing')).toBeInTheDocument();
    expect(within(primaryNav).getByText('Map')).toBeInTheDocument();
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('routes search submissions to the matching section', async () => {
    const user = userEvent.setup();
    render(<Header {...defaultProps} />);
    await user.type(screen.getByLabelText('Search'), 'critical alerts{enter}');
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('alerts');
  });

  it('displays correct notification count in aria-label', async () => {
    vi.mocked(alertsApi.getActive).mockResolvedValue({
      data: [
        { id: '1', location_name: 'Loc1', severity: 'critical' },
        { id: '2', location_name: 'Loc2', severity: 'high' },
      ],
    } as never);

    render(<Header {...defaultProps} />);
    await waitFor(() => expect(alertsApi.getActive).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByLabelText('Notifications, 2 new')).toBeInTheDocument()
    );
  });

  it('keeps demo sign out unavailable in the profile menu', async () => {
    const user = userEvent.setup();
    render(<Header {...defaultProps} />);
    await user.click(screen.getByLabelText('Profile menu'));
    expect(screen.getByText('Sign out (demo)')).toBeDisabled();
  });
});
