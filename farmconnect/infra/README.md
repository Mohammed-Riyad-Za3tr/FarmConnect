# Infrastructure

This directory is reserved for infrastructure-as-code definitions and deployment manifests.

## Current deployment baseline

FarmConnect currently deploys using GitHub Actions + platform deploy hooks.

Reference docs:
- `docs/deployment-baselines.md`
- `docs/migration-deploy-runbook.md`
- `docs/architecture-decisions.md`

## Planned IaC contents

```
infra/
├── render/          Render.com service definitions (render.yaml)
├── railway/         Railway project config
└── docker/          Docker Compose for full local stack
```

## Suggested next IaC milestones

1. Add `infra/render/render.yaml` with all three services.
2. Add `infra/railway/README.md` with service templates.
3. Add `infra/docker/docker-compose.prod.yml` for integration testing.
