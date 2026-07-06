import { useState } from 'react';
import { Palette, Sliders, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AppearanceProps {
  theme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
}

const AppearanceHeader = () => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
      Appearance
    </h2>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Customize how the application looks
    </p>
  </div>
);

interface ThemeSectionProps {
  theme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
}

const ThemeSection = ({ theme, onThemeChange }: ThemeSectionProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Theme
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Choose your preferred color scheme
    </p>

    <div className="grid grid-cols-3 gap-4">
      <button
        type="button"
        onClick={() => onThemeChange('light')}
        className={`p-4 border-2 rounded-xl transition-all ${
          theme === 'light'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <div className="w-full h-20 bg-white rounded-lg mb-3 shadow-sm border border-gray-200 flex items-center justify-center">
          <div className="text-xs text-gray-400">Light Mode</div>
        </div>
        <div className="font-medium text-gray-900 dark:text-white flex items-center justify-center gap-2">
          Light
          {theme === 'light' && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={() => onThemeChange('dark')}
        className={`p-4 border-2 rounded-xl transition-all ${
          theme === 'dark'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <div className="w-full h-20 bg-gray-900 rounded-lg mb-3 flex items-center justify-center border border-gray-700">
          <div className="text-xs text-gray-400">Dark Mode</div>
        </div>
        <div className="font-medium text-gray-900 dark:text-white flex items-center justify-center gap-2">
          Dark
          {theme === 'dark' && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={() => onThemeChange('auto')}
        className={`p-4 border-2 rounded-xl transition-all ${
          theme === 'auto'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <div className="w-full h-20 bg-gradient-to-r from-white via-gray-400 to-gray-900 rounded-lg mb-3 flex items-center justify-center border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-300 mix-blend-difference">
            Auto
          </div>
        </div>
        <div className="font-medium text-gray-900 dark:text-white flex items-center justify-center gap-2">
          Auto
          {theme === 'auto' && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      </button>
    </div>

    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl">
      <div className="flex items-start gap-3">
        <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            Current theme: <span className="capitalize">{theme}</span>
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            {theme === 'light' &&
              'Light theme provides a clean and bright interface'}
            {theme === 'dark' &&
              'Dark theme is easier on the eyes in low-light conditions'}
            {theme === 'auto' &&
              'Auto theme switches between light and dark based on system preferences'}
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface DensitySectionProps {
  density: 'comfortable' | 'compact';
  setDensity: (density: 'comfortable' | 'compact') => void;
}

const DensitySection = ({ density, setDensity }: DensitySectionProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Display Density
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Adjust spacing and content density
    </p>

    <div className="space-y-3">
      <label
        htmlFor="density-comfortable"
        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
          density === 'comfortable'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400'
        }`}
      >
        <input
          id="density-comfortable"
          type="radio"
          name="density"
          checked={density === 'comfortable'}
          onChange={() => setDensity('comfortable')}
          className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white mb-1">
            Comfortable
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            More spacing between elements for easier reading
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
        {density === 'comfortable' && (
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </label>

      <label
        htmlFor="density-compact"
        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
          density === 'compact'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400'
        }`}
      >
        <input
          id="density-compact"
          type="radio"
          name="density"
          checked={density === 'compact'}
          onChange={() => setDensity('compact')}
          className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white mb-1">
            Compact
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Less spacing to fit more content on screen
          </div>
          <div className="mt-2 space-y-0.5">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
          </div>
        </div>
        {density === 'compact' && (
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </label>
    </div>

    <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl">
      <div className="flex items-start gap-3">
        <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
            Current density: <span className="capitalize">{density}</span>
          </div>
          <div className="text-xs text-purple-700 dark:text-purple-300">
            {density === 'comfortable' &&
              'Comfortable density provides better readability with generous spacing'}
            {density === 'compact' &&
              'Compact density maximizes screen space for data-heavy interfaces'}
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface ColorAccentSectionProps {
  accentIndex: number;
  setAccentIndex: (index: number) => void;
  accentColors: Array<{ label: string; className: string }>;
}

const ColorAccentSection = ({
  accentIndex,
  setAccentIndex,
  accentColors,
}: ColorAccentSectionProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Color Accent
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Choose your preferred accent color (Coming Soon)
    </p>

    <div className="grid grid-cols-6 gap-3">
      {accentColors.map((color, index) => (
        <button
          key={color.label}
          type="button"
          aria-label={`${color.label} accent`}
          title={`${color.label} accent`}
          aria-pressed={accentIndex === index}
          onClick={() => setAccentIndex(index)}
          className={`w-full aspect-square ${color.className} rounded-xl hover:scale-110 transition-transform ${
            accentIndex === index
              ? 'ring-4 ring-blue-200 dark:ring-blue-900'
              : ''
          }`}
        ></button>
      ))}
    </div>
  </div>
);

interface AppearanceActionsProps {
  isSaving: boolean;
  onSave: () => void;
}

const AppearanceActions = ({ isSaving, onSave }: AppearanceActionsProps) => (
  <div className="flex justify-between items-center pt-4">
    <button
      type="button"
      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors font-medium"
    >
      Reset to Defaults
    </button>
    <button
      type="button"
      onClick={onSave}
      disabled={isSaving}
      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Save className="w-4 h-4" />
      {isSaving ? 'Saving...' : 'Save Appearance'}
    </button>
  </div>
);

export function Appearance({ theme, onThemeChange }: AppearanceProps) {
  const [density, setDensity] = useState<'comfortable' | 'compact'>(
    'comfortable'
  );
  const [accentIndex, setAccentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const accentColors = [
    { label: 'Blue', className: 'bg-blue-500' },
    { label: 'Purple', className: 'bg-purple-500' },
    { label: 'Green', className: 'bg-green-500' },
    { label: 'Red', className: 'bg-red-500' },
    { label: 'Orange', className: 'bg-orange-500' },
    { label: 'Pink', className: 'bg-pink-500' },
  ];

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
      <AppearanceHeader />
      <ThemeSection theme={theme} onThemeChange={onThemeChange} />
      <DensitySection density={density} setDensity={setDensity} />
      <ColorAccentSection
        accentIndex={accentIndex}
        setAccentIndex={setAccentIndex}
        accentColors={accentColors}
      />
      <AppearanceActions isSaving={isSaving} onSave={handleSave} />
    </div>
  );
}
