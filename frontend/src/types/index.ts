// Core Types
export interface WaterQualityData {
  id: string;
  location: string;
  coordinates: [number, number];
  timestamp: Date;
  parameters: WaterParameters;
  wqi: number;
  riskLevel: RiskLevel;
  source: DataSource;
  qualityScore: number;
}

export interface WaterParameters {
  bod: Parameter;
  tds: Parameter;
  ph: Parameter;
  dissolvedOxygen: Parameter;
  coliform: Parameter;
  heavyMetals: HeavyMetals;
  nitrates: Parameter;
  phosphates: Parameter;
  turbidity: Parameter;
  temperature: Parameter;
}

export interface Parameter {
  value: number;
  unit: string;
  status: ParameterStatus;
  threshold: number | [number, number];
  confidence?: number;
}

export interface HeavyMetals {
  lead: Parameter;
  mercury: Parameter;
  cadmium: Parameter;
  arsenic: Parameter;
  chromium: Parameter;
}

export type RiskLevel = 'safe' | 'medium' | 'high' | 'critical';
export type ParameterStatus = 'normal' | 'warning' | 'critical';

export interface DataSource {
  name: string;
  type: 'government' | 'community' | 'iot' | 'satellite';
  reliability: number;
  lastUpdate: Date;
  apiEndpoint?: string;
}

// Map Types
export interface MapFilters {
  parameters: string[];
  riskLevels: RiskLevel[];
  dateRange: [Date, Date];
  regions: string[];
  sources: string[];
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'heatmap' | 'choropleth' | 'markers' | 'contours';
  visible: boolean;
  opacity: number;
  data: any;
}

// Analytics Types
export interface Prediction {
  id: string;
  parameter: string;
  location: string;
  coordinates: [number, number];
  predictedValue: number;
  confidence: number;
  timeHorizon: number; // hours
  risk: RiskLevel;
  factors: PredictionFactor[];
  timestamp: Date;
}

export interface PredictionFactor {
  name: string;
  importance: number;
  value: any;
}

export interface Anomaly {
  id: string;
  location: string;
  coordinates: [number, number];
  parameter: string;
  detectedValue: number;
  expectedValue: number;
  severity: number; // 0-1
  timestamp: Date;
  description: string;
}

export interface Hotspot {
  id: string;
  region: string;
  coordinates: [number, number];
  riskScore: number;
  affectedParameters: string[];
  populationAtRisk: number;
  trends: TrendData[];
}

export interface TrendData {
  parameter: string;
  values: Array<{ date: Date; value: number }>;
  trend: 'improving' | 'stable' | 'deteriorating';
  changeRate: number; // percentage change per month
}

// Alert Types
export interface Alert {
  id: string;
  title: string;
  message: string;
  type: AlertType;
  severity: AlertSeverity;
  location?: string;
  coordinates?: [number, number];
  timestamp: Date;
  isRead: boolean;
  actions?: AlertAction[];
  metadata?: Record<string, any>;
}

export type AlertType = 'threshold' | 'prediction' | 'anomaly' | 'system' | 'emergency';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

export interface AlertAction {
  id: string;
  label: string;
  url?: string;
  action?: () => void;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  conditions: AlertCondition[];
  actions: NotificationAction[];
  isActive: boolean;
  userId: string;
  createdAt: Date;
}

export interface AlertCondition {
  parameter: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
  location?: string;
}

export interface NotificationAction {
  type: 'email' | 'sms' | 'push' | 'webhook';
  target: string;
  template?: string;
}

// Community Types
export interface CommunityReport {
  id: string;
  title: string;
  description: string;
  location: string;
  coordinates: [number, number];
  images: string[];
  reportType: 'pollution' | 'wildlife' | 'odor' | 'discoloration' | 'other';
  severity: number; // 1-5
  status: 'pending' | 'verified' | 'investigating' | 'resolved' | 'rejected';
  submittedBy: string;
  submittedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  votes: { up: number; down: number };
  comments: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
  replies?: Comment[];
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  author: User;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  replies: ForumReply[];
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
}

export interface ForumReply {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  likes: number;
  isAccepted?: boolean;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  organization?: string;
  location?: string;
  expertise: string[];
  joinedAt: Date;
  reputation: number;
}

export type UserRole = 'citizen' | 'researcher' | 'official' | 'admin';

// Research Types
export interface ResearchDataset {
  id: string;
  name: string;
  description: string;
  parameters: string[];
  regions: string[];
  dateRange: [Date, Date];
  format: 'csv' | 'json' | 'parquet' | 'geojson';
  size: number; // bytes
  downloadUrl: string;
  license: string;
  citations: number;
  createdAt: Date;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  rateLimit: number;
  usage: number;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// Sustainability Types
export interface CarbonFootprint {
  location: string;
  treatmentProcess: string;
  co2Equivalent: number; // kg CO2
  energyUsage: number; // kWh
  waterVolume: number; // liters
  efficiency: number; // percentage
  recommendations: string[];
}

export interface SDGIndicator {
  goal: number; // SDG goal number (1-17)
  target: string;
  indicator: string;
  value: number;
  unit: string;
  trend: 'improving' | 'stable' | 'deteriorating';
  progress: number; // percentage towards target
}

export interface ComplianceStatus {
  location: string;
  regulation: string;
  parameters: Record<string, {
    required: number;
    actual: number;
    compliant: boolean;
  }>;
  overallCompliance: boolean;
  violations: Violation[];
  lastAssessment: Date;
}

export interface Violation {
  parameter: string;
  requiredValue: number;
  actualValue: number;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  remedialActions: string[];
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: Date;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

// PWA Types
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ServiceWorkerMessage {
  type: 'SKIP_WAITING' | 'UPDATE_FOUND' | 'OFFLINE' | 'ONLINE';
  payload?: any;
}

// Blockchain Types (for data integrity)
export interface BlockchainRecord {
  hash: string;
  previousHash: string;
  timestamp: Date;
  data: {
    type: 'water_quality' | 'alert' | 'report';
    id: string;
    checksum: string;
  };
  blockNumber: number;
}

// Export all types
export * from './api';
export * from './components';
