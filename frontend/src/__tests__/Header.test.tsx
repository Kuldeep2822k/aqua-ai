import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { Header } from '../components/Header';
import { alertsApi } from '../services/api';

vi.mock('../services/api', () => ({
  alertsApi: {
    getActive: vi.fn(),
  },
}));

describe('Header', () => {
  it('indicates current page via aria-current', () => {
    // Mock getActive to return empty array to avoid unhandled promise rejections or errors
    (alertsApi.getActive as Mock).mockResolvedValue({ data: [] });

    render(
      <Header
        currentPage="dashboard"
        onNavigate={vi.fn()}
        theme="light"
        onThemeToggle={vi.fn()}
      />
    );

    const dashboardLink = screen.getByRole('button', { name: /dashboard/i });
    const mapLink = screen.getByRole('button', { name: /interactive map/i });

    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    expect(mapLink).not.toHaveAttribute('aria-current');
  });

  it('shows unread count in notification button aria-label', async () => {
    (alertsApi.getActive as Mock).mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
    });

    render(
      <Header
        currentPage="dashboard"
        onNavigate={vi.fn()}
        theme="light"
        onThemeToggle={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Notifications, 3 new/i })
      ).toBeInTheDocument();
    });
  });

  it('shows default notification label when no unread notifications', async () => {
    (alertsApi.getActive as Mock).mockResolvedValue({ data: [] });

    render(
      <Header
        currentPage="dashboard"
        onNavigate={vi.fn()}
        theme="light"
        onThemeToggle={vi.fn()}
      />
    );

    // Using getAllByRole to handle potential duplicate elements (though unexpected)
    // This ensures the element exists and is accessible
    const buttons = screen.getAllByRole('button', { name: /^Notifications$/i });
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]).toBeInTheDocument();
  });
});
