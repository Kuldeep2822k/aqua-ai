import { ReactNode } from 'react';
import { WaterQualityData, RiskLevel, Alert, MapLayer } from './index';

// Common Component Props
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}

// Navigation Component Props
export interface NavbarProps extends BaseComponentProps {
  onSidebarToggle: () => void;
  title?: string;
  showBreadcrumb?: boolean;
}

export interface SidebarProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: Array<{
    label: string;
    href?: string;
    active?: boolean;
  }>;
}

// Map Component Props
export interface InteractiveMapProps extends BaseComponentProps {
  center?: [number, number];
  zoom?: number;
  data?: WaterQualityData[];
  layers?: MapLayer[];
  onMarkerClick?: (data: WaterQualityData) => void;
  onMapMove?: (bounds: [[number, number], [number, number]]) => void;
  showControls?: boolean;
  showTimeLapse?: boolean;
  lowBandwidthMode?: boolean;
}

export interface MapControlsProps extends BaseComponentProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleFullscreen: () => void;
  onToggleLayers: () => void;
  isFullscreen?: boolean;
}

export interface LayerControlProps extends BaseComponentProps {
  layers: MapLayer[];
  onLayerToggle: (layerId: string) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
}

export interface TimeLapseControlProps extends BaseComponentProps {
  startDate: Date;
  endDate: Date;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  isPlaying: boolean;
  speed?: number;
}

// Data Visualization Component Props
export interface WaterQualityCardProps extends BaseComponentProps {
  data: WaterQualityData;
  compact?: boolean;
  showDetails?: boolean;
  onClick?: () => void;
}

export interface RiskIndicatorProps extends BaseComponentProps {
  riskLevel: RiskLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export interface ParameterGaugeProps extends BaseComponentProps {
  parameter: string;
  value: number;
  threshold: number | [number, number];
  unit: string;
  size?: 'small' | 'medium' | 'large';
}

export interface TrendChartProps extends BaseComponentProps {
  data: Array<{ date: Date; value: number }>;
  parameter: string;
  unit: string;
  height?: number;
  showPrediction?: boolean;
  predictionData?: Array<{ date: Date; value: number; confidence: number }>;
}

export interface HeatmapProps extends BaseComponentProps {
  data: WaterQualityData[];
  parameter: string;
  bounds: [[number, number], [number, number]];
  resolution?: number;
  colorScale?: string[];
}

// Dashboard Component Props
export interface DashboardWidgetProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  actions?: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface MetricCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export interface AlertListProps extends BaseComponentProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
  onAlertDismiss?: (alertId: string) => void;
  showActions?: boolean;
  maxItems?: number;
}

// Filter Component Props
export interface FilterPanelProps extends BaseComponentProps {
  filters: {
    parameters: string[];
    riskLevels: RiskLevel[];
    dateRange: [Date, Date];
    regions: string[];
  };
  onFiltersChange: (filters: any) => void;
  loading?: boolean;
}

export interface DateRangePickerProps extends BaseComponentProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (startDate: Date, endDate: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  presets?: Array<{
    label: string;
    startDate: Date;
    endDate: Date;
  }>;
}

export interface MultiSelectProps extends BaseComponentProps {
  options: Array<{ value: string; label: string }>;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  maxHeight?: number;
}

// Form Component Props
export interface FormFieldProps extends BaseComponentProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

export interface FileUploadProps extends BaseComponentProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onFilesChange: (files: File[]) => void;
  dragAndDrop?: boolean;
}

// Table Component Props
export interface DataTableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: T) => ReactNode;
    width?: string;
  }>;
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  sorting?: {
    column: keyof T;
    direction: 'asc' | 'desc';
    onSortChange: (column: keyof T, direction: 'asc' | 'desc') => void;
  };
  selection?: {
    selectedRows: string[];
    onSelectionChange: (selectedRows: string[]) => void;
  };
  actions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: (row: T) => void;
    disabled?: (row: T) => boolean;
  }>;
}

// Modal Component Props
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  disableBackdropClick?: boolean;
  showCloseButton?: boolean;
}

export interface ConfirmDialogProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'info' | 'warning' | 'error';
}

// Loading Component Props
export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

export interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | false;
}

// Notification Component Props
export interface ToastProps extends BaseComponentProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export interface NotificationBadgeProps extends BaseComponentProps {
  count: number;
  maxCount?: number;
  showZero?: boolean;
  dot?: boolean;
}

// Chart Component Props
export interface ChartProps extends BaseComponentProps {
  data: any;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
  height?: number;
  options?: any;
  loading?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
}

// Search Component Props
export interface SearchBoxProps extends BaseComponentProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  suggestions?: string[];
  loading?: boolean;
  debounceMs?: number;
}

// Language Switcher Props
export interface LanguageSwitcherProps extends BaseComponentProps {
  currentLanguage: string;
  languages: Array<{
    code: string;
    name: string;
    flag?: string;
  }>;
  onLanguageChange: (language: string) => void;
}

// PWA Component Props
export interface InstallPromptProps extends BaseComponentProps {
  onInstall: () => void;
  onDismiss: () => void;
  showPrompt: boolean;
}

export interface OfflineIndicatorProps extends BaseComponentProps {
  isOffline: boolean;
  message?: string;
}

// Export all component types
export type ComponentProps = 
  | NavbarProps
  | SidebarProps
  | InteractiveMapProps
  | WaterQualityCardProps
  | DashboardWidgetProps
  | FilterPanelProps
  | DataTableProps
  | ModalProps
  | ChartProps;
