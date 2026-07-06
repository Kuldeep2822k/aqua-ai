import { Download } from 'lucide-react';

export function DataManagement() {
  return (
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
  );
}
