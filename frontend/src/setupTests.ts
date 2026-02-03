// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock IntersectionObserver
const IntersectionObserverMock = class IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  observe(target: Element): void { }
  unobserve(target: Element): void { }
  disconnect(): void { }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

global.IntersectionObserver = IntersectionObserverMock as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
}) as typeof requestAnimationFrame;
global.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as typeof cancelAnimationFrame;

// Robust Leaflet Mock
jest.mock('leaflet', () => {
  const mockLayer = {
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn().mockReturnThis(),
    removeFrom: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    unbindPopup: jest.fn().mockReturnThis(),
    openPopup: jest.fn().mockReturnThis(),
    closePopup: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),
    setStyle: jest.fn().mockReturnThis(),
  };

  const mockMap = {
    addLayer: jest.fn().mockReturnThis(),
    removeLayer: jest.fn().mockReturnThis(),
    hasLayer: jest.fn().mockReturnValue(false),
    setView: jest.fn().mockReturnThis(),
    fitBounds: jest.fn().mockReturnThis(),
    setZoom: jest.fn().mockReturnThis(),
    getZoom: jest.fn().mockReturnValue(5),
    getCenter: jest.fn().mockReturnValue({ lat: 0, lng: 0 }),
    remove: jest.fn().mockReturnThis(),
    invalidateSize: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),
    getContainer: jest.fn().mockReturnValue({ appendChild: jest.fn(), removeChild: jest.fn() }),
  };

  const LeafletMock = {
    map: jest.fn(() => mockMap),
    tileLayer: jest.fn(() => mockLayer),
    marker: jest.fn(() => mockLayer),
    circleMarker: jest.fn(() => mockLayer),
    circle: jest.fn(() => mockLayer),
    polyline: jest.fn(() => mockLayer),
    polygon: jest.fn(() => mockLayer),
    rectangle: jest.fn(() => mockLayer),
    geoJSON: jest.fn(() => mockLayer),
    layerGroup: jest.fn(() => ({
      ...mockLayer,
      addLayer: jest.fn().mockReturnThis(),
      removeLayer: jest.fn().mockReturnThis(),
      clearLayers: jest.fn().mockReturnThis(),
      getLayers: jest.fn().mockReturnValue([]),
    })),
    featureGroup: jest.fn(() => ({
      ...mockLayer,
      addLayer: jest.fn().mockReturnThis(),
      removeLayer: jest.fn().mockReturnThis(),
      clearLayers: jest.fn().mockReturnThis(),
    })),
    latLng: jest.fn((lat, lng) => ({ lat, lng })),
    latLngBounds: jest.fn(() => ({
      extend: jest.fn().mockReturnThis(),
      getCenter: jest.fn().mockReturnValue({ lat: 0, lng: 0 }),
    })),
    icon: jest.fn(() => ({})),
    divIcon: jest.fn(() => ({})),
    Icon: {
      Default: {
        prototype: {
          _getIconUrl: jest.fn(),
        },
        mergeOptions: jest.fn(),
      },
    },
    // Constructors (for when used with 'new')
    Map: jest.fn(() => mockMap),
    Layer: jest.fn(() => mockLayer),
    LayerGroup: jest.fn().mockImplementation(function() {
      return {
        ...mockLayer,
        addLayer: jest.fn().mockReturnThis(),
        removeLayer: jest.fn().mockReturnThis(),
        clearLayers: jest.fn().mockReturnThis(),
        getLayers: jest.fn().mockReturnValue([]),
      };
    }),
    Marker: jest.fn(() => mockLayer),
    CircleMarker: jest.fn(() => mockLayer),
    Control: {
      extend: jest.fn().mockReturnThis(),
    },
  };

  return {
    __esModule: true,
    default: LeafletMock,
    ...LeafletMock,
  };
});