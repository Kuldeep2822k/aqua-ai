import axios from 'axios';

// Default to localhost if not specified
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., clear token and redirect to login)
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Uncomment if we have a login route
    }
    return Promise.reject(error);
  }
);

// Types
export interface LocationData {
  id: number;
  name: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  type: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  wqiScore?: number;
  currentData?: WaterQualityReading[];
}

export interface WaterQualityReading {
  parameter: string;
  value: number;
  unit: string;
  date: string;
  safeLimit: number;
  exceedsLimit: boolean;
}

export interface AlertData {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  location?: string;
  coordinates?: [number, number];
  timestamp: string;
  isRead: boolean;
}

// API Services
export const locationService = {
  getAll: async (): Promise<LocationData[]> => {
    try {
      const response = await apiClient.get('/locations');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<LocationData> => {
    try {
      const response = await apiClient.get(`/locations/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching location ${id}:`, error);
      throw error;
    }
  }
};

export const waterQualityService = {
  getLatest: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/water-quality/latest');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching water quality data:', error);
      throw error;
    }
  },

  getByLocationId: async (locationId: number): Promise<WaterQualityReading[]> => {
    try {
      const response = await apiClient.get(`/water-quality/location/${locationId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching water quality for location ${locationId}:`, error);
      throw error;
    }
  }
};

export const alertService = {
  getAll: async (): Promise<AlertData[]> => {
    try {
      const response = await apiClient.get('/alerts');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  getActive: async (): Promise<AlertData[]> => {
    try {
      const response = await apiClient.get('/alerts/active');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      throw error;
    }
  }
};

// Composite service to match the mock data structure expected by WaterQualityMap
export const mapService = {
  getLocationsWithData: async (): Promise<LocationData[]> => {
    try {
      // Fetch both locations and all latest readings in parallel
      const [locations, allReadings] = await Promise.all([
        locationService.getAll(),
        waterQualityService.getLatest()
      ]);

      // Map readings to locations in memory to avoid N+1 queries
      const locationsWithData = locations.map(loc => {
        // Find readings for this location
        // Note: The structure of allReadings depends on the backend.
        // Based on our mock backend, it returns an array where each item has locationId
        const locationReadings = allReadings.find((r: any) => r.locationId === loc.id);

        return {
          ...loc,
          currentData: locationReadings ? locationReadings.readings : []
        };
      });

      return locationsWithData;
    } catch (error) {
      console.error('Error fetching map data:', error);
      throw error;
    }
  }
};

export default apiClient;
