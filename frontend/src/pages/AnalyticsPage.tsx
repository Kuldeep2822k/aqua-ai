import { Download, FileText, TrendingUp, TrendingDown, BarChart3, Activity, Droplet } from 'lucide-react';
import { useState } from 'react';
import { BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const monthlyTrends = [
  { month: 'Jan', critical: 8, warning: 15, good: 42 },
  { month: 'Feb', critical: 6, warning: 18, good: 45 },
  { month: 'Mar', critical: 9, warning: 16, good: 40 },
  { month: 'Apr', critical: 7, warning: 20, good: 38 },
  { month: 'May', critical: 5, warning: 22, good: 43 },
  { month: 'Jun', critical: 3, warning: 19, good: 48 },
];

const stateDistribution = [
  { name: 'Critical', value: 3, color: '#ef4444' },
  { name: 'Warning', value: 6, color: '#eab308' },
  { name: 'Good', value: 3, color: '#22c55e' },
];

const parameterData = [
  { parameter: 'BOD', violations: 12, avg: 4.2, threshold: 3.0 },
  { parameter: 'pH', violations: 8, avg: 7.8, threshold: 8.5 },
  { parameter: 'TDS', violations: 10, avg: 650, threshold: 500 },
  { parameter: 'DO', violations: 5, avg: 4.5, threshold: 5.0 },
  { parameter: 'Turbidity', violations: 7, avg: 25, threshold: 10 },
  { parameter: 'Lead', violations: 3, avg: 0.12, threshold: 0.01 },
];

const topPollutedLocations = [
  { name: 'Yamuna River, Delhi', score: 92, trend: 'up', violations: 24 },
  { name: 'Musi River, Hyderabad', score: 88, trend: 'up', violations: 21 },
  { name: 'Ganga River, Varanasi', score: 85, trend: 'down', violations: 19 },
  { name: 'Mumbai Coastal Waters', score: 78, trend: 'up', violations: 16 },
  { name: 'Sabarmati River, Ahmedabad', score: 72, trend: 'down', violations: 14 },
];

const waterQualityTrend = [
  { date: 'Week 1', quality: 65, alerts: 8 },
  { date: 'Week 2', quality: 68, alerts: 6 },
  { date: 'Week 3', quality: 62, alerts: 9 },
  { date: 'Week 4', quality: 70, alerts: 5 },
  { date: 'Week 5', quality: 72, alerts: 4 },
  { date: 'Week 6', quality: 75, alerts: 3 },
];

const reportTemplates = [
  {
    id: 1,
    name: 'Monthly Water Quality Summary',
    description: 'Comprehensive overview of water quality metrics across all monitored locations',
    type: 'Monthly',
    lastGenerated: '2 days ago',
    size: '2.4 MB'
  },
  {
    id: 2,
    name: 'Critical Alerts Report',
    description: 'Detailed analysis of critical alerts and violations',
    type: 'Weekly',
    lastGenerated: '5 hours ago',
    size: '1.8 MB'
  },
  {
    id: 3,
    name: 'Compliance Report',
    description: 'Regulatory compliance status and parameter analysis',
    type: 'Quarterly',
    lastGenerated: '1 week ago',
    size: '3.2 MB'
  },
  {
    id: 4,
    name: 'Location-Specific Analysis',
    description: 'In-depth analysis of individual water body performance',
    type: 'Custom',
    lastGenerated: '3 days ago',
    size: '1.5 MB'
  }
];

export function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  return (
    <main className="h-[calc(100vh-73px)] overflow-y-auto bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/30 dark:via-gray-900 dark:to-blue-950/30 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 px-8 py-6 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Analytics</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Comprehensive water quality insights and data analysis</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
                <option value="quarterly">Last 3 Months</option>
                <option value="yearly">Last Year</option>
              </select>
              
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export All Data
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Reports</span>
                <FileText className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">47</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12% from last month
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Quality Score</span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">72%</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +5% improvement
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Violations</span>
                <BarChart3 className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">45</div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                -18% from last month
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Locations Monitored</span>
                <Droplet className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">12</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across 10 states</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Water Quality Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Water Quality Trend</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average quality score over time</p>
                </div>
                <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={waterQualityTrend}>
                  <defs>
                    <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-20" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', border: '1px solid var(--tooltip-border, #e5e7eb)', borderRadius: '8px', color: 'var(--tooltip-text, #111827)' }}
                    wrapperClassName="dark:[--tooltip-bg:#1f2937] dark:[--tooltip-border:#374151] dark:[--tooltip-text:#f9fafb]"
                  />
                  <Area type="monotone" dataKey="quality" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorQuality)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Alert Distribution</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Breakdown by severity level</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-20" />
                  <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', border: '1px solid var(--tooltip-border, #e5e7eb)', borderRadius: '8px', color: 'var(--tooltip-text, #111827)' }}
                    wrapperClassName="dark:[--tooltip-bg:#1f2937] dark:[--tooltip-border:#374151] dark:[--tooltip-text:#f9fafb]"
                  />
                  <Legend />
                  <Bar dataKey="critical" fill="#ef4444" name="Critical" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="warning" fill="#eab308" name="Warning" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="good" fill="#22c55e" name="Good" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Parameter Violations */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Parameter Violations</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Most frequently violated parameters</p>
                </div>
              </div>
              <div className="space-y-4">
                {parameterData.map((param, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">{param.parameter}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                            style={{ width: `${(param.violations / 25) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">{param.violations}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Avg: {param.avg} | Threshold: {param.threshold}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Status Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Status</h2>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={stateDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stateDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', border: '1px solid var(--tooltip-border, #e5e7eb)', borderRadius: '8px', color: 'var(--tooltip-text, #111827)' }}
                    wrapperClassName="dark:[--tooltip-bg:#1f2937] dark:[--tooltip-border:#374151] dark:[--tooltip-text:#f9fafb]"
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {stateDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value} locations</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Polluted Locations */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Polluted Locations</h2>
              <div className="space-y-3">
                {topPollutedLocations.map((location, index) => (
                  <div key={index} className="p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">{location.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{location.violations} violations</div>
                      </div>
                      {location.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-red-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                          style={{ width: `${location.score}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">{location.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Templates */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Reports</h2>
              <div className="space-y-3">
                {reportTemplates.slice(0, 3).map((report) => (
                  <button
                    key={report.id}
                    className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">{report.name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{report.type}</span>
                          <span>•</span>
                          <span>{report.lastGenerated}</span>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* All Reports Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Report Templates</h2>
            <button className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-all flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Create Custom Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTemplates.map((report) => (
              <div
                key={report.id}
                className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs rounded-lg font-medium">
                    {report.type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{report.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{report.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span>{report.lastGenerated}</span>
                  <span>{report.size}</span>
                </div>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
