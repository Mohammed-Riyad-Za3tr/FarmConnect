# FarmConnect Project Development Report

Generated on: 2026-05-04
Repository root: `farmconnect/`

## 1. Executive Summary
FarmConnect is a monorepo AgriTech marketplace platform that connects producers and buyers, with role-based workflows for buyers, producers, and admins. The implementation uses a web SPA (`apps/web`), a REST API (`apps/api`), and a separate AI microservice (`apps/ai-service`), with shared TypeScript contracts in workspace packages.

Primary capabilities implemented so far include:
- Authentication with access/refresh token flow.
- Role-aware dashboards and protected routes.
- Product catalog publication, listing, filtering, location-aware sorting, and favorites.
- Cart, orders, payment integration hooks, and payout entities.
- Reviews/ratings, reports/moderation inputs, notifications, analytics, and admin controls.
- Delivery tracking entities and APIs.
- AI recommendation/forecast/chatbot integration endpoints.
- Internationalization (Arabic/RTL and multilingual resources) and theme support.

## 2. Monorepo Technology Stack
- Workspace tooling: pnpm workspaces + Turborepo.
- Web: React 19, Vite, Tailwind, React Router, TanStack Query, Zustand.
- API: Express + TypeScript, Prisma ORM, PostgreSQL.
- AI Service: FastAPI + Python 3.12.
- Shared contracts: `@farmconnect/shared` types, enums, schemas.

## 3. Exact Folder Structure

### 3.1 Full snapshot
The exact raw full tree snapshot was generated directly from the filesystem with:

`tree /F /A farmconnect > farmconnect/docs/_full-tree.txt`

This preserves the literal folder/file structure at report time, including generated/cache folders.

Reference file:
- `docs/_full-tree.txt`

### 3.2 Functional structure (human-oriented)
- `apps/`
  - `api/`: Main backend service (REST, auth, business logic, Prisma).
  - `web/`: Frontend SPA for all roles.
  - `ai-service/`: AI microservice for forecasting/recommendations/chatbot.
- `packages/`
  - `shared/`: Shared enums/types/Zod schemas/constants used by API+Web.
  - `ui/`: Reusable UI primitives/components.
  - `config/`: Shared ESLint/Prettier/TS base configs.
- `docs/`: Architecture, deployment runbooks, this report, and structure snapshots.
- `infra/`: Deployment/infrastructure assets (if present in current branch).
- `scripts/`: Utility/dev automation scripts.
- `.github/workflows/`: CI/CD workflows for API/Web/AI/db-migrate.

## 4. Key File and Folder Purpose Map

### 4.1 Root-level files
- `package.json`: Workspace scripts and top-level dependencies.
- `pnpm-workspace.yaml`: Workspace package discovery.
- `turbo.json`: Turborepo pipeline config.
- `.env.example`: Baseline environment variables.
- `README.md`: Setup, run, quality gates, deployment pointers.

### 4.2 API app (`apps/api`)
- `src/app.ts`: Express app setup, middleware, CORS, versioned routing.
- `src/config/routes.ts`: Main API module routing table.
- `src/modules/*`: Domain modules using controller/service/repository/policy layers.
- `prisma/schema.prisma`: Full relational schema and enums.
- `src/middleware/*`: auth, rate limit, logging, locale, error/404 handling.

Registered API domains (from `src/config/routes.ts`):
- `health`, `auth`, `profile`, `products`, `cart`, `orders`, `payments`, `notifications`, `delivery`, `analytics`, `admin`, `ai`, `reviews`, `favorites`, `coupons`, `reports`.

### 4.3 Web app (`apps/web`)
- `src/app/router/index.tsx`: Browser router composition.
- `src/app/router/routes/*`: Public/dashboard/admin route definitions and guards.
- `src/features/*`: Feature-first modules (auth, products, cart, orders, reports, admin, etc.).
- `src/locales/*`: Translation resources.
- `src/app/providers/*`: Auth/query/theme/i18n/notifications providers.

### 4.4 AI service (`apps/ai-service`)
- FastAPI endpoints for AI-assisted marketplace capabilities:
  - Recommendations.
  - Demand/price forecasting.
  - Chatbot support flow.

### 4.5 Shared packages
- `packages/shared`: Cross-app contract source of truth (role enums, DTO types, schemas).
- `packages/ui`: Shared React UI layer.
- `packages/config`: Shared code style/tooling setup.

## 5. Implemented System Functionalities

### 5.1 Authentication and authorization
- JWT access token + rotating refresh token model.
- Refresh token persistence and session lifecycle controls.
- Role-based access enforcement (buyer/producer/admin).
- Protected routes in frontend and guarded API endpoints.

### 5.2 User and profile management
- Buyer and producer profile entities.
- Producer verification workflow.
- Address and geo fields to support location-aware flows.
- User status lifecycle (active/suspended/banned-related statuses in schema).

### 5.3 Product catalog and discovery
- Producer product CRUD and status management.
- Category hierarchy.
- Product images and logs/history.
- Public marketplace listing.
- Filters: query text, category, wilaya, min/max price, tags, availability, offers, favorite producers.
- Sorting: newest, price asc/desc, rating desc, distance asc.
- Optional geolocation-assisted nearest sorting.

