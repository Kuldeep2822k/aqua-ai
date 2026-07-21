export type Page = 'dashboard' | 'map' | 'alerts' | 'analytics' | 'settings';

export type RouteState = { kind: 'landing' } | { kind: 'app'; page: Page };
