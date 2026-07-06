import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

const SystemHeader = () => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
      System Settings
    </h2>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Configure system-level preferences
    </p>
  </div>
);

interface RegionalSettingsProps {
  isSaving: boolean;
  onSave: () => void;
}

const RegionalSettings = ({ isSaving, onSave }: RegionalSettingsProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Regional Settings
    </h3>

    <div className="space-y-4">
      <div>
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Time Zone
        </label>
        <select
          id="timezone"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>Asia/Kolkata (IST)</option>
          <option>Asia/Dubai (GST)</option>
          <option>Europe/London (GMT)</option>
          <option>America/New_York (EST)</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="dateformat"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Date Format
        </label>
        <select
          id="dateformat"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>DD/MM/YYYY</option>
          <option>MM/DD/YYYY</option>
          <option>YYYY-MM-DD</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="language"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Language
        </label>
        <select
          id="language"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
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
        onClick={onSave}
        disabled={isSaving}
        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  </div>
);

const AboutSection = () => (
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
);

export function System() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }
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

  return (
    <div className="space-y-6">
      <SystemHeader />
      <RegionalSettings isSaving={isSaving} onSave={handleSave} />
      <AboutSection />
    </div>
  );
}
