import axios from 'axios';

// Default API URL based on environment
// Ensure /api suffix exists if we are using a provided URL that doesn't have it
const getBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  return 'http://localhost:5000/api';
};

const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (!config.headers) {
    config.headers = new axios.AxiosHeaders();
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors or handle specific status codes globally
    // console.error('API Error:', error.response?.data?.error || error.message);
    return Promise.reject(error);
  }
);

export default api;