### 5.4 Favorites and social trust
- Favorite products capability.
- Favorite producers capability.
- Buyer reviews/ratings model (for product and producer order context).

### 5.5 Cart, orders, and checkout
- Cart and cart-item management.
- Order creation and itemization.
- Coupon model support.
- Payment workflow modules and event tracking.
- Payout model for producer settlements.

### 5.6 Notifications, reports, moderation, admin
- In-app notification model/channel abstraction.
- Report submission and lifecycle (target/reason/status).
- Admin module for moderation and operational controls.
- Audit logging model and actions.

### 5.7 Delivery and logistics support
- Delivery status and method enums.
- Delivery tracking entity linked to orders.

### 5.8 Analytics and AI
- Daily analytics snapshot model.
- AI recommendation and forecast persistence.
- Dedicated AI service integration route/module.

### 5.9 UX and platform quality
- i18n with RTL support for Arabic UX.
- Theme support infrastructure.
- Security middleware: helmet, CORS strategy, rate limiting, request-id tracing.
- CI/CD workflows for build/test/deploy and DB migration jobs.

## 6. Database Schema (Prisma) Summary
Source: `apps/api/prisma/schema.prisma`

### 6.1 Core identity and account entities
- `User`: central identity, role, status, and core account fields.
- `RefreshToken`: long-lived session token storage/rotation.
- `ProducerProfile`, `BuyerProfile`: role-specific profile extensions.
- `ProducerVerificationRequest`: compliance/verification pipeline.
- `Address`: user-linked location records.

### 6.2 Commerce entities
- `Category`: hierarchical product taxonomy.
- `Product`: producer listings with pricing/stock/geo/status.
- `ProductImage`: product media attachments.
- `ProductLog`: lifecycle/activity log per product.
- `Cart`, `CartItem`: pre-order basket model.
- `Order`, `OrderItem`: final transaction structure.
- `Coupon`: discount rules/codes.

### 6.3 Trust and engagement entities
- `Review`: rating/review records tied to buyer/order/product/producer context.
- `FavoriteProduct`, `FavoriteProducer`: user preference links.
- `Report`: abuse/reporting system with typed targets and statuses.

### 6.4 Payments and settlement entities
- `Payment`: payment intent/charge representation.
- `PaymentEvent`: append-only payment event timeline.
- `Payout`: producer payout settlement tracking.

### 6.5 Operations entities
- `DeliveryTracking`: delivery progress updates.
- `Notification`: user notification records.
- `AnalyticsDaily`: daily aggregated KPIs.
- `AuditLog`: actor/action audit history.

### 6.6 AI data entities
- `AiRecommendation`: persisted recommendation outputs.
- `AiForecast`: stored forecast results.

### 6.7 Schema enums (selected groups)
- Identity/access: `Role`, `UserStatus`, `VerificationStatus`.
- Commerce lifecycle: `ProductStatus`, `OrderStatus`, `ProductUnit`, `ProductLogType`.
- Financial lifecycle: `PaymentStatus`, `PaymentMethod`, `PaymentEventType`, `PayoutStatus`, `CouponType`.
- Delivery/notifications: `DeliveryStatus`, `DeliveryMethod`, `NotificationType`, `NotificationChannel`.
- Governance: `AuditAction`, `ReportTargetType`, `ReportReason`, `ReportStatus`.

## 7. API and Web Routing Evidence
- API route mountpoint list is defined in `apps/api/src/config/routes.ts`.
- App-level middleware and router registration are defined in `apps/api/src/app.ts`.
- Web route composition is in `apps/web/src/app/router/index.tsx`, backed by route modules in `apps/web/src/app/router/routes/`.

## 8. Architecture and Decisions Already Documented
- `docs/architecture.md`: layer responsibilities, auth model, phased roadmap.
- `docs/architecture-decisions.md`: ADRs for monorepo, shared contracts, AI microservice split, Prisma/PostgreSQL, idempotency, observability, and deployment baseline.

## 9. CI/CD and Operational Readiness
- CI workflow: `.github/workflows/ci.yml`.
- Service deployment workflows: `api-cd.yml`, `web-cd.yml`, `ai-cd.yml`.
- DB migration workflow: `db-migrate.yml`.
- Deployment/runbook docs: `docs/deployment-baselines.md`, `docs/migration-deploy-runbook.md`.

## 10. Current Implementation Notes
- The codebase includes both application source and local runtime/generated artifacts (`node_modules`, `.turbo`, `.runlogs`), which are reflected in the full tree snapshot.
- This report is generated from repository files present in the current working copy and does not infer undocumented external infrastructure.

## 11. Recommended Appendices
- Appendix A: Full exact tree (`docs/_full-tree.txt`).
- Appendix B: Complete Prisma schema source (`apps/api/prisma/schema.prisma`).
- Appendix C: Complete API source file index (`apps/api/src/**`).
- Appendix D: Complete Web source file index (`apps/web/src/**`).

## 12. Conclusion
FarmConnect currently provides a substantial end-to-end marketplace foundation with role-based flows, catalog/discovery, ordering/payment entities, moderation/admin modules, and AI integration scaffolding. The architecture is modular, documented, and aligned with production-oriented practices (security middleware, CI/CD, migration workflow, auditability), making it suitable for continued hardening and feature completion.
