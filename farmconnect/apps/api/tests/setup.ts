// Set required environment variables before any module is loaded in tests.
// These are test-only stubs and must never be used in production.
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/farmconnect_test';
process.env['JWT_ACCESS_SECRET'] = 'test-access-secret-that-is-at-least-32-chars!!';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-that-is-at-least-32-chars!';
