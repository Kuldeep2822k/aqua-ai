import axios from 'axios';

// API Base URL - defaults to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data?.error || error.message);
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
    avg_wqi_score: number;
    active_alerts: number;
    last_reading: string;
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
    location_name: string;
    state: string;
    district: string;
    latitude: number;
    longitude: number;
    parameter: string;
    value: number;
    unit: string;
    measurement_date: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    quality_score: number;
}

export interface Alert {
    id: number;
    location_name: string;
    state: string;
    parameter: string;
    value: number;
    threshold: number;
    severity: string;
    message: string;
    is_resolved: boolean;
    triggered_at: string;
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
    average_wqi_score: string;
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
        parameter?: string;
        state?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ success: boolean; data: WaterQualityReading[]; pagination: any }> => {
        const response = await api.get('/water-quality', { params });
        return response.data;
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
    getAll: async (params?: { status?: string; severity?: string; limit?: number }): Promise<{ success: boolean; data: Alert[]; pagination: any }> => {
        const response = await api.get('/alerts', { params });
        return response.data;
    },

    getActive: async (): Promise<{ success: boolean; data: Alert[]; count: number }> => {
        const response = await api.get('/alerts/active');
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/alerts/stats');
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
