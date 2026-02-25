import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../pages/SettingsPage';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SettingsPage Accessibility', () => {
  it('renders Save Changes button and handles accessible disabled state correctly', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();

    render(<SettingsPage theme="light" onThemeChange={onThemeChange} />);

    // Find the Save Changes button in the Account section (default active section)
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    // Initially, the button should be enabled and not have aria-disabled
    expect(saveButton).toBeEnabled();
    expect(saveButton).toHaveAttribute('aria-disabled', 'false');

    // Click the button to trigger save
    await user.click(saveButton);

    // Verify that the button becomes aria-disabled during saving
    // But remains technically enabled (focusable)
    // Note: The saving process takes 400ms in the component
    await waitFor(() => {
      expect(saveButton).toHaveAttribute('aria-disabled', 'true');
      expect(saveButton).toBeEnabled(); // Still focusable
    });

    // Verify the text changes to "Saving..."
    expect(saveButton).toHaveTextContent('Saving...');

    // Try clicking again to ensure no double submission (idempotency)
    // The component logic should prevent another save if savingSection is set
    await user.click(saveButton);

    // Wait for the original save to complete (400ms)
    // After 400ms, the button should reset
    await waitFor(() => {
        expect(saveButton).toHaveAttribute('aria-disabled', 'false');
        expect(saveButton).toHaveTextContent('Save Changes');
    }, { timeout: 1000 });
  });
});
