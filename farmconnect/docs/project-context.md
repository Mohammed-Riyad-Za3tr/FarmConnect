# FarmConnect Project Context

Updated: April 24, 2026

## Purpose

This document preserves project context for future sessions. It explains:

- what FarmConnect is
- what has already been built
- what state the prototype is currently in
- what was fixed recently
- what is still missing
- what should happen next

It is intended to be readable by any future contributor without needing to rediscover the whole repository.

## Project Identity

### Project title

FarmConnect

### Project theme

An intelligent agricultural commerce platform that connects agricultural producers directly with buyers, while progressively adding analytics, AI-assisted decision support, and operational tools.

### Core problem

Small and medium agricultural producers often face:

- limited market access
- dependency on intermediaries
- weak digital tools for stock, pricing, and direct sales
- poor visibility into demand, delivery, and buyer trust

FarmConnect addresses this by providing a digital platform for direct market access, transaction management, producer verification, and future intelligent assistance.

### Primary user roles

- Producer
- Buyer
- Administrator

## Product Vision

FarmConnect aims to become more than a simple product listing website. The intended direction is:

- direct producer-to-buyer commerce
- verified and trusted producer participation
- order, payment, and delivery workflows
- analytics for producers and administrators
- AI-based support for pricing, forecasting, and assistance
- eventual expansion to mobile usage and IoT-supported farm intelligence

## Current Technical Architecture

The repository is a monorepo with three main application layers.

### 1. Web application

- React 19
- Vite
- Tailwind CSS
- TypeScript

Main role:

- public marketplace
- user dashboards
- admin interface
- multilingual UI with English and Arabic support

### 2. API backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL

Main role:

- authentication and authorization
- products
- cart
- orders
- payments
- profiles and verification
- analytics
- notifications
- admin operations

### 3. AI service

- Python
- FastAPI

Main role:

- AI-oriented endpoints for price recommendation
- demand forecasting
- chatbot-style assistance

Current note:

The AI service exists structurally, but its current logic is still early-stage and heuristic-oriented rather than a mature ML pipeline.

## Main Functional Areas Already Implemented

The current repository already includes a substantial amount of product work.

### Authentication and user management

- registration and login
- role-aware access control
- authenticated dashboards

### Producer and buyer profiles

- producer onboarding
- producer profile management
- buyer profile management
- producer verification request flow
- admin verification review flow

### Marketplace and products

- public product listing
- product details page
- product filtering, sorting, and pagination
- producer product creation and editing
- product image management
- producer product inventory/status handling

### Cart, checkout, and orders

- cart management
- checkout page
- order creation
- buyer and producer order pages
- order detail views
- delivery timeline and tracking placeholder

### Payments

- payment service structure
- Stripe provider integration path
- BaridiMob-oriented payment provider path
- webhook routing and payment orchestration structure

### Admin

- admin dashboard
- user administration
- product moderation pages
- order administration
- verification review pages
- audit-related pages

### Analytics and notifications

- producer analytics pages
- buyer dashboard area
- notification center and notification panel

### AI-facing product surface

- producer AI insights page
- AI widgets and chatbot panel
- backend AI module and separate AI microservice

### Localization and UX

- English and Arabic locale files
- RTL support
- theme support
- route guards and layout segmentation

## Current State Assessment

FarmConnect is currently best described as:

> a strong multi-module prototype with real marketplace flows, admin operations, and an AI-ready architecture, but not yet a production-complete AgriTech platform

### What is already credible

- the marketplace structure is real, not just mocked
- role management is implemented
- admin workflows exist
- producer verification exists
- product and order flows exist
- there is clear separation between web, API, and AI services
- the bilingual/localized approach is a meaningful strategic advantage

### What is still incomplete

- mobile app delivery
- production-grade logistics
- mature payment operations
- advanced trust/reputation systems
- strong traceability
- model-driven AI
- IoT integration
- deep farm operations tooling

## Important Recent Fixes

