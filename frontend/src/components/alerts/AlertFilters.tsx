import { Search, XCircle } from 'lucide-react';

interface Props {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterSeverity: string;
  setFilterSeverity: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  filteredCount: number;
  totalCount: number;
}

export function AlertFilters({
  searchQuery,
  setSearchQuery,
  filterSeverity,
  setFilterSeverity,
  filterStatus,
  setFilterStatus,
  filteredCount,
  totalCount,
}: Props) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          aria-label="Search alerts"
          placeholder="Search alerts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label
            htmlFor="filter-severity"
            className="text-xs text-gray-500 dark:text-gray-400 mb-1 block"
          >
            Severity
          </label>
          <select
            id="filter-severity"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex-1">
          <label
            htmlFor="filter-status"
            className="text-xs text-gray-500 dark:text-gray-400 mb-1 block"
          >
            Status
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Showing {filteredCount} of {totalCount} alerts
      </div>
    </div>
  );
}
