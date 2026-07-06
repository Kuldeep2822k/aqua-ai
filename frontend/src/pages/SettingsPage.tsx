import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Database,
  Sliders,
  Globe,
  Palette,
} from 'lucide-react';
import { Account } from './Settings/Account';
import { Notifications } from './Settings/Notifications';
import { AlertThresholds } from './Settings/AlertThresholds';
import { Security } from './Settings/Security';
import { DataManagement } from './Settings/DataManagement';
import { Appearance } from './Settings/Appearance';
import { System } from './Settings/System';

const settingsSections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'thresholds', label: 'Alert Thresholds', icon: Sliders },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'system', label: 'System', icon: Globe },
];

interface SettingsPageProps {
  theme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
}

export function SettingsPage({ theme, onThemeChange }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState('account');

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
          {activeSection === 'account' && <Account />}
          {activeSection === 'notifications' && <Notifications />}
          {activeSection === 'thresholds' && <AlertThresholds />}
          {activeSection === 'security' && <Security />}
          {activeSection === 'data' && <DataManagement />}
          {activeSection === 'appearance' && (
            <Appearance theme={theme} onThemeChange={onThemeChange} />
          )}
          {activeSection === 'system' && <System />}
        </div>
      </div>
    </main>
  );
}