These recent changes are important context because they affect visible platform behavior.

### 1. Product visibility and producer publishing flow

A product visibility issue was fixed so the product flow now behaves more clearly for producers.

Recent improvements included:

- fixing archived-query parsing behavior in the API
- improving product form behavior around producer verification status
- making status guidance clearer when a producer is not yet approved
- improving the empty state on the main product screen so producers understand why public products may not appear

Practical outcome:

- approved producers can publish products more clearly
- unverified producers receive better guidance
- the marketplace no longer fails silently with an unhelpful "no products" experience

### 2. Admin producer verification view

An admin-side issue was fixed where verified producer accounts could be missing from the verification review page if no historical verification-request record existed.

Recent improvements included:

- changing the backend listing logic to use producer profile verification state plus latest request data when available
- updating the admin review page to display that data correctly
- making the admin page default more useful for seeing existing verified records

Practical outcome:

- approved producer accounts are now visible in the admin verification area
- the page better reflects current verification state rather than only request history

## Current Maturity by Domain

### Strong prototype maturity

- authentication and RBAC
- producer and buyer profile flows
- producer verification workflow
- product listing and product CRUD
- cart and order fundamentals
- admin views
- localization

### Partial or transitional maturity

- payments
- analytics depth
- notifications depth
- delivery tracking
- AI productization

### Early or mostly missing maturity

- mobile app
- IoT features
- enterprise traceability
- machine learning lifecycle
- operational observability
- advanced trust and reputation

## Known Risks and Constraints

### Product risks

- buyers still need more trust signals before large-scale marketplace adoption
- producers need more utility beyond listing and selling
- logistics remains too shallow for real-world scaling

### Technical risks

- AI features may be perceived as weaker if they remain heuristic while positioned as predictive intelligence
- payment integrations require more production hardening
- end-to-end test coverage is still not broad enough for high-confidence releases

### Strategic risks

- the scope can become too broad if commerce, AI, IoT, logistics, analytics, and mobile are all expanded at once
- FarmConnect needs phased execution or it may become a wide prototype without one excellent core strength

## Recommended Product Positioning

The best current positioning is:

> FarmConnect is a localized agricultural commerce platform for verified producers and buyers, with a roadmap toward intelligent pricing, forecasting, logistics support, and farm management assistance.

This positioning matches the actual state of the codebase much better than claiming a fully mature AI-and-IoT platform today.

## What Still Needs To Be Built

High-priority missing capabilities:

- richer producer public profiles
- trust badges, ratings, and reviews
- stronger buyer discovery and recommendation flows
- more complete delivery execution flows
- stronger refund, reconciliation, and dispute handling
- weather and market intelligence integration
- real historical-data-based AI
- traceability and batch metadata
- mobile experience
- deployment and observability hardening

## Where We Are Now

As of April 24, 2026:

- the repository contains a substantial web platform, API, and AI-service structure
- major core modules are already implemented
- recent product visibility and admin verification issues have been fixed
- the project is beyond the idea stage and beyond a simple UI prototype
- the project is not yet ready to claim full startup-grade market readiness

The best summary is:

> FarmConnect has a strong foundation and a coherent architecture. The next challenge is not "starting the project," but turning the existing prototype into a reliable, differentiated, field-relevant product.

## Recommended Next Focus

The next major focus should be:

1. stabilize and harden the marketplace core
2. improve trust and producer visibility
3. strengthen payment and delivery workflows
4. connect AI to real historical and operational data
5. expand toward mobile and farm-intelligence features

## Related Internal Documents

- [Architecture](./architecture.md)
- [Architecture Decisions](./architecture-decisions.md)
- [Deployment Baselines](./deployment-baselines.md)
- [Migration and Deploy Runbook](./migration-deploy-runbook.md)
- [Project Report](./FarmConnect_Project_Report.md)
- [Competitive Analysis](./competitive-analysis.md)
- [Improvement Roadmap](./project-improvement-roadmap.md)
