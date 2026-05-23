import { LaptopMinimal, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/app/providers/ThemeProvider';

type Theme = 'light' | 'dark' | 'system';

function nextTheme(theme: Theme): Theme {
  if (theme === 'light') return 'dark';
  if (theme === 'dark') return 'system';
  return 'light';
}

function iconFor(theme: Theme) {
  if (theme === 'dark') return <Moon className="h-4 w-4" />;
  if (theme === 'system') return <LaptopMinimal className="h-4 w-4" />;
  return <Sun className="h-4 w-4" />;
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation('layout');
  const { theme, setTheme } = useTheme();
  const currentModeLabel = t(`theme.${theme}`);

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme(theme))}
      className={[
        'inline-flex items-center rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
        compact ? 'h-9 w-9 justify-center p-0' : 'gap-2 px-3 py-1.5',
      ].join(' ')}
      title={t('theme.switchTo', { mode: currentModeLabel })}
      aria-label={t('theme.switchTo', { mode: currentModeLabel })}
    >
      {iconFor(theme)}
      {!compact ? <span>{currentModeLabel}</span> : null}
    </button>
  );
}
