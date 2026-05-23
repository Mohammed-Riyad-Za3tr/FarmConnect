import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('GET /api/unknown-route', () => {
  it('returns 404 JSON with NOT_FOUND code', async () => {
    const res = await request(app).get('/api/unknown-route').set('X-Request-ID', 'req-404-1');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.requestId).toBe('req-404-1');
  });
});
