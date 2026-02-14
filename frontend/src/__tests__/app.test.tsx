import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const appMocks = vi.hoisted(() => ({ dashboardThrows: false }));

vi.mock('../pages/Dashboard', () => ({
  Dashboard: () => {
    if (appMocks.dashboardThrows) {
      throw new Error('Dashboard crash');
    }
    return <div>Dashboard Page</div>;
  },
}));

vi.mock('../pages/MapViewPage', () => ({
  MapViewPage: () => <div>Map Page</div>,
}));

vi.mock('../pages/AlertsPage', () => ({
  AlertsPage: () => <div>Alerts Page</div>,
}));

vi.mock('../pages/AnalyticsPage', () => ({
  AnalyticsPage: () => <div>Analytics Page</div>,
}));

vi.mock('../pages/SettingsPage', () => ({
  SettingsPage: () => <div>Settings Page</div>,
}));

vi.mock('../services/api', () => ({
  alertsApi: {
    getActive: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

afterEach(() => {
  appMocks.dashboardThrows = false;
  document.documentElement.classList.remove('dark');
  vi.clearAllMocks();
});

describe('App', () => {
  it('navigates between pages via header', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
    await user.click(screen.getByText('Interactive Map'));
    expect(await screen.findByText('Map Page')).toBeInTheDocument();
    await user.click(screen.getByText('Alerts'));
    expect(await screen.findByText('Alerts Page')).toBeInTheDocument();
    await user.click(screen.getByText('Analytics'));
    expect(await screen.findByText('Analytics Page')).toBeInTheDocument();
  });

  it('toggles dark theme via header', async () => {
    const user = userEvent.setup();
    render(<App />);
    const [toggle] = screen.getAllByRole('button', {
      name: /switch to dark mode/i,
    });
    await user.click(toggle);
    await waitFor(() =>
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    );
  });

  it('shows error boundary fallback on render errors', async () => {
    appMocks.dashboardThrows = true;
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(<App />);
      expect(
        await screen.findByText('Something went wrong')
      ).toBeInTheDocument();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
