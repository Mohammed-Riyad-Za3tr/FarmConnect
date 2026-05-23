import { Toaster } from 'react-hot-toast';

import { useTheme } from './ThemeProvider';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? '#1f2937' : '#ffffff',
            color: isDark ? '#f9fafb' : '#111827',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: { primary: '#16a34a', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}
