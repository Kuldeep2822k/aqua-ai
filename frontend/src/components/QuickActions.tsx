import { Map, Bell, FileText, BarChart3, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface QuickActionsProps {
  onNavigateToMap: () => void;
  onNavigateToAnalytics: () => void;
}

export function QuickActions({
  onNavigateToMap,
  onNavigateToAnalytics,
}: QuickActionsProps) {
  const actions = [
    {
      icon: Map,
      label: 'View Full Map',
      color: 'text-blue-500 dark:text-blue-400',
      onClick: onNavigateToMap,
    },
    {
      icon: Bell,
      label: 'Create Alert Rule',
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      icon: FileText,
      label: 'Report Issue',
      color: 'text-purple-500 dark:text-purple-400',
    },
    {
      icon: BarChart3,
      label: 'View Analytics',
      color: 'text-green-500 dark:text-green-400',
      onClick: onNavigateToAnalytics,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {actions.map((action, index) => {
        const isActionable = !!action.onClick;

        const buttonContent = (
          <button
            key={index}
            onClick={isActionable ? action.onClick : undefined}
            aria-disabled={!isActionable}
            type="button"
            className={`
              w-full bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700
              transition-all flex items-center justify-between group duration-200
              ${
                isActionable
                  ? 'hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <action.icon
                className={`w-5 h-5 ${action.color} transition-colors duration-200`}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors duration-200">
                {action.label}
              </span>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-colors duration-200 ${
                isActionable
                  ? 'group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  : ''
              }`}
            />
          </button>
        );

        if (isActionable) {
          return buttonContent;
        }

        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
            <TooltipContent>
              <p>Coming Soon</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
