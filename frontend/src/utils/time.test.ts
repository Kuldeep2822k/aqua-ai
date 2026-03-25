import { describe, it, expect, vi, afterEach } from 'vitest';
import { timeAgo } from './time';

describe('timeAgo', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for times less than 60 seconds ago', () => {
    const now = new Date();
    expect(timeAgo(now.toISOString())).toBe('Just now');
  });

  it('returns minutes ago correctly', () => {
    const minAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 mins
    expect(timeAgo(minAgo.toISOString())).toBe('5m ago');
  });

  it('returns hours ago correctly', () => {
    const hourAgo = new Date(Date.now() - 3 * 3600 * 1000); // 3 hours
    expect(timeAgo(hourAgo.toISOString())).toBe('3h ago');
  });

  it('returns days ago correctly', () => {
    const dayAgo = new Date(Date.now() - 2 * 86400 * 1000); // 2 days
    expect(timeAgo(dayAgo.toISOString())).toBe('2d ago');
  });
});
