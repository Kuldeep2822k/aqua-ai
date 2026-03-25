import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  it('calls callback when clicking outside the ref', () => {
    const callback = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);

    const ref = { current: div };
    renderHook(() => useClickOutside(ref, callback));

    // Click outside
    const event = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
    document.body.removeChild(div);
  });

  it('does NOT call callback when clicking inside the ref', () => {
    const callback = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);

    const ref = { current: div };
    renderHook(() => useClickOutside(ref, callback));

    // Click inside
    const event = new MouseEvent('mousedown', { bubbles: true });
    div.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });
});
