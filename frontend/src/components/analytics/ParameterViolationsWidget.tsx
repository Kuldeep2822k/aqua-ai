import { useMemo } from 'react';
import { type WaterQualityReading } from '../../services/api';

type WaterQualityParameter = {
  code: string;
  name: string;
  unit: string;
  safe_limit: number | null;
  moderate_limit: number | null;
  high_limit: number | null;
  critical_limit: number | null;
  description?: string | null;
};

interface Props {
  parameters: WaterQualityParameter[];
  readings: WaterQualityReading[];
}

function riskToBucket(risk: string | null | undefined): 'critical' | 'warning' | 'good' {
  if (risk === 'critical' || risk === 'high') {return 'critical';}
  if (risk === 'medium') {return 'warning';}
  return 'good';
}

export function ParameterViolationsWidget({ parameters, readings }: Props) {
  const parameterData = useMemo(() => {
    const thresholdByCode = new Map<string, number | null>();
    for (const p of parameters) {
      if (p?.code) {
        thresholdByCode.set(String(p.code), p.safe_limit ?? null);
      }
    }

    const grouped = new Map<
      string,
      {
        parameter: string;
        violations: number;
        sum: number;
        count: number;
        threshold: number | null;
      }
    >();
    for (const r of readings) {
      const code = r.parameter_code;
      const entry = grouped.get(code) || {
        parameter: code,
        violations: 0,
        sum: 0,
        count: 0,
        threshold: thresholdByCode.get(code) ?? null,
      };
      if (riskToBucket(r.risk_level) !== 'good') {
        entry.violations += 1;
      }
      entry.sum += Number(r.value);
      entry.count += 1;
      grouped.set(code, entry);
    }

    return Array.from(grouped.values())
      .map((g) => ({
        parameter: g.parameter,
        violations: g.violations,
        avg: g.count ? Math.round((g.sum / g.count) * 100) / 100 : 0,
        threshold: g.threshold,
      }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 6);
  }, [parameters, readings]);

  const maxViolations = useMemo(
    () => Math.max(1, ...parameterData.map((param) => param.violations)),
    [parameterData]
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Parameter Violations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Most frequently violated parameters
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {parameterData.map((param, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
              {param.parameter}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                    style={{
                      width: `${(param.violations / maxViolations) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                  {param.violations}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Avg: {param.avg} | Threshold: {param.threshold}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
