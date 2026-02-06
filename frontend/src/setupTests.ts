// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('axios', () => {
  const axios = {
    create: () => axios,
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  return { __esModule: true, default: axios, ...axios };
});

jest.mock('react-leaflet', () => {
  const React = require('react');
  return {
    MapContainer: ({ children }: any) =>
      React.createElement('div', {}, children),
    TileLayer: () => null,
    CircleMarker: ({ children }: any) =>
      React.createElement('div', {}, children),
    Popup: ({ children }: any) => React.createElement('div', {}, children),
  };
});

// Mock IntersectionObserver
const IntersectionObserverMock = class IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  observe(target: Element): void {}
  unobserve(target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

global.IntersectionObserver = IntersectionObserverMock as any;
