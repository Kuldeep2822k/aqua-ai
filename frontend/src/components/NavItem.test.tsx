import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavItem } from './NavItem';

describe('NavItem', () => {
  it('renders label', () => {
    render(
      <NavItem
        page="dashboard"
        label="Dashboard"
        icon={<span>icon</span>}
        currentPage="dashboard"
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('applies active styles when current', () => {
    render(
      <NavItem
        page="dashboard"
        label="Dashboard"
        icon={<span>icon</span>}
        currentPage="dashboard"
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByRole('button')).toHaveClass('text-blue-600');
  });

  it('calls onNavigate on click', async () => {
    const onNavigate = vi.fn();
    render(
      <NavItem
        page="map"
        label="Map"
        icon={<span>icon</span>}
        currentPage="dashboard"
        onNavigate={onNavigate}
      />
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onNavigate).toHaveBeenCalledWith('map');
  });
});
