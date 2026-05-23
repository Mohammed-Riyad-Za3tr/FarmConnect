# FarmConnect

FarmConnect is an AgriTech marketplace monorepo connecting producers directly with buyers.

## Monorepo Overview

| Workspace | Path | Stack | Purpose |
|---|---|---|---|
| Web | `apps/web` | React 19, Vite, Tailwind, TypeScript | Buyer, producer, and admin frontend |
| API | `apps/api` | Express, TypeScript, Prisma, PostgreSQL | Core business and auth APIs |
| AI service | `apps/ai-service` | FastAPI, Python 3.12 | Pricing, demand forecast, chatbot endpoints |
| Shared | `packages/shared` | TypeScript package | Shared enums, types, schemas, constants |
| UI | `packages/ui` | React package | Shared UI primitives |
| Config | `packages/config` | Tooling package | ESLint, Prettier, and TS configs |

Tooling: pnpm workspaces + Turborepo.

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 22.x |
| pnpm | 9.x |
| Python | 3.12+ |
| PostgreSQL | 15+ |

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

## Local Setup (Reproducible)

1. Install dependencies:
```bash
pnpm install --frozen-lockfile
```

2. Copy env files:
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/ai-service/.env.example apps/ai-service/.env
```

3. Apply DB migrations:
```bash
pnpm --filter @farmconnect/api db:migrate
```

4. Start all apps:
```bash
pnpm dev
```

Default endpoints:
- Web: http://localhost:5173
- API: http://localhost:4000
- AI service: http://localhost:8000

## Seller Test Accounts

Password for all sellers: test1234

| Seller | Email |
|---|---|
| Karim Benali | karim@farmconnect.dz |
| Nour Khelifi | nour@farmconnect.dz |
| Yasmine Ait Hamou | yasmine@farmconnect.dz |
| Bilal Mansouri | bilal@farmconnect.dz |
| Lina Haddad | lina.pro@farmconnect.dz |

## Docker Usage

Build from repo root:
```bash
docker build -f apps/api/Dockerfile -t farmconnect-api .
docker build -f apps/web/Dockerfile -t farmconnect-web .
docker build -f apps/ai-service/Dockerfile -t farmconnect-ai ./apps/ai-service
```

Run examples:
```bash
docker run --rm -p 4000:4000 --env-file apps/api/.env farmconnect-api
docker run --rm -p 8080:80 farmconnect-web
docker run --rm -p 8000:8000 --env-file apps/ai-service/.env farmconnect-ai
```

## Quality Gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Deployment And Handoff Docs

- Baseline provider deployment guide: `docs/deployment-baselines.md`
- Migration and release runbook: `docs/migration-deploy-runbook.md`
- Architecture overview: `docs/architecture.md`
- Architecture decision summary: `docs/architecture-decisions.md`

## CI/CD Workflows

- Monorepo CI: `.github/workflows/ci.yml`
- API CD: `.github/workflows/api-cd.yml`
- Web CD: `.github/workflows/web-cd.yml`
- AI CD: `.github/workflows/ai-cd.yml`
- DB migrate job: `.github/workflows/db-migrate.yml`

Expected deployment secrets:
- `API_DEPLOY_HOOK_URL`
- `WEB_DEPLOY_HOOK_URL`
- `AI_DEPLOY_HOOK_URL`
- `PRODUCTION_DATABASE_URL`
- `VITE_API_URL`

## License

MIT
