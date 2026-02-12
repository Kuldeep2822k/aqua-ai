import {
  User,
  Bell,
  Shield,
  Database,
  Sliders,
  Globe,
  Palette,
  Download,
  Trash2,
  Save,
  Key,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const settingsSections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'thresholds', label: 'Alert Thresholds', icon: Sliders },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'system', label: 'System', icon: Globe },
];

const parameterThresholds = [
  {
    id: 'bod',
    name: 'BOD (Biological Oxygen Demand)',
    unit: 'mg/L',
    current: 3.0,
    safe: 3.0,
    critical: 5.0,
  },
  {
    id: 'ph',
    name: 'pH Level',
    unit: '',
    current: 8.5,
    safe: 8.5,
    critical: 9.5,
  },
  {
    id: 'tds',
    name: 'TDS (Total Dissolved Solids)',
    unit: 'ppm',
    current: 500,
    safe: 500,
    critical: 1000,
  },
  {
    id: 'do',
    name: 'DO (Dissolved Oxygen)',
    unit: 'mg/L',
    current: 5.0,
    safe: 5.0,
    critical: 3.0,
  },
  {
    id: 'turbidity',
    name: 'Turbidity',
    unit: 'NTU',
    current: 10,
    safe: 10,
    critical: 50,
  },
  {
    id: 'lead',
    name: 'Lead',
    unit: 'mg/L',
    current: 0.01,
    safe: 0.01,
    critical: 0.1,
  },
];

interface SettingsPageProps {
  theme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
}

