import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';

describe('Navbar', () => {
  const mockToggle = jest.fn();

  it('renders title and buttons', () => {
    render(<Navbar onSidebarToggle={mockToggle} title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByLabelText('open drawer')).toBeInTheDocument();
  });

  it('calls onSidebarToggle when menu icon is clicked', () => {
    render(<Navbar onSidebarToggle={mockToggle} />);

    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('opens profile menu on avatar click', () => {
    render(<Navbar onSidebarToggle={mockToggle} />);

    // Find profile button (might need specific query if label varies)
    // Using Tooltip title "Profile" or icon search
    const profileButton = screen.getByLabelText('account of current user');
    fireEvent.click(profileButton);

    // Check if menu items appear
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
