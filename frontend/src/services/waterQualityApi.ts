/**
 * Water Quality API Service
 * Provides typed API calls for water quality, locations, and alerts endpoints
 */

import api from './api';

// Types
export interface WaterQualityReading {
    id: number;
    location_id: number;
    location_name: string;
    state: string;
    district: string;
    latitude: number;
    longitude: number;
    parameter_code: string;
    parameter_name: string;
    value: number;
    unit: string;
    measurement_date: string;
    source: string;
}

export interface Location {
    id: number;
    name: string;
    state: string;
    district: string;
    latitude: number;
    longitude: number;
    water_body_type: string;
    water_body_name: string;
    population_affected: number;
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
        properties: {
            id: number;
            name: string;
            state: string;
            district: string;
            water_body_type: string;
            water_body_name: string;
            population_affected: number;
            avg_wqi_score: number;
            active_alerts: number;
            last_reading: string;
        };
    }>;
}

export interface Alert {
    id: number;
    location_id: number;
    location_name: string;
    state: string;
    parameter_code: string;
    parameter_name: string;
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    status: 'active' | 'resolved' | 'dismissed';
    triggered_at: string;
    resolved_at: string | null;
}

export interface LocationStats {
    total_locations: number;
    states_covered: number;
    water_body_types: string[];
    total_population_affected: number;
    locations_with_alerts: number;
    average_wqi_score: string | null;
}

export interface AlertStats {
    total_alerts: number;
    active_alerts: number;
    resolved_alerts: number;
    dismissed_alerts: number;
    severity_distribution: Record<string, number>;
    alert_types: Record<string, number>;
    parameters_with_alerts: string[];
    locations_with_alerts: number;
    average_resolution_time_hours: string;
}

export interface WaterQualityStats {
    total_readings: number;
    parameters_monitored: string[];
    states_monitored: string[];
    latest_reading: string | null;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
}

// Helper function to calculate risk level from WQI score
export const calculateRiskLevel = (
    wqiScore: number | null
): 'low' | 'medium' | 'high' | 'critical' => {
    if (wqiScore === null || wqiScore === undefined) return 'medium';
    if (wqiScore >= 80) return 'low';
    if (wqiScore >= 60) return 'medium';
    if (wqiScore >= 40) return 'high';
    return 'critical';
};

// Water Quality API
export const waterQualityApi = {
    /**
     * Get all water quality readings with optional filters
     */
    getReadings: async (params?: {
        location_id?: number;
        parameter?: string;
        state?: string;
        risk_level?: string;
        start_date?: string;
        end_date?: string;
        limit?: number;
        offset?: number;
    }): Promise<PaginatedResponse<WaterQualityReading>> => {
        const response = await api.get('/water-quality', { params });
        return response.data;
    },

    /**
     * Get water quality statistics
     */
    getStats: async (params?: {
        state?: string;
        parameter?: string;
    }): Promise<ApiResponse<WaterQualityStats>> => {
        const response = await api.get('/water-quality/stats', { params });
        return response.data;
    },

    /**
     * Get available water quality parameters
     */
    getParameters: async (): Promise<
        ApiResponse<
            Array<{
                id: number;
                parameter_code: string;
                parameter_name: string;
                unit: string;
                safe_limit: number;
                description: string;
            }>
        >
    > => {
        const response = await api.get('/water-quality/parameters');
        return response.data;
    },

    /**
     * Get readings for a specific location
     */
    getByLocation: async (
        locationId: number,
        params?: { parameter?: string; limit?: number }
    ): Promise<ApiResponse<WaterQualityReading[]>> => {
        const response = await api.get(`/water-quality/location/${locationId}`, {
            params,
        });
        return response.data;
    },
};

// Locations API
export const locationsApi = {
    /**
     * Get all locations with optional filters
     */
    getAll: async (params?: {
        state?: string;
        water_body_type?: string;
        has_alerts?: string;
        limit?: number;
        offset?: number;
    }): Promise<PaginatedResponse<Location>> => {
        const response = await api.get('/locations', { params });
        return response.data;
    },

    /**
     * Get locations as GeoJSON for mapping
     */
    getGeoJSON: async (): Promise<ApiResponse<LocationGeoJSON>> => {
        const response = await api.get('/locations/geojson');
        return response.data;
    },

    /**
     * Get location statistics
     */
    getStats: async (): Promise<ApiResponse<LocationStats>> => {
        const response = await api.get('/locations/stats');
        return response.data;
    },

    /**
     * Search locations
     */
    search: async (
        query: string,
        limit?: number
    ): Promise<ApiResponse<Location[]>> => {
        const response = await api.get('/locations/search', {
            params: { q: query, limit },
        });
        return response.data;
    },

    /**
     * Get specific location by ID
     */
    getById: async (id: number): Promise<ApiResponse<Location>> => {
        const response = await api.get(`/locations/${id}`);
        return response.data;
    },
};

// Alerts API
export const alertsApi = {
    /**
     * Get all alerts with optional filters
     */
    getAll: async (params?: {
        status?: string;
        severity?: string;
        location_id?: number;
        parameter?: string;
        alert_type?: string;
        start_date?: string;
        end_date?: string;
        limit?: number;
        offset?: number;
    }): Promise<PaginatedResponse<Alert>> => {
        const response = await api.get('/alerts', { params });
        return response.data;
    },

    /**
     * Get active alerts only
     */
    getActive: async (params?: {
        severity?: string;
        limit?: number;
    }): Promise<ApiResponse<Alert[]> & { count: number }> => {
        const response = await api.get('/alerts/active', { params });
        return response.data;
    },

    /**
     * Get alert statistics
     */
    getStats: async (params?: {
        start_date?: string;
        end_date?: string;
    }): Promise<ApiResponse<AlertStats>> => {
        const response = await api.get('/alerts/stats', { params });
        return response.data;
    },

    /**
     * Get specific alert by ID
     */
    getById: async (id: number): Promise<ApiResponse<Alert>> => {
        const response = await api.get(`/alerts/${id}`);
        return response.data;
    },
};

export default {
    waterQuality: waterQualityApi,
    locations: locationsApi,
    alerts: alertsApi,
};
