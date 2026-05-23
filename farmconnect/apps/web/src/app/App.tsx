
import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';
import { I18nProvider } from './providers/I18nProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import { AppRouter } from './router';

export function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <QueryProvider>
            <NotificationProvider>
              <AppRouter />
            </NotificationProvider>
          </QueryProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
