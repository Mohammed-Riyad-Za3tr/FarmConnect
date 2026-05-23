# Migration And Deploy Runbook

This runbook is for production release operators.

## 1. Pre-Deploy Checklist

- Confirm `main` branch is green in CI.
- Confirm secrets are present:
  - `PRODUCTION_DATABASE_URL`
  - `API_DEPLOY_HOOK_URL`
  - `WEB_DEPLOY_HOOK_URL`
  - `AI_DEPLOY_HOOK_URL`
- Confirm env vars in each platform service match `.env.example` templates.

## 2. Migration Safety Steps

1. Check migration status:
```bash
pnpm --filter @farmconnect/api exec prisma migrate status
```

2. Create backup/snapshot of production database.

3. Apply migrations:
```bash
pnpm --filter @farmconnect/api db:migrate:deploy
```

4. Validate schema and connection:
```bash
pnpm --filter @farmconnect/api db:generate
```

## 3. Deploy Order

Recommended order:
1. AI service
2. API
3. Web

Reason: API can reference AI, and web depends on API contracts.

## 4. Release Verification

### API checks
- `GET /api/health` returns 200
- Register/login/me flow works
- Checkout and payment intent endpoint works

### AI checks
- `GET /api/health` returns 200
- `/api/recommend_price` responds with valid payload

### Web checks
- Home page loads
- Login and dashboard route loads
- Checkout page loads and calls API successfully

## 5. Rollback Plan

If API release fails:
- Roll back API service to previous image/build.
- Keep DB changes only if backward compatible.

If migration causes regressions:
- Restore DB from snapshot.
- Roll back API to previous version.
- Open incident and block further deploys until root cause is fixed.

If web release fails:
- Roll back web static artifact/deploy.

## 6. Incident Notes Template

Capture:
- release SHA
- deployment timestamp UTC
- failing endpoint/check
- logs with requestId correlation
- rollback action and completion time

