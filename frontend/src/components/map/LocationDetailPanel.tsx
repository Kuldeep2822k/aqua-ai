import { useState } from 'react';
import { MapPin, Activity, Droplet, AlertCircle } from 'lucide-react';
import { waterQualityApi, type WaterQualityReading } from '../../services/api';
import { type MapPoint } from './types';

const statusBgColors = {
  critical: 'bg-red-500',
  warning: 'bg-yellow-500',
  good: 'bg-green-500',
};

const statusLabels = {
  critical: 'Critical',
  warning: 'Warning',
  good: 'Good',
};

interface LocationDetailPanelProps {
  selectedData: MapPoint;
  onClose: () => void;
}

function PrimaryIssue({ selectedData }: { selectedData: MapPoint }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Primary Issue
      </div>
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <p className="text-sm text-red-900 dark:text-red-300 font-medium">
          {(selectedData.active_alerts ?? 0) > 0
            ? `${selectedData.active_alerts} active alert(s)`
            : `Risk status: ${statusLabels[selectedData.status as keyof typeof statusLabels]}`}
        </p>
      </div>
    </div>
  );
}

function WaterParameters({ selectedData }: { selectedData: MapPoint }) {
  const wqiScore =
    selectedData.derived_wqi_score !== null &&
    selectedData.derived_wqi_score !== undefined
      ? Number(selectedData.derived_wqi_score).toFixed(1)
      : selectedData.avg_wqi_score !== null &&
          selectedData.avg_wqi_score !== undefined
        ? Number(selectedData.avg_wqi_score).toFixed(1)
        : 'N/A';

  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Water Parameters
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              WQI Score
            </span>
          </div>
          <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
            {wqiScore}
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              Active Alerts
            </span>
          </div>
          <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
            {selectedData.active_alerts ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationDetails({ selectedData }: { selectedData: MapPoint }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Location Details
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Latitude
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedData.lat.toFixed(4)}°
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Longitude
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedData.lng.toFixed(4)}°
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Last Updated
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedData.last_reading
              ? new Date(selectedData.last_reading).toLocaleString()
              : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ReadingsViewProps {
  showReadings: boolean;
  setShowReadings: (val: boolean) => void;
  readingsLoading: boolean;
  readingsError: string | null;
  readings: WaterQualityReading[];
}

function ReadingsView({
  showReadings,
  setShowReadings,
  readingsLoading,
  readingsError,
  readings,
}: ReadingsViewProps) {
  if (!showReadings) return null;

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          All Readings
        </div>
        <button
          type="button"
          onClick={() => setShowReadings(false)}
          className="text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>

      {readingsLoading && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Loading readings…
        </div>
      )}

      {!readingsLoading && readingsError && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {readingsError}
        </div>
      )}

      {!readingsLoading && !readingsError && (
        <div className="max-h-[260px] overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                  Date
                </th>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                  Param
                </th>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                  Value
                </th>
                <th className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                  Risk
                </th>
              </tr>
            </thead>
            <tbody>
              {readings.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-3 text-gray-600 dark:text-gray-300"
                  >
                    No readings found.
                  </td>
                </tr>
              ) : (
                readings.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {new Date(r.measurement_date).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                      {r.parameter_code}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {Number(r.value).toFixed(2)} {r.unit || ''}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                      {r.risk_level || 'n/a'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function LocationDetailPanel({
  selectedData,
  onClose,
}: LocationDetailPanelProps) {
  const [showReadings, setShowReadings] = useState(false);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [readingsError, setReadingsError] = useState<string | null>(null);
  const [readings, setReadings] = useState<WaterQualityReading[]>([]);

  return (
    <div className="w-[400px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-2xl transition-colors duration-200">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedData.name}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedData.state}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${statusBgColors[selectedData.status as keyof typeof statusBgColors]} text-white shadow-lg`}
        >
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {statusLabels[selectedData.status as keyof typeof statusLabels]}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <PrimaryIssue selectedData={selectedData} />

          <WaterParameters selectedData={selectedData} />

          <LocationDetails selectedData={selectedData} />

          {/* Actions */}
          <div className="pt-4 space-y-2">
            <button
              type="button"
              onClick={async () => {
                setShowReadings(true);
                setReadingsLoading(true);
                setReadingsError(null);
                try {
                  const res = await waterQualityApi.getAllReadings({
                    location_id: selectedData.id,
                  });
                  setReadings(res?.data ?? []);
                } catch (e: unknown) {
                  setReadingsError(
                    e instanceof Error ? e.message : 'Failed to load readings'
                  );
                  setReadings([]);
                } finally {
                  setReadingsLoading(false);
                }
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium"
            >
              View Full Analytics
            </button>
            <button
              type="button"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium"
            >
              Download Data
            </button>
          </div>

          <ReadingsView
            showReadings={showReadings}
            setShowReadings={setShowReadings}
            readingsLoading={readingsLoading}
            readingsError={readingsError}
            readings={readings}
          />
        </div>
      </div>
    </div>
  );
}
