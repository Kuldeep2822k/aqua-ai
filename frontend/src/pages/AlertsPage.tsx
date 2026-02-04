import { AlertTriangle, Search, MapPin, Clock, TrendingUp, CheckCircle, XCircle, Download, Bell } from 'lucide-react';
import { useState } from 'react';

const alerts = [
  {
    id: 1,
    title: 'Critical BOD Level Detected',
    location: 'Yamuna River, Delhi',
    state: 'Delhi',
    severity: 'critical',
    status: 'active',
    parameter: 'BOD',
    value: '5.8 mg/L',
    threshold: '3.0 mg/L',
    timestamp: '2 hours ago',
    description: 'Biological Oxygen Demand has exceeded safe limits. Immediate investigation required.',
    impact: 'High risk to aquatic life and water usability',
    coordinates: { lat: 28.7041, lng: 77.1025 }
  },
  {
    id: 2,
    title: 'Heavy Metal Contamination',
    location: 'Ganga River, Varanasi',
    state: 'Uttar Pradesh',
    severity: 'critical',
    status: 'active',
    parameter: 'Lead',
    value: '0.18 mg/L',
    threshold: '0.01 mg/L',
    timestamp: '1 hour ago',
    description: 'Lead concentration detected above permissible limits in drinking water source.',
    impact: 'Severe health risk - water not suitable for consumption',
    coordinates: { lat: 25.3176, lng: 82.9739 }
  },
  {
    id: 3,
    title: 'High TDS Levels',
    location: 'Krishna River, Vijayawada',
    state: 'Andhra Pradesh',
    severity: 'warning',
    status: 'active',
    parameter: 'TDS',
    value: '800 ppm',
    threshold: '500 ppm',
    timestamp: '3 hours ago',
    description: 'Total Dissolved Solids exceeding recommended levels.',
    impact: 'Water quality degradation - monitoring required',
    coordinates: { lat: 16.5062, lng: 80.6480 }
  },
  {
    id: 4,
    title: 'pH Imbalance Detected',
    location: 'Narmada River, Jabalpur',
    state: 'Madhya Pradesh',
    severity: 'warning',
    status: 'investigating',
    parameter: 'pH',
    value: '8.5',
    threshold: '6.5-8.5',
    timestamp: '5 hours ago',
    description: 'pH levels at upper limit of acceptable range.',
    impact: 'Potential ecosystem stress',
    coordinates: { lat: 23.1815, lng: 79.9864 }
  },
  {
    id: 5,
    title: 'Fecal Coliform Detection',
    location: 'Mumbai Coastal Waters',
    state: 'Maharashtra',
    severity: 'warning',
    status: 'active',
    parameter: 'Fecal Coliform',
    value: '2400 MPN/100ml',
    threshold: '500 MPN/100ml',
    timestamp: '4 hours ago',
    description: 'Elevated fecal coliform bacteria detected in coastal sampling.',
    impact: 'Health risk for recreational water activities',
    coordinates: { lat: 19.0760, lng: 72.8777 }
  },
  {
    id: 6,
    title: 'Turbidity Alert',
    location: 'Hooghly River, Kolkata',
    state: 'West Bengal',
    severity: 'warning',
    status: 'resolved',
    parameter: 'Turbidity',
    value: '45 NTU',
    threshold: '10 NTU',
    timestamp: '1 day ago',
    description: 'High turbidity levels detected after heavy rainfall.',
    impact: 'Reduced water clarity - treatment required',
    coordinates: { lat: 22.5726, lng: 88.3639 }
  },
  {
    id: 7,
    title: 'Low Dissolved Oxygen',
    location: 'Sabarmati River, Ahmedabad',
    state: 'Gujarat',
    severity: 'warning',
    status: 'investigating',
    parameter: 'Dissolved Oxygen',
    value: '3.2 mg/L',
    threshold: '5.0 mg/L',
    timestamp: '6 hours ago',
    description: 'Dissolved oxygen below optimal levels for aquatic life.',
    impact: 'Stress on fish and aquatic organisms',
    coordinates: { lat: 23.0225, lng: 72.5714 }
  },
  {
    id: 8,
    title: 'Elevated BOD Levels',
    location: 'Musi River, Hyderabad',
    state: 'Telangana',
    severity: 'critical',
    status: 'active',
    parameter: 'BOD',
    value: '6.5 mg/L',
    threshold: '3.0 mg/L',
    timestamp: '30 minutes ago',
    description: 'Severe organic pollution detected in urban river segment.',
    impact: 'Critical water quality degradation',
    coordinates: { lat: 17.3850, lng: 78.4867 }
  }
];

