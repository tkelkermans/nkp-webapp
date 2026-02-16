# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time polling application ("Nutanix RealTime Poll") deployed on Nutanix Kubernetes Platform (NKP) with GitOps via Flux CD. Users create polls, vote in real-time via WebSockets, and view live results with charts.

## Commands

### Backend (from `backend/`)
```bash
npm run dev              # Hot-reload dev server (tsx watch)
npm run build            # Compile TypeScript → dist/
npm test                 # Run Jest tests
npm run test:watch       # Jest watch mode
npm run test:coverage    # Jest with coverage (60% threshold)
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
```

### Frontend (from `frontend/`)
```bash
npm run dev              # Next.js dev server
npm run build            # Production build
npm test                 # Run Vitest tests
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Vitest with coverage
npm run lint             # Next.js lint (includes type checking)
```

### Full Stack (from root)
```bash
docker compose -f docker-compose.dev.yml up    # Dev with hot-reload (nginx proxy on :80)
docker compose up                               # Production mode (nginx proxy on :80)
```

### Running a Single Test
```bash
# Backend (Jest)
cd backend && npx jest src/routes/polls.test.ts

# Frontend (Vitest)
cd frontend && npx vitest run src/components/LoadingSpinner.test.tsx
```

## Architecture

### Monorepo Layout
- **`backend/`** — Express 4 + Socket.io + Redis (TypeScript, Node 22+)
- **`frontend/`** — Next.js 15 App Router + React 19 + TanStack Query (TypeScript, Node 22+)
- **`k8s/`** — Kustomize manifests with base/overlays structure (dev + prod)
- **`k8s/flux-system/`** — Flux CD GitOps configuration

### Backend Data Flow
Express API → Redis (ioredis). Polls stored as Redis hashes with TTL-based expiry:
- `poll:{id}` — poll metadata
- `poll:votes:{id}` — vote counts per option
- `poll:voters:{id}` — voter deduplication set (SHA256 of IP + User-Agent)
- `polls:active` — sorted set tracking active polls

Real-time updates flow through Socket.io rooms (one room per poll). When a vote is cast via REST, the backend emits `vote-update` to all clients in that poll's room.

### Frontend Data Flow
React Query manages server state (polls list, individual polls). Socket.io hook (`useSocket`) listens for `vote-update` and `poll-closed` events and syncs them into the React Query cache. The API client (`src/lib/api.ts`) uses relative URLs in-browser (routed through nginx/Ingress) and `INTERNAL_API_URL` for SSR.

Path alias: `@/*` maps to `./src/*`.

### Network Architecture (Kubernetes)
```
Internet → Traefik Ingress (kommander-traefik)
  /api, /socket.io → backend-service:3001
  /                 → frontend-service:3000
Backend → Redis (internal headless service)
```
Network policies enforce zero-trust: only frontend→backend and backend→redis are allowed.

### CI/CD Pipeline
GitHub Actions (`build-images.yaml`) with self-hosted runners:
- Push to `main` → builds changed services, pushes to Harbor registry, updates dev overlay image tags
- Tag `v*.*.*` → builds all, updates prod overlay image tags
- Flux CD watches git, auto-reconciles cluster state

### Key Middleware Stack (Backend)
Helmet (security headers) → CORS → rate limiting (100 req/60s/IP) → body parser (10kb limit) → routes → centralized error handler (`AppError` class with `asyncHandler` wrapper).

### Observability
- `/api/health/live` and `/api/health/ready` — Kubernetes probes
- `/metrics` — Prometheus metrics (prom-client): request counts, latency histograms, active WebSocket connections, active polls
- ServiceMonitor label: `prometheus.kommander.d2iq.io/select: "true"`
- Structured JSON logging via Pino (pretty-print in dev)

## Testing

- **Backend**: Jest + ts-jest + supertest. Tests colocated with source (`*.test.ts`). Coverage threshold: 60%.
- **Frontend**: Vitest + @testing-library/react + jsdom. Setup file at `src/test/setup.tsx` mocks `next/navigation`, `next/link`, and `socket.io-client`.

## Deployment

- **Registry**: Harbor at `tke-nkpmgmt.ntnxlab.ch:5000`
- **Kustomize overlays**: `k8s/overlays/dev/` (1 replica, inline secrets) and `k8s/overlays/prod/` (2+ replicas, External Secrets Operator)
- **Containers**: Multi-stage Alpine builds, non-root users (uid 1001), read-only filesystems
- **Flux bootstrap**: `flux bootstrap github --owner=tkelkermans --repository=nkp-webapp --branch=main --path=k8s/flux-system`

## Validation & Input

All backend input validated with Zod schemas (`src/utils/validation.ts`). Custom `AppError` class for typed HTTP errors. Route handlers wrapped with `asyncHandler` to forward errors to centralized middleware.

## Styling

TailwindCSS with custom Nutanix-branded colors defined in `frontend/tailwind.config.ts`:
- Primary: Iris Purple (`#7855fa`), Charcoal (`#131313`)
- Secondary: Cyan (`#1fdde9`), Lime (`#92dd23`), Coral (`#ff9178`)
