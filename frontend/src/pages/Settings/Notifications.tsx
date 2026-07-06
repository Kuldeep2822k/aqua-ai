import { useState } from 'react';
import { Bell, Mail, Phone, Save } from 'lucide-react';
import { toast } from 'sonner';

const NotificationsHeader = () => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
      Notification Preferences
    </h2>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Choose how you want to receive alerts and updates
    </p>
  </div>
);

interface NotificationSettingsType {
  emailAlerts: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
  criticalOnly: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
}

interface AlertChannelsProps {
  settings: NotificationSettingsType;
  onChange: (key: keyof NotificationSettingsType, checked: boolean) => void;
}

const AlertChannels = ({ settings, onChange }: AlertChannelsProps) => (
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
          <label
            htmlFor={`notif-${item.key}`}
            className="relative inline-flex items-center cursor-pointer"
          >
            <input
              id={`notif-${item.key}`}
              type="checkbox"
              checked={settings[item.key as keyof NotificationSettingsType]}
              onChange={(e) =>
                onChange(item.key as keyof NotificationSettingsType, e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      ))}
    </div>
  </div>
);

interface ReportPreferencesProps {
  settings: NotificationSettingsType;
  onChange: (key: keyof NotificationSettingsType, checked: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
}

const ReportPreferences = ({
  settings,
  onChange,
  isSaving,
  onSave,
}: ReportPreferencesProps) => (
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
          <label
            htmlFor={`pref-${item.key}`}
            className="relative inline-flex items-center cursor-pointer"
          >
            <input
              id={`pref-${item.key}`}
              type="checkbox"
              checked={settings[item.key as keyof NotificationSettingsType]}
              onChange={(e) =>
                onChange(item.key as keyof NotificationSettingsType, e.target.checked)
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
        onClick={onSave}
        disabled={isSaving}
        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  </div>
);

export function Notifications() {
  const [isSaving, setIsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsType>({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    criticalOnly: false,
    dailySummary: true,
    weeklyReport: true,
  });

  const handleSave = async () => {
    if (isSaving) {return;}
    setIsSaving(true);
    const toastId = toast.loading('Saving changes...');
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success('Changes saved', { id: toastId });
    } catch {
      toast.error('Failed to save changes', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: keyof NotificationSettingsType, checked: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  return (
    <div className="space-y-6">
      <NotificationsHeader />
      <AlertChannels
        settings={notificationSettings}
        onChange={handleSettingChange}
      />
      <ReportPreferences
        settings={notificationSettings}
        onChange={handleSettingChange}
        isSaving={isSaving}
        onSave={handleSave}
      />
    </div>
  );
}
