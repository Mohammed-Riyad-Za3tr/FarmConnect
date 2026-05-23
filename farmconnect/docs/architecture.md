# FarmConnect — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                                                                 │
│   Browser (React SPA)          Mobile (future)                  │
│   apps/web — Vite + React 19                                    │
│   + Tailwind · React Router · Zustand · TanStack Query          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / REST
┌───────────────────────────▼─────────────────────────────────────┐
│                         API LAYER                               │
│                                                                 │
│   apps/api — Express.js + TypeScript                            │
│   + Prisma ORM · PostgreSQL · JWT Auth                          │
│   + Zod validation · Helmet · CORS · Rate limiting              │
│                                                                 │
│   Modules:                                                      │
│   auth · users · profiles · producer-verification               │
│   products · cart · orders · payments · payouts                 │
│   delivery · notifications · analytics · audit-logs             │
└────────────┬───────────────────────────┬────────────────────────┘
             │ Prisma                    │ HTTP (internal)
┌────────────▼───────────┐  ┌───────────▼────────────────────────┐
│   PostgreSQL Database  │  │      apps/ai-service               │
│   (local dev /         │  │      FastAPI + Python               │
│    managed cloud prod) │  │      Price recs · Forecasting       │
└────────────────────────┘  │      Chatbot support               │
                            └────────────────────────────────────┘
```

## Layer Responsibilities

| Layer | File | Responsibility |
|---|---|---|
| Controller | `*.controller.ts` | HTTP only: parse request, call service, send response |
| Service | `*.service.ts` | Business logic, orchestration, transactions |
| Repository | `*.repository.ts` | Prisma/DB access only |
| Policy | `policies/*.ts` | Ownership and authorization rules |
| Middleware | `middleware/*.ts` | Request lifecycle: auth, validation, rate limit, logging |

## Auth Flow

- **Access token**: short-lived JWT (15 min), stored in memory
- **Refresh token**: long-lived (30 days), HTTP-only cookie, rotated on use
- **RBAC**: role checked in `requireRole` middleware; ownership in policy layer

## Shared Packages

| Package | Purpose |
|---|---|
| `@farmconnect/shared` | Enums, types, Zod schemas, constants shared across apps |
| `@farmconnect/config` | ESLint, Prettier, TypeScript configs |
| `@farmconnect/ui` | Reusable React component primitives |

## Directory Layout

See `README.md` at the root for the full file structure.

## Implementation Phases

1. Monorepo foundation and app bootstrap ← **current**
2. Prisma schema and database foundation
3. Auth and RBAC
4. Profiles and producer verification
5. Products and public catalog
6. Cart, checkout, and orders
7. Payments and Stripe webhook flow
8. Notifications and delivery tracking
9. Analytics and admin
10. AI integration
11. Full i18n, RTL, and UX polish
12. Testing, hardening, and deployment readiness
