# Deployment Guide — Rizipt Cloud

## Prerequisites

- A Cloudflare account with Workers, Pages, D1, R2, and KV enabled
- Node.js 18+
- A GitHub repository for this project

## One-time Cloudflare setup

```bash
cd workers
npx wrangler login

# Create the D1 database
npx wrangler d1 create rizipt_cloud_db
# → copy the returned "database_id" into workers/wrangler.jsonc (both the top-level
#   d1_databases entry and the env.production.d1_databases entry)

# Create the KV namespace used for sessions/rate-limiting
npx wrangler kv namespace create SESSIONS
# → copy the returned "id" into workers/wrangler.jsonc (both entries)

# Create the R2 bucket for logos, product images, receipts, PDFs
npx wrangler r2 bucket create rizipt-cloud-storage

# Create the Pages project for the frontend
npx wrangler pages project create rizipt-cloud
```

## Secrets

Set these once per environment (they're never committed):

```bash
cd workers
npx wrangler secret put JWT_ACCESS_SECRET
npx wrangler secret put JWT_REFRESH_SECRET
npx wrangler secret put JWT_ACCESS_SECRET --env production
npx wrangler secret put JWT_REFRESH_SECRET --env production
```

Generate strong secrets with:

```bash
openssl rand -base64 48
```

## Database migrations

```bash
npm run db:migrate:remote   # applies all files in database/migrations/ in order
```

Wrangler tracks which migrations have already run, so this is safe to re-run on every deploy — new migration files are picked up automatically. New migrations should always be added as a new numbered file (e.g. `0005_...sql`), never edited retroactively.

## GitHub Actions (automatic deploys)

The workflow at `.github/workflows/deploy.yml` deploys on every push to `main`. Add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create Token (use the "Edit Cloudflare Workers" template, and add Pages + D1 permissions) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar of any domain overview page |
| `VITE_API_BASE_URL` | e.g. `https://api.rizipt.in/api` |

## Custom domain (rizipt.in)

1. Add `rizipt.in` as a Cloudflare zone (if not already).
2. **Pages** → rizipt-cloud project → Custom domains → add `rizipt.in` and/or `app.rizipt.in`.
3. **Workers** → rizipt-cloud-api → Triggers → Custom domains → add `api.rizipt.in`.
4. Update `app/.env.example` / the `VITE_API_BASE_URL` GitHub secret to point at `https://api.rizipt.in/api`.

## Manual deploy (without GitHub Actions)

```bash
npm run build:app
npx wrangler pages deploy app/dist --project-name=rizipt-cloud

cd workers
npx wrangler deploy --env production
```

## Rollback

```bash
npx wrangler deployments list                # Workers
npx wrangler rollback [deployment-id]         # Workers

npx wrangler pages deployment list --project-name=rizipt-cloud   # Pages
```
