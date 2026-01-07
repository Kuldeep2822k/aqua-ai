// API Endpoint Types
export interface APIEndpoints {
  // Water Quality Data
  getWaterQuality: '/api/water-quality';
  getWaterQualityById: '/api/water-quality/:id';
  getWaterQualityByRegion: '/api/water-quality/region/:region';

  // Map Data
  getMapTiles: '/api/map/tiles/:z/:x/:y.mvt';
  getMapLayers: '/api/map/layers';
  getWaterBodies: '/api/map/water-bodies';

  // Analytics
  getAnomalies: '/api/analytics/anomalies';
  getHotspots: '/api/analytics/hotspots';
  getTrends: '/api/analytics/trends';

  // Alerts
  getAlerts: '/api/alerts';
  createAlert: '/api/alerts';
  updateAlert: '/api/alerts/:id';
  deleteAlert: '/api/alerts/:id';
  getAlertRules: '/api/alerts/rules';
  createAlertRule: '/api/alerts/rules';

  // Community
  getCommunityReports: '/api/community/reports';
  createCommunityReport: '/api/community/reports';
  getForumPosts: '/api/community/forum/posts';
  createForumPost: '/api/community/forum/posts';

  // Research
  getDatasets: '/api/research/datasets';
  downloadDataset: '/api/research/datasets/:id/download';
  getAPIKeys: '/api/research/api-keys';
  createAPIKey: '/api/research/api-keys';

  // Sustainability
  getCarbonFootprint: '/api/sustainability/carbon-footprint';
  getSDGIndicators: '/api/sustainability/sdg';
  getComplianceStatus: '/api/sustainability/compliance';

  // Authentication
  login: '/api/auth/login';
  logout: '/api/auth/logout';
  register: '/api/auth/register';
  refreshToken: '/api/auth/refresh';

  // User Management
  getProfile: '/api/users/profile';
  updateProfile: '/api/users/profile';

  // Notifications
  getNotifications: '/api/notifications';
  markNotificationRead: '/api/notifications/:id/read';

  // Settings
  getUserSettings: '/api/settings';
  updateUserSettings: '/api/settings';
}

// Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  token: string;
  refreshToken: string;
}

export interface WaterQualityQuery {
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  parameters?: string[];
  dateFrom?: string;
  dateTo?: string;
  riskLevels?: string[];
  sources?: string[];
  limit?: number;
  offset?: number;
}



export interface CreateAlertRuleRequest {
  name: string;
  description: string;
  conditions: Array<{
    parameter: string;
    operator: string;
    value: number;
    location?: string;
  }>;
  actions: Array<{
    type: string;
    target: string;
  }>;
}

export interface CreateCommunityReportRequest {
  title: string;
  description: string;
  location: string;
  coordinates: [number, number];
  reportType: string;
  severity: number;
  images?: File[];
}

export interface BulkDownloadRequest {
  parameters: string[];
  regions: string[];
  dateFrom: string;
  dateTo: string;
  format: 'csv' | 'json' | 'parquet';
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string;
  timestamp: Date;
  data: any;
}

export interface RealTimeDataMessage extends WebSocketMessage {
  type: 'REAL_TIME_DATA';
  data: {
    location: string;
    parameters: Record<string, number>;
    riskLevel: string;
  };
}

export interface AlertMessage extends WebSocketMessage {
  type: 'ALERT';
  data: {
    id: string;
    title: string;
    message: string;
    severity: string;
    location?: string;
  };
}



// Error Types
export interface APIError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ValidationError extends APIError {
  code: 'VALIDATION_ERROR';
  field: string;
  details: {
    constraint: string;
    actualValue: any;
    expectedValue?: any;
  };
}

export interface AuthError extends APIError {
  code: 'AUTH_ERROR' | 'TOKEN_EXPIRED' | 'INSUFFICIENT_PERMISSIONS';
}

export interface NotFoundError extends APIError {
  code: 'NOT_FOUND';
  details: {
    resource: string;
    id: string;
  };
}

export interface RateLimitError extends APIError {
  code: 'RATE_LIMIT_EXCEEDED';
  details: {
    limit: number;
    remaining: number;
    resetTime: Date;
  };
}
