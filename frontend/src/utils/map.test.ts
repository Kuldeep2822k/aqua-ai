import { describe, it, expect } from 'vitest';
import { getRiskLevel } from './map';

describe('getRiskLevel', () => {
  it('returns "low" for WQI >= 80', () => {
    expect(getRiskLevel(80)).toBe('low');
    expect(getRiskLevel(100)).toBe('low');
  });

  it('returns "medium" for WQI between 60 and 79', () => {
    expect(getRiskLevel(60)).toBe('medium');
    expect(getRiskLevel(79)).toBe('medium');
  });

  it('returns "high" for WQI between 40 and 59', () => {
    expect(getRiskLevel(40)).toBe('high');
    expect(getRiskLevel(59)).toBe('high');
  });

  it('returns "critical" for WQI < 40', () => {
    expect(getRiskLevel(0)).toBe('critical');
    expect(getRiskLevel(39)).toBe('critical');
  });
});
