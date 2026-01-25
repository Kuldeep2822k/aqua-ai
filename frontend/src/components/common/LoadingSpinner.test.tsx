import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  test('renders with default text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders with custom text', () => {
    render(<LoadingSpinner text="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  test('renders without text when text is null', () => {
    // @ts-ignore - testing prop behavior
    render(<LoadingSpinner text={null} />);
    const textElement = screen.queryByText('Loading...');
    expect(textElement).not.toBeInTheDocument();
  });
});
