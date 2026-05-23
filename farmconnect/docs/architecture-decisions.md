# Architecture Decision Summary

## ADR-001: Monorepo with pnpm + Turborepo
- Decision: Keep all services and shared packages in one workspace.
- Why: Faster cross-package refactors, shared contracts, and unified CI.
- Tradeoff: CI complexity is higher than per-repo setups.

## ADR-002: API-first backend with shared contracts
- Decision: Express API owns core business flows; `@farmconnect/shared` provides common enums/types.
- Why: Reduce frontend-backend drift and improve compile-time safety.
- Tradeoff: Shared package versioning and build order must be maintained.

## ADR-003: Separate AI microservice
- Decision: Keep AI workloads in FastAPI service instead of embedding into API.
- Why: Independent scaling/runtime/dependency lifecycle.
- Tradeoff: Service-to-service reliability and observability requirements increase.

## ADR-004: PostgreSQL + Prisma
- Decision: Use PostgreSQL as source of truth with Prisma migrations.
- Why: Strong transactional consistency and robust migration tooling.
- Tradeoff: Requires migration discipline and production runbook rigor.

## ADR-005: JWT access + refresh cookie auth model
- Decision: Short-lived access token and rotating refresh token.
- Why: Better session security and revocation handling.
- Tradeoff: More auth flow complexity in frontend and middleware.

## ADR-006: Idempotency on critical write endpoints
- Decision: Apply idempotency keys to checkout and payment intent endpoints.
- Why: Prevent duplicate financial/order side effects under retries.
- Tradeoff: In-memory idempotency cache is node-local; multi-instance environments need shared store for strict global guarantees.

## ADR-007: Correlation-first observability
- Decision: Enforce request IDs in middleware and include `requestId` in error responses.
- Why: Faster traceability in support and incident response.
- Tradeoff: Requires all consumers and logs to preserve the header consistently.

## ADR-008: Hook-based CD baseline
- Decision: CI validates artifacts, CD workflows trigger provider deploy hooks.
- Why: Practical and provider-agnostic baseline for Render/Railway/AWS adapters.
- Tradeoff: Hook endpoint governance and secret management are critical.

## ADR-009: Containerized production baseline
- Decision: Maintain Dockerfiles for API/web/AI with non-root runtime.
- Why: Reproducible deploy artifacts across platforms.
- Tradeoff: Additional maintenance for dependency and image hardening.
