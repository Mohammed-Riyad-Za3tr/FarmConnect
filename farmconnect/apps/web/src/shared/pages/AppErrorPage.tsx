import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

export function AppErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong';

  const message = isRouteErrorResponse(error)
    ? typeof error.data === 'string'
      ? error.data
      : 'The page failed to render. Please try again.'
    : error instanceof Error
      ? error.message
      : 'Unexpected application error.';

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">Application Error</p>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      <p className="max-w-lg text-sm text-gray-600 dark:text-gray-300">{message}</p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Go back
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Go home
        </button>
      </div>
    </div>
  );
}
