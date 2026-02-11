import axios from 'axios';

// Vite environment type declaration
declare global {
    interface ImportMetaEnv {
        readonly VITE_API_URL?: string;
    }
    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}

// API Base URL - defaults to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

type ApiErrorDetail = {
    field?: unknown;
    message?: unknown;
    value?: unknown;
};

type ApiErrorBody = {
    error?: unknown;
    details?: unknown;
};

type AxiosishError = {
    message?: unknown;
    response?: {
        status?: unknown;
        data?: unknown;
    };
};

function formatApiError(error: unknown) {
    const err = error as AxiosishError;
    const status =
        typeof err?.response?.status === 'number' ? err.response.status : undefined;
    const data = err?.response?.data as ApiErrorBody | undefined;
    const apiError = data?.error;
    const details = data?.details;

    if (status === 429) {
        return 'Too many requests (429). Please wait a moment and try again.';
    }

    if (status === 400 && Array.isArray(details) && details.length > 0) {
        const msg = (details as ApiErrorDetail[])
            .map((d) => {
                const field = d?.field ? String(d.field) : '';
                const m = d?.message ? String(d.message) : '';
                return field && m ? `${field}: ${m}` : m || field;
            })
            .filter(Boolean)
            .join(', ');
        return apiError ? `${String(apiError)}: ${msg}` : msg;
    }

    if (apiError) return String(apiError);
    if (typeof err?.message === 'string') return err.message;
    return 'Request failed';
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const errMsg = formatApiError(error);
        error.message = errMsg;
        if (status && status >= 500) {
            console.error('API Error:', errMsg);
        } else {
            console.warn('API Warning:', errMsg);
        }
        return Promise.reject(error);
    }
);

export interface Location {
    id: number;
    name: string;
    state: string;
    district: string;
    latitude: number;
    longitude: number;
    water_body_type: string;
    water_body_name?: string | null;
    population_affected?: number | null;
    parameters_monitored?: number | null;
    avg_wqi_score: number | null;
    active_alerts: number | null;
    last_reading: string | null;
    derived_wqi_score?: number | null;
    derived_wqi_category?: string | null;
    derived_risk_level?: 'low' | 'medium' | 'high' | 'critical' | 'unknown' | null;
    derived_parameters_used?: number | null;
}

export interface LocationGeoJSON {
    type: 'FeatureCollection';
    features: Array<{
        type: 'Feature';
        geometry: {
            type: 'Point';
            coordinates: [number, number];
        };
        properties: Location;
    }>;
}

export interface WaterQualityReading {
    id: number;
    location_id: number;
    location_name: string;
    state: string;
    district: string | null;
    latitude: number;
    longitude: number;
    parameter: string;
    parameter_code: string;
    value: number;
    unit: string;
    measurement_date: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
    quality_score: number | null;
    source: string;
}

export interface Pagination {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface Alert {
    id: number;
    location_id: number;
    location_name: string;
    state: string;
    parameter: string;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    threshold_value: number | null;
    actual_value: number | null;
    status: 'active' | 'resolved' | 'dismissed';
    triggered_at: string;
    resolved_at?: string | null;
}

export interface ActiveAlert {
    id: number;
    location_id: number;
    location_name: string;
    state?: string | null;
    parameter?: string | null;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message?: string | null;
    threshold_value?: number | null;
    actual_value?: number | null;
    status?: 'active' | 'resolved' | 'dismissed';
    triggered_at: string;
}

export interface AlertStats {
    total_alerts: number;
    active_alerts: number;
    resolved_alerts: number;
    dismissed_alerts: number;
    severity_distribution: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    alert_types: Record<string, number>;
    parameters_with_alerts: string[];
    locations_with_alerts: number;
    average_resolution_time_hours: string | null;
}

export interface WaterQualityStats {
    total_readings: number;
    risk_level_distribution: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    average_quality_score: string;
    parameters_monitored: string[];
    states_monitored: string[];
    latest_reading: string;
}

export interface LocationStats {
    total_locations: number;
    states_covered: number;
    water_body_types: string[];
    locations_with_alerts: number;
    average_wqi_score: string | null;
}

// Locations API
export const locationsApi = {
    getAll: async (params?: { limit?: number; offset?: number }) => {
        const response = await api.get('/locations', { params });
        return response.data;
    },

    getGeoJSON: async (): Promise<{ success: boolean; data: LocationGeoJSON }> => {
        const response = await api.get('/locations/geojson');
        return response.data;
    },

    getStats: async (): Promise<{ success: boolean; data: LocationStats }> => {
        const response = await api.get('/locations/stats');
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/locations/${id}`);
        return response.data;
    },
};

// Water Quality API
export const waterQualityApi = {
    getReadings: async (params?: {
        location_id?: number | string;
        parameter?: string;
        state?: string;
        risk_level?: string;
        start_date?: string;
        end_date?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ success: boolean; data: WaterQualityReading[]; pagination: Pagination }> => {
        const response = await api.get('/water-quality', { params });
        return response.data;
    },

    getAllReadings: async (params?: {
        location_id?: number | string;
        parameter?: string;
        state?: string;
        risk_level?: string;
        start_date?: string;
        end_date?: string;
        maxPages?: number;
    }): Promise<{ success: boolean; data: WaterQualityReading[]; pagination?: Pagination }> => {
        const pageSize = 1000;
        const maxPages = params?.maxPages ?? 50;
        let offset = 0;
        let page = 0;
        const all: WaterQualityReading[] = [];
        let lastPagination: Pagination | undefined = undefined;

        while (page < maxPages) {
            const res = await waterQualityApi.getReadings({
                ...params,
                limit: pageSize,
                offset,
            });
            all.push(...(res?.data ?? []));
            lastPagination = res?.pagination ?? undefined;
            if (!lastPagination?.hasMore) break;
            offset += pageSize;
            page += 1;
            await sleep(150);
        }

        return { success: true, data: all, pagination: lastPagination };
    },

    getStats: async (): Promise<{ success: boolean; data: WaterQualityStats }> => {
        const response = await api.get('/water-quality/stats');
        return response.data;
    },

    getParameters: async () => {
        const response = await api.get('/water-quality/parameters');
        return response.data;
    },
};

// Alerts API
export const alertsApi = {
    getAll: async (params?: { status?: string; severity?: string; limit?: number; offset?: number; start_date?: string; end_date?: string; parameter?: string }): Promise<{ success: boolean; data: Alert[]; pagination: Pagination }> => {
        const response = await api.get('/alerts', { params });
        return response.data;
    },

    getActive: async (params?: { severity?: string; limit?: number }): Promise<{ success: boolean; data: ActiveAlert[]; count: number }> => {
        const response = await api.get('/alerts/active', { params });
        return response.data;
    },

    getStats: async (params?: { start_date?: string; end_date?: string }): Promise<{ success: boolean; data: AlertStats }> => {
        const response = await api.get('/alerts/stats', { params });
        return response.data;
    },
};

// Health check
export const healthApi = {
    check: async () => {
        const response = await api.get('/health');
        return response.data;
    },
};

export default api;
