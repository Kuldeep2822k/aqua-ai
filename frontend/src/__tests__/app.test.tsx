import { render, screen, waitFor, within } from '@testing-library/react';
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
  window.history.replaceState({}, '', '/');
  vi.clearAllMocks();
});

describe('App', () => {
  it('opens the dashboard from the landing page', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/');
    render(<App />);
    expect(
      await screen.findByText('Environmental intelligence / water risk / India')
    ).toBeInTheDocument();
    await user.click(
      screen.getAllByRole('button', { name: /enter console/i })[0]
    );
    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
  });

  it('navigates between pages via header', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/app');
    render(<App />);
    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
    const primaryNav = screen.getByRole('navigation', {
      name: /primary navigation/i,
    });
    await user.click(within(primaryNav).getByText('Interactive Map'));
    expect(await screen.findByText('Map Page')).toBeInTheDocument();
    await user.click(within(primaryNav).getByText('Alerts'));
    expect(await screen.findByText('Alerts Page')).toBeInTheDocument();
    await user.click(within(primaryNav).getByText('Analytics'));
    expect(await screen.findByText('Analytics Page')).toBeInTheDocument();
  });

  it('toggles dark theme via header', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/app');
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
      window.history.replaceState({}, '', '/app');
      render(<App />);
      expect(
        await screen.findByText('Something went wrong')
      ).toBeInTheDocument();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
