import { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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

const ThresholdsHeader = () => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
      Alert Thresholds
    </h2>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Configure water quality parameter thresholds for alerts
    </p>
  </div>
);

const WarningBanner = () => (
  <div className="flex items-center gap-2 mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
    <p className="text-sm text-yellow-800 dark:text-yellow-200">
      Changes to thresholds will affect alert generation. Use
      caution when modifying these values.
    </p>
  </div>
);

interface Param {
  id: string;
  name: string;
  unit: string;
  current: number;
  safe: number;
  critical: number;
}

const ThresholdCard = ({ param }: { param: Param }) => (
  <div className="p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
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
        <label
          htmlFor={`current-${param.id}`}
          className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2"
        >
          Current Value
        </label>
        <input
          id={`current-${param.id}`}
          type="number"
          defaultValue={param.current}
          step="0.1"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor={`safe-${param.id}`}
          className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2"
        >
          Safe Threshold
        </label>
        <input
          id={`safe-${param.id}`}
          type="number"
          defaultValue={param.safe}
          step="0.1"
          className="w-full px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white text-sm"
        />
      </div>
      <div>
        <label
          htmlFor={`critical-${param.id}`}
          className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2"
        >
          Critical Threshold
        </label>
        <input
          id={`critical-${param.id}`}
          type="number"
          defaultValue={param.critical}
          step="0.1"
          className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-white text-sm"
        />
      </div>
    </div>
  </div>
);

const ThresholdsList = ({ params }: { params: Param[] }) => (
  <div className="space-y-6">
    {params.map((param) => (
      <ThresholdCard key={param.id} param={param} />
    ))}
  </div>
);

interface ThresholdsContainerProps {
  isSaving: boolean;
  onSave: () => void;
  params: Param[];
}

const ThresholdsContainer = ({ isSaving, onSave, params }: ThresholdsContainerProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
    <WarningBanner />
    <ThresholdsList params={params} />

    <div className="flex justify-end mt-6">
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Saving...' : 'Save Thresholds'}
      </button>
    </div>
  </div>
);

export function AlertThresholds() {
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <div className="space-y-6">
      <ThresholdsHeader />
      <ThresholdsContainer
        isSaving={isSaving}
        onSave={handleSave}
        params={parameterThresholds}
      />
    </div>
  );
}
