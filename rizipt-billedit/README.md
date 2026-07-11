# Rizipt Cloud

**ERP + POS + GST Billing + CRM** for Indian MSMEs — built on Cloudflare (Workers, D1, R2) with a React 18 + Vite frontend.

> Domain: [rizipt.in](https://rizipt.in)

## Status: Milestone 1–3 complete (Foundation, Database, Auth)

See [`docs/ROADMAP.md`](./docs/ROADMAP.md) for the full 16-milestone build plan and what's next.

## Monorepo Structure

```
rizipt-cloud/
├── app/                  React 18 + Vite + Tailwind frontend (PWA)
│   └── src/
│       ├── components/   Reusable UI primitives (Button, TextField, ...)
│       ├── pages/        Route-level pages (Dashboard, POS, Billing, ...)
│       ├── layouts/      App shell (sidebar + topbar)
│       ├── routes/       Route guards (ProtectedRoute)
│       ├── services/     API-calling functions per module
│       ├── store/        Zustand global state (auth)
│       ├── lib/          Axios client with auto-refresh interceptor
│       └── hooks/        Shared React hooks
├── workers/               Cloudflare Workers backend (Hono)
│   └── src/
│       ├── routes/       Hono route modules, one per API resource
│       ├── services/     Business logic (DB access lives here, never in React)
│       ├── middleware/   Auth (JWT), RBAC, rate limiting, error handling
│       ├── utils/        JWT signing, password hashing (PBKDF2), ID generation
│       └── index.js      App entry — mounts all route modules
├── database/
│   └── migrations/       Numbered D1 SQL migrations (normalized schema)
├── packages/              Shared code between app/ and workers/ (future)
├── docs/                  Architecture notes, API docs, deployment guide
└── scripts/               Utility/setup scripts
```

## Tech Stack

| Layer      | Technology                                                        |
|------------|---------------------------------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Axios, Zustand, Framer Motion, Lucide |
| Backend    | Cloudflare Workers, Hono, JWT (via `jose`), Zod validation           |
| Database   | Cloudflare D1 (SQLite) — normalized schema, soft delete, audit columns |
| Storage    | Cloudflare R2 (product images, receipts, logos)                     |
| Auth       | JWT access + refresh tokens, PBKDF2 password hashing, RBAC           |
| Deployment | Cloudflare Pages (frontend) + Cloudflare Workers (API) via GitHub    |

## Architecture

```
React (app/)
   ↓ axios
Services (app/src/services)
   ↓ REST
Cloudflare Workers + Hono (workers/src/routes)
   ↓
Services layer (workers/src/services) — all DB logic lives here
   ↓
Cloudflare D1 (SQLite)
   ↓
Cloudflare R2 (file storage)
```

Database access is **never** performed directly from React. All business logic lives in `workers/src/services/*`, called from thin route handlers in `workers/src/routes/*`.

## Multi-Tenancy

Every business table carries a `company_id` foreign key. A single Rizipt Cloud deployment supports unlimited companies (tenants) and unlimited users per company. RBAC is enforced per-request via the `requireAuth` + `requireRole` middleware, which reads the `roleName` claim embedded in the JWT access token.

Roles: `super_admin`, `company_admin`, `manager`, `cashier`, `accountant`, `sales_executive`, `store_keeper`.

## Getting Started

### 1. Install dependencies

```bash
npm install                # installs both app/ and workers/ workspaces
```

### 2. Set up Cloudflare resources

```bash
cd workers
npx wrangler d1 create rizipt_cloud_db     # copy the returned database_id into wrangler.jsonc
npx wrangler kv namespace create SESSIONS   # copy the returned id into wrangler.jsonc
npx wrangler r2 bucket create rizipt-cloud-storage
```

Update `workers/wrangler.jsonc` with the real `database_id` and KV `id` values (they're placeholders right now).

### 3. Set secrets

```bash
cd workers
npx wrangler secret put JWT_ACCESS_SECRET
npx wrangler secret put JWT_REFRESH_SECRET
```

For local dev, create `workers/.dev.vars`:

```
JWT_ACCESS_SECRET=dev-only-access-secret-change-me
JWT_REFRESH_SECRET=dev-only-refresh-secret-change-me
```

### 4. Run migrations

```bash
npm run db:migrate:local     # local D1 (SQLite file, for `wrangler dev`)
npm run db:migrate:remote    # applies to the real Cloudflare D1 database
```

### 5. Run the app

```bash
npm run dev:workers    # starts the API on http://localhost:8787
npm run dev:app        # starts the frontend on http://localhost:5173
```

Set `VITE_API_BASE_URL=http://localhost:8787/api` in `app/.env.local` if you change the default port.

### 6. Build for production

```bash
npm run build:app       # outputs app/dist — deploy to Cloudflare Pages
npm run deploy:workers  # deploys the Worker via wrangler
```

## What's implemented so far

- ✅ Full monorepo structure (`app/`, `workers/`, `database/`, `docs/`)
- ✅ Complete normalized D1 schema: companies, users, roles/permissions, refresh tokens, audit logs, products, categories, brands, units, warehouses, batches, stock levels & movements, stock transfers, customers, suppliers, ledger entries, leads/follow-ups/tasks/call logs (CRM), bills + bill items (invoices/quotations/proforma/challans/POS), purchase orders, credit/debit notes, payment/receipt vouchers, expenses, employees/attendance/payroll, notifications, company settings
- ✅ JWT auth (access + refresh, rotation, revocation) using Web Crypto — no Node-only dependencies, runs natively on Workers
- ✅ PBKDF2 password hashing via Web Crypto
- ✅ RBAC middleware (`requireAuth`, `requireRole`)
- ✅ Rate limiting middleware (KV-backed)
- ✅ Company registration (self-signup creates tenant + admin user + default warehouse)
- ✅ Login / refresh / logout / `me` endpoints
- ✅ Company profile read/update endpoint
- ✅ React app shell: sidebar navigation, protected routes, auto-refreshing Axios client, Zustand auth store
- ✅ Login & Register pages wired to the real API
- ✅ Dashboard page (static shell — wires to real data once Reports module lands)
- ✅ Tailwind design tokens, dark-mode-ready, PWA manifest + service worker via `vite-plugin-pwa`
- ✅ Both `app/` and `workers/` verified to install and build cleanly

## What's next

See [`docs/ROADMAP.md`](./docs/ROADMAP.md) — next up is **Milestone 7: Products, Categories, Brands, Units** (full CRUD + validation + UI), followed by Customers, Suppliers, Inventory, POS, Billing, Reports, CRM, and Settings, each shipped as its own reviewable milestone.
