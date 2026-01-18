import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders App without crashing', () => {
  render(<App />);
  // The app should render without throwing any errors
  // We're not testing for specific text as the app is complex with routing
  expect(document.body).toBeInTheDocument();
});
