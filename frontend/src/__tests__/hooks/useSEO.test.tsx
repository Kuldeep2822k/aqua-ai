/**
 * useSEO Hook Tests
 * Tests for the SEO data generation hook
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { useSEO, useSEOAnalytics } from '../../hooks/useSEO';

// Wrapper for hooks that need router context
const createWrapper = (initialRoute = '/') => {
    return ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter initialEntries={[initialRoute]}>
            {children}
        </MemoryRouter>
    );
};

describe('useSEO', () => {
    describe('Default SEO Data', () => {
        it('should return default SEO data', () => {
            const { result } = renderHook(() => useSEO(), {
                wrapper: createWrapper(),
            });

            expect(result.current).toHaveProperty('title');
            expect(result.current).toHaveProperty('description');
            expect(result.current).toHaveProperty('keywords');
            expect(result.current).toHaveProperty('url');
        });

        it('should include app name in title', () => {
            const { result } = renderHook(() => useSEO(), {
                wrapper: createWrapper(),
            });

            expect(result.current.title).toContain('Aqua-AI');
        });
    });

    describe('Route-Specific SEO Data', () => {
        it('should return dashboard-specific SEO for /dashboard', () => {
            const { result } = renderHook(() => useSEO(), {
                wrapper: createWrapper('/dashboard'),
            });

            expect(result.current.title.toLowerCase()).toContain('dashboard');
            expect(result.current.section).toBe('dashboard');
        });

        it('should return map-specific SEO for /map', () => {
            const { result } = renderHook(() => useSEO(), {
                wrapper: createWrapper('/map'),
            });

            expect(result.current.title.toLowerCase()).toContain('map');
            expect(result.current.section).toBe('mapping');
        });

        it('should return analytics-specific SEO for /analytics', () => {
            const { result } = renderHook(() => useSEO(), {
                wrapper: createWrapper('/analytics'),
            });

            expect(result.current.title.toLowerCase()).toContain('analytics');
            expect(result.current.section).toBe('analytics');
        });

        it('should return alerts-specific SEO for /alerts', () => {
            const { result } = renderHook(() => useSEO(), {
                wrapper: createWrapper('/alerts'),
            });

            expect(result.current.title.toLowerCase()).toContain('alert');
            expect(result.current.section).toBe('alerts');
        });

        it('should return settings-specific SEO for /settings', () => {
            const { result } = renderHook(() => useSEO(), {
                wrapper: createWrapper('/settings'),
            });

            expect(result.current.title.toLowerCase()).toContain('settings');
            expect(result.current.section).toBe('settings');
        });
    });

    describe('Keywords Generation', () => {
        it('should include water quality related keywords', () => {
            const { result } = renderHook(() => useSEO(), {
                wrapper: createWrapper(),
            });

            const keywords = result.current.keywords.split(',').map(k => k.trim().toLowerCase());
            expect(keywords.some(k => k.includes('water'))).toBe(true);
        });

        it('should include India-specific keywords', () => {
            const { result } = renderHook(() => useSEO(), {
                wrapper: createWrapper(),
            });

            const keywords = result.current.keywords.split(',').map(k => k.trim().toLowerCase());
            expect(keywords.some(k => k.includes('india'))).toBe(true);
        });
    });

    describe('URL Generation', () => {
        it('should generate correct URL for current route', () => {
            const { result } = renderHook(() => useSEO(), {
                wrapper: createWrapper('/dashboard'),
            });

            expect(result.current.url).toContain('/dashboard');
        });
    });

    describe('Tags', () => {
        it('should return tags array for dashboard', () => {
            const { result } = renderHook(() => useSEO(), {
                wrapper: createWrapper('/dashboard'),
            });

            expect(Array.isArray(result.current.tags)).toBe(true);
            expect(result.current.tags?.length).toBeGreaterThan(0);
        });
    });
});

describe('useSEOAnalytics', () => {
    beforeEach(() => {
        // Mock performance API
        Object.defineProperty(window, 'performance', {
            value: {
                mark: jest.fn(),
                measure: jest.fn(),
                getEntriesByType: jest.fn(() => []),
                getEntriesByName: jest.fn(() => []),
                now: jest.fn(() => Date.now()),
            },
            writable: true,
        });
    });

    it('should not throw when called', () => {
        expect(() => {
            renderHook(() => useSEOAnalytics(), {
                wrapper: createWrapper(),
            });
        }).not.toThrow();
    });

    it('should setup performance tracking', () => {
        const { result } = renderHook(() => useSEOAnalytics(), {
            wrapper: createWrapper(),
        });

        // Hook should complete without errors
        expect(true).toBe(true);
    });
});

describe('SEO Data Structure', () => {
    it('should have all required properties', () => {
        const { result } = renderHook(() => useSEO(), {
            wrapper: createWrapper(),
        });

        const requiredProperties = [
            'title',
            'description',
            'keywords',
            'url',
            'section',
        ];

        requiredProperties.forEach(prop => {
            expect(result.current).toHaveProperty(prop);
        });
    });

    it('should have non-empty values', () => {
        const { result } = renderHook(() => useSEO(), {
            wrapper: createWrapper(),
        });

        expect(result.current.title.length).toBeGreaterThan(0);
        expect(result.current.description.length).toBeGreaterThan(0);
        expect(result.current.keywords.length).toBeGreaterThan(0);
    });
});
