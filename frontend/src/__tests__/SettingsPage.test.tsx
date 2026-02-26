import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../pages/SettingsPage';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SettingsPage Accessibility', () => {
  it('renders accessible disabled buttons in profile section', async () => {
    const user = userEvent.setup();
    render(<SettingsPage theme="light" onThemeChange={() => {}} />);

    // Find the save button in profile section (it's the first one rendered by default)
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    // Click the button to trigger saving state
    await user.click(saveButton);

    // Verify button enters loading state
    expect(saveButton).toHaveTextContent(/saving/i);

    // Verify accessibility attributes
    // It should have aria-disabled="true"
    expect(saveButton).toHaveAttribute('aria-disabled', 'true');

    // It should NOT have the disabled attribute (so it remains focusable)
    expect(saveButton).not.toBeDisabled();

    // Verify it is still focusable
    saveButton.focus();
    expect(saveButton).toHaveFocus();
  });
});