export function SettingsPage({ theme, onThemeChange }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState('account');
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    criticalOnly: false,
    dailySummary: true,
    weeklyReport: true,
  });
  const [density, setDensity] = useState<'comfortable' | 'compact'>(
    'comfortable'
  );
  const [savingSection, setSavingSection] = useState<
    'profile' | 'preferences' | 'thresholds' | 'appearance' | 'settings' | null
  >(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accentIndex, setAccentIndex] = useState(0);

  const accentColors = [
    { label: 'Blue', className: 'bg-blue-500' },
    { label: 'Purple', className: 'bg-purple-500' },
    { label: 'Green', className: 'bg-green-500' },
    { label: 'Red', className: 'bg-red-500' },
    { label: 'Orange', className: 'bg-orange-500' },
    { label: 'Pink', className: 'bg-pink-500' },
  ];

  const handleSave = async (section: NonNullable<typeof savingSection>) => {
    if (savingSection) return;
    setSavingSection(section);
    const toastId = toast.loading('Saving changes...');
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success('Changes saved', { id: toastId });
    } catch {
      toast.error('Failed to save changes', { id: toastId });
    } finally {
      setSavingSection(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (!confirmed) return;
    setIsDeletingAccount(true);
    const toastId = toast.loading('Deleting account...');
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.error('Account deletion is not configured yet', { id: toastId });
    } catch {
      toast.error('Failed to delete account', { id: toastId });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <main className="h-[calc(100vh-73px)] flex bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto transition-colors duration-200">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your preferences
          </p>
        </div>

        <nav className="px-3 pb-4">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Account Settings */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Account Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your account information and preferences
                </p>
              </div>

              {/* Profile Information */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Profile Information
                </h3>

                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    JD
                  </div>
                  <div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium mb-2"
                    >
                      Change Photo
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue="John"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Doe"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        defaultValue="john.doe@example.com"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        defaultValue="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organization
                    </label>
                    <input
                      type="text"
                      defaultValue="Central Pollution Control Board"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        defaultValue="New Delhi, India"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => handleSave('profile')}
                    disabled={savingSection === 'profile'}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {savingSection === 'profile' ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Notification Preferences
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose how you want to receive alerts and updates
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Alert Channels
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      key: 'emailAlerts',
                      icon: Mail,
                      label: 'Email Alerts',
                      sub: 'Receive alerts via email',
                      bg: 'bg-blue-100 dark:bg-blue-900/30',
                      text: 'text-blue-600 dark:text-blue-400',
                    },
                    {
                      key: 'smsAlerts',
                      icon: Phone,
                      label: 'SMS Alerts',
                      sub: 'Receive critical alerts via SMS',
                      bg: 'bg-green-100 dark:bg-green-900/30',
                      text: 'text-green-600 dark:text-green-400',
                    },
                    {
                      key: 'pushNotifications',
                      icon: Bell,
                      label: 'Push Notifications',
                      sub: 'Receive browser notifications',
                      bg: 'bg-purple-100 dark:bg-purple-900/30',
                      text: 'text-purple-600 dark:text-purple-400',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center`}
                        >
                          <item.icon className={`w-5 h-5 ${item.text}`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.label}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.sub}
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            notificationSettings[
                              item.key as keyof typeof notificationSettings
                            ]
                          }
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Report Preferences
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      key: 'criticalOnly',
                      label: 'Critical Alerts Only',
                      sub: 'Only notify for critical severity alerts',
                    },
                    {
                      key: 'dailySummary',
                      label: 'Daily Summary',
                      sub: 'Receive daily activity summary at 9:00 AM',
                    },
                    {
                      key: 'weeklyReport',
                      label: 'Weekly Report',
                      sub: 'Receive comprehensive weekly report',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.sub}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            notificationSettings[
                              item.key as keyof typeof notificationSettings
                            ]
                          }
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => handleSave('preferences')}
                    disabled={savingSection === 'preferences'}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {savingSection === 'preferences'
                      ? 'Saving...'
                      : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alert Thresholds */}
          {activeSection === 'thresholds' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Alert Thresholds
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure water quality parameter thresholds for alerts
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <div className="flex items-center gap-2 mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Changes to thresholds will affect alert generation. Use
                    caution when modifying these values.
                  </p>
                </div>

                <div className="space-y-6">
                  {parameterThresholds.map((param) => (
                    <div
                      key={param.id}
                      className="p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {param.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Unit: {param.unit || 'N/A'}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          Reset to Default
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Current Value
                          </label>
                          <input
                            type="number"
                            defaultValue={param.current}
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Safe Threshold
                          </label>
                          <input
                            type="number"
                            defaultValue={param.safe}
                            step="0.1"
                            className="w-full px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Critical Threshold
                          </label>
                          <input
                            type="number"
                            defaultValue={param.critical}
                            step="0.1"
                            className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => handleSave('thresholds')}
                    disabled={savingSection === 'thresholds'}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {savingSection === 'thresholds'
                      ? 'Saving...'
                      : 'Save Thresholds'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Security Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your account security and authentication
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Change Password
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        placeholder="Enter current password"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Update Password
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add an extra layer of security to your account
                </p>

                <button
                  type="button"
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/30 font-medium"
                >
                  Enable 2FA
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-red-200 dark:border-red-900/50 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                  Danger Zone
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Irreversible and destructive actions
                </p>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          )}

          {/* Data Management */}
          {activeSection === 'data' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Data Management
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your data, exports, and storage
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Data Export
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Download your data in various formats
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="p-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
                    <div className="font-medium text-gray-900 dark:text-white">
                      Export as CSV
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      All monitoring data
                    </div>
                  </button>
                  <button
                    type="button"
                    className="p-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <Download className="w-5 h-5 text-green-600 dark:text-green-400 mb-2" />
                    <div className="font-medium text-gray-900 dark:text-white">
                      Export as Excel
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Formatted spreadsheet
                    </div>
                  </button>
                  <button
                    type="button"
                    className="p-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <Download className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2" />
                    <div className="font-medium text-gray-900 dark:text-white">
                      Export as JSON
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Raw data format
                    </div>
                  </button>
                  <button
                    type="button"
                    className="p-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <Download className="w-5 h-5 text-red-600 dark:text-red-400 mb-2" />
                    <div className="font-medium text-gray-900 dark:text-white">
                      Export as PDF
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Printable report
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Storage Usage
                </h3>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      12.4 GB of 50 GB used
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      24.8%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: '24.8%' }}
                    ></div>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors font-medium"
                >
                  Upgrade Storage
                </button>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Appearance
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customize how the application looks
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Theme
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Choose your preferred color scheme
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => onThemeChange('light')}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="w-full h-20 bg-white rounded-lg mb-3 shadow-sm border border-gray-200 flex items-center justify-center">
                      <div className="text-xs text-gray-400">Light Mode</div>
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white flex items-center justify-center gap-2">
                      Light
                      {theme === 'light' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onThemeChange('dark')}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="w-full h-20 bg-gray-900 rounded-lg mb-3 flex items-center justify-center border border-gray-700">
                      <div className="text-xs text-gray-400">Dark Mode</div>
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white flex items-center justify-center gap-2">
                      Dark
                      {theme === 'dark' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onThemeChange('auto')}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      theme === 'auto'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="w-full h-20 bg-gradient-to-r from-white via-gray-400 to-gray-900 rounded-lg mb-3 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-600 dark:text-gray-300 mix-blend-difference">
                        Auto
                      </div>
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white flex items-center justify-center gap-2">
                      Auto
                      {theme === 'auto' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Current theme:{' '}
                        <span className="capitalize">{theme}</span>
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        {theme === 'light' &&
                          'Light theme provides a clean and bright interface'}
                        {theme === 'dark' &&
                          'Dark theme is easier on the eyes in low-light conditions'}
                        {theme === 'auto' &&
                          'Auto theme switches between light and dark based on system preferences'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Display Density
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Adjust spacing and content density
                </p>

                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      density === 'comfortable'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="density"
                      checked={density === 'comfortable'}
                      onChange={() => setDensity('comfortable')}
                      className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        Comfortable
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        More spacing between elements for easier reading
                      </div>
                      <div className="mt-2 space-y-1.5">
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                      </div>
                    </div>
                    {density === 'comfortable' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      density === 'compact'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="density"
                      checked={density === 'compact'}
                      onChange={() => setDensity('compact')}
                      className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        Compact
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Less spacing to fit more content on screen
                      </div>
                      <div className="mt-2 space-y-0.5">
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                      </div>
                    </div>
                    {density === 'compact' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </label>
                </div>

                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                        Current density:{' '}
                        <span className="capitalize">{density}</span>
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">
                        {density === 'comfortable' &&
                          'Comfortable density provides better readability with generous spacing'}
                        {density === 'compact' &&
                          'Compact density maximizes screen space for data-heavy interfaces'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Color Accent
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Choose your preferred accent color (Coming Soon)
                </p>

                <div className="grid grid-cols-6 gap-3">
                  {accentColors.map((color, index) => (
                    <button
                      key={color.label}
                      type="button"
                      aria-label={`${color.label} accent`}
                      title={`${color.label} accent`}
                      aria-pressed={accentIndex === index}
                      onClick={() => setAccentIndex(index)}
                      className={`w-full aspect-square ${color.className} rounded-xl hover:scale-110 transition-transform ${
                        accentIndex === index
                          ? 'ring-4 ring-blue-200 dark:ring-blue-900'
                          : ''
                      }`}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-medium"
                >
                  Reset to Defaults
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('appearance')}
                  disabled={savingSection === 'appearance'}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {savingSection === 'appearance'
                    ? 'Saving...'
                    : 'Save Appearance'}
                </button>
              </div>
            </div>
          )}

          {/* System */}
          {activeSection === 'system' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  System Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure system-level preferences
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Regional Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Zone
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Asia/Kolkata (IST)</option>
                      <option>Asia/Dubai (GST)</option>
                      <option>Europe/London (GMT)</option>
                      <option>America/New_York (EST)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Format
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>English (US)</option>
                      <option>हिन्दी (Hindi)</option>
                      <option>తెలుగు (Telugu)</option>
                      <option>தமிழ் (Tamil)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => handleSave('settings')}
                    disabled={savingSection === 'settings'}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {savingSection === 'settings'
                      ? 'Saving...'
                      : 'Save Settings'}
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  About
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Version
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      2.4.1
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Last Updated
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      January 20, 2026
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      License
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Enterprise
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
