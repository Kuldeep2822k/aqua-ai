import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Navbar from './Navbar';

expect.extend(toHaveNoViolations);

describe('Navbar Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <Navbar onSidebarToggle={() => {}} title="Aqua-AI" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