const severityConfig = {
  critical: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-500',
    gradient: 'from-red-500 to-red-600'
  },
  warning: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-500',
    gradient: 'from-yellow-500 to-yellow-600'
  },
  info: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600'
  }
};

const statusConfig = {
  active: {
    label: 'Active',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30'
  },
  investigating: {
    label: 'Investigating',
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30'
  }
};

export function AlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.parameter.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const selectedAlertData = selectedAlert ? alerts.find(a => a.id === selectedAlert) : null;

  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
  const warningCount = alerts.filter(a => a.severity === 'warning' && a.status === 'active').length;
  const activeCount = alerts.filter(a => a.status === 'active').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  return (
    <main className="h-[calc(100vh-73px)] flex flex-col bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-950/30 dark:via-gray-900 dark:to-orange-950/30 transition-colors duration-200">
      {/* Top Stats Bar */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 px-8 py-4 transition-colors duration-200">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Alert Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monitor and manage water quality alerts across India</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-2 bg-white/50 dark:bg-gray-800/50">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Active</span>
                <Bell className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Requires attention</div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 shadow-lg shadow-red-500/30 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-red-100">Critical Alerts</span>
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold">{criticalCount}</div>
              <div className="text-xs text-red-100 mt-1">Immediate action needed</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 shadow-lg shadow-yellow-500/30 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-yellow-100">Warnings</span>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold">{warningCount}</div>
              <div className="text-xs text-yellow-100 mt-1">Monitoring required</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 shadow-lg shadow-green-500/30 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-100">Resolved</span>
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold">{resolvedCount}</div>
              <div className="text-xs text-green-100 mt-1">Last 24 hours</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Alerts List */}
        <div className="w-[500px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Severity</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </div>
          </div>

          {/* Alerts List */}
          <div className="flex-1 overflow-y-auto">
            {filteredAlerts.map((alert) => {
              const severity = severityConfig[alert.severity as keyof typeof severityConfig];
              const status = statusConfig[alert.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              const isSelected = selectedAlert === alert.id;

              return (
                <button
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert.id)}
                  className={`w-full p-4 text-left border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 ${severity.badge} rounded-full mt-2 flex-shrink-0`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{alert.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color} flex items-center gap-1 whitespace-nowrap`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <MapPin className="w-3 h-3" />
                        {alert.location}
                      </div>

                      <div className={`text-xs ${severity.color} font-medium mb-2`}>
                        {alert.parameter}: {alert.value} (Threshold: {alert.threshold})
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${severity.bg} ${severity.color}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Alert Details */}
        {selectedAlertData ? (
          <div className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto transition-colors duration-200">
            <div className={`p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br ${severityConfig[selectedAlertData.severity as keyof typeof severityConfig].bg}`}>
              <div className="max-w-4xl mx-auto">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`w-3 h-3 ${severityConfig[selectedAlertData.severity as keyof typeof severityConfig].badge} rounded-full animate-pulse`}></span>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAlertData.title}</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedAlertData.location}, {selectedAlertData.state}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedAlertData.timestamp}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedAlert(null)}
                    className="p-2 hover:bg-white dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {(() => {
                    const status = statusConfig[selectedAlertData.status as keyof typeof statusConfig];
                    const StatusIcon = status.icon;
                    return (
                      <span className={`px-4 py-2 rounded-xl ${status.bg} ${status.color} flex items-center gap-2 font-medium`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </span>
                    );
                  })()}
                  <span className={`px-4 py-2 rounded-xl bg-gradient-to-r ${severityConfig[selectedAlertData.severity as keyof typeof severityConfig].gradient} text-white font-medium shadow-lg`}>
                    {selectedAlertData.severity.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Alert Details */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alert Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                      <p className="text-gray-900 dark:text-gray-200 mt-1">{selectedAlertData.description}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Impact Assessment</label>
                      <p className="text-gray-900 dark:text-gray-200 mt-1">{selectedAlertData.impact}</p>
                    </div>
                  </div>
                </div>

                {/* Parameter Information */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Parameter Information</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Parameter</div>
                      <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{selectedAlertData.parameter}</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                      <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Current Value</div>
                      <div className="text-lg font-bold text-red-900 dark:text-red-100">{selectedAlertData.value}</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Safe Threshold</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedAlertData.threshold}</div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location Information</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{selectedAlertData.location}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">State</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{selectedAlertData.state}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Coordinates</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {selectedAlertData.coordinates.lat.toFixed(4)}°, {selectedAlertData.coordinates.lng.toFixed(4)}°
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium">
                    View on Map
                  </button>
                  <button className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium">
                    Generate Report
                  </button>
                  <button className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium">
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Alert Selected</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select an alert from the list to view details</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
