import React from 'react';
import { getRiskLevel } from '../utils/map';
import { timeAgo } from '../utils/time';
import type { Location } from '../services/api';

interface LocationPopupProps {
  location: Location;
}

export function LocationPopup({ location }: LocationPopupProps) {
  const wqi = location.avg_wqi_score ?? 0;
  const riskLevel = getRiskLevel(wqi);

  const riskColors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };

  return (
    <div className="min-w-[200px] p-2">
      <h3 className="font-semibold text-sm">{location.name}</h3>
      {location.state && (
        <p className="text-xs text-gray-500">{location.state}</p>
      )}
      <div className="mt-2 space-y-1">
        <p className="text-sm">
          WQI:{' '}
          <span className={`font-bold ${riskColors[riskLevel]}`}>{wqi}</span>
        </p>
        <p className={`text-xs font-medium ${riskColors[riskLevel]}`}>
          Risk: {riskLevel.toUpperCase()}
        </p>
        <div className="flex justify-between text-xs mt-1 text-gray-600 dark:text-gray-400">
          <span>Water Body:</span>
          <span className="capitalize">
            {location.water_body_type || 'Unknown'}
          </span>
        </div>
        {(location.active_alerts ?? 0) > 0 && (
          <div className="flex justify-between text-xs text-red-600 font-medium">
            <span>Active Alerts:</span>
            <span>{location.active_alerts}</span>
          </div>
        )}
        {location.last_reading && (
          <p className="text-xs text-gray-400 mt-2">
            Updated: {timeAgo(location.last_reading)}
          </p>
        )}
      </div>
    </div>
  );
}
