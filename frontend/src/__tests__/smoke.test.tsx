import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import App from '../App';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

describe('frontend smoke', () => {
  it('runs', () => {
    render(<App />);
    expect(screen.getByText('Aqua-AI')).toBeInTheDocument();
  });
});
