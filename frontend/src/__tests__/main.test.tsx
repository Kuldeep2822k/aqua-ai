import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../App', () => ({
  default: () => <div>Mock App</div>,
}));

describe('main entry', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.resetModules();
  });

  it('mounts without crashing', async () => {
    await import('../main');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.body.textContent).toContain('Mock App');
  });
});
