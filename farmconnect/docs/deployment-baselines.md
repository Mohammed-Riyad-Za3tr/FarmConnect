# Deployment Baselines (Render, Railway, AWS)

This guide provides practical baseline deployment setups for FarmConnect services.

## Services To Deploy

- Web: `apps/web`
- API: `apps/api`
- AI service: `apps/ai-service`
- PostgreSQL: managed database (provider-managed)

## Required Environment Variables

### API (`apps/api`)
- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=...`
- `JWT_ACCESS_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `CLIENT_URL=https://<web-domain>`
- `STRIPE_SECRET_KEY=...`
- `STRIPE_WEBHOOK_SECRET=...`
- `AI_SERVICE_URL=https://<ai-domain>`

### Web (`apps/web`)
- `VITE_API_URL=https://<api-domain>`
- `VITE_APP_NAME=FarmConnect`

### AI service (`apps/ai-service`)
- `APP_ENV=production`
- `HOST=0.0.0.0`
- `PORT=8000`
- `INTERNAL_API_KEY=...`
- `API_BASE_URL=https://<api-domain>`
- `LOG_LEVEL=INFO`

## Render Baseline

### API (Web Service)
- Root directory: repository root
- Build command:
  `pnpm install --frozen-lockfile && pnpm --filter @farmconnect/shared build && pnpm --filter @farmconnect/api build`
- Start command:
  `pnpm --filter @farmconnect/api start`
- Health check path:
  `/api/health`

### Web (Static Site)
- Root directory: repository root
- Build command:
  `pnpm install --frozen-lockfile && pnpm --filter @farmconnect/shared build && pnpm --filter @farmconnect/ui build && pnpm --filter @farmconnect/web build`
- Publish directory:
  `apps/web/dist`

### AI Service (Web Service)
- Root directory: `apps/ai-service`
- Build command:
  `pip install -r requirements.txt`
- Start command:
  `python -m uvicorn src.app:app --host 0.0.0.0 --port 8000`
- Health check path:
  `/api/health`

## Railway Baseline

### API
- Start command:
  `pnpm --filter @farmconnect/api start`
- Build command:
  `pnpm install --frozen-lockfile && pnpm --filter @farmconnect/shared build && pnpm --filter @farmconnect/api build`

### Web
- Build command:
  `pnpm install --frozen-lockfile && pnpm --filter @farmconnect/shared build && pnpm --filter @farmconnect/ui build && pnpm --filter @farmconnect/web build`
- Serve with static hosting plugin or deploy as static artifact from `apps/web/dist`

### AI Service
- Build command:
  `pip install -r requirements.txt`
- Start command:
  `python -m uvicorn src.app:app --host 0.0.0.0 --port $PORT`

## AWS Baseline (ECS Fargate)

### Container Images
- Build and push:
  - `apps/api/Dockerfile`
  - `apps/web/Dockerfile`
  - `apps/ai-service/Dockerfile`
- Push to ECR repositories: `farmconnect-api`, `farmconnect-web`, `farmconnect-ai`

### Runtime Topology
- API ECS Service behind ALB target group
- AI ECS Service behind ALB target group (internal or public)
- Web served via CloudFront + ALB/Nginx container or S3 + CloudFront
- Database in RDS PostgreSQL

### ECS Health Checks
- API: `/api/health`
- AI: `/api/health`

## CI/CD Trigger Model

- Main CI workflow validates lint/typecheck/test/build.
- CD workflows trigger deployment hooks after validation:
  - API: `.github/workflows/api-cd.yml`
  - Web: `.github/workflows/web-cd.yml`
  - AI: `.github/workflows/ai-cd.yml`
- DB migrations use `.github/workflows/db-migrate.yml`.

## Post-Deploy Smoke Checks

- API health: `GET /api/health`
- AI health: `GET /api/health`
- Web page load and login flow
- API auth flow: register/login/me
- Payment webhook endpoint responds for signed test event

