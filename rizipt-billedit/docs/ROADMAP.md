# Rizipt Cloud — Build Roadmap

Each milestone ships as complete, compiling, production-quality code — never partial snippets. This file is the single source of truth for what's done and what's next.

| # | Milestone | Status | Notes |
|---|-----------|--------|-------|
| 1 | Folder structure | ✅ Done | `app/`, `workers/`, `database/`, `packages/`, `docs/`, `scripts/` |
| 2 | Foundation (tooling, configs) | ✅ Done | Vite + Tailwind + PWA config, Hono + wrangler.jsonc, monorepo `package.json` workspaces |
| 3 | Authentication | ✅ Done | JWT access+refresh (rotation, revocation), PBKDF2 hashing, RBAC middleware, rate limiting, register/login/refresh/logout/me, Login & Register pages |
| 4 | Database | ✅ Done | 4 migration files: core auth, products/inventory, customers/CRM, billing documents — normalized, indexed, soft-delete + audit columns, seeded system roles |
| 5 | Backend foundation | ✅ Done | Hono app entry, error handler, response envelope helpers, company profile routes |
| 6 | Dashboard (shell) | ✅ Done | Static metric cards + layout; wires to real data after Reports (#14) |
| 6.5 | Company Profile + Document Generator | ✅ Done *(built out of order, on request)* | Logo upload to R2, full company profile form (GSTIN/PAN/address/UPI/invoice prefix); unified document engine for Quotation, Tax Invoice, Proforma Invoice, Delivery Challan, and Contract — line items, live CGST/SGST/IGST calculation (auto intra vs inter-state), auto bill numbering, printable A4 view with company logo header, status workflow (draft→confirmed→paid...) |
| 7 | Products (Categories, Brands, Units) | ⬜ Next | Full CRUD API + Zod validation + React pages (list/create/edit), barcode/HSN fields. Needed before line items can be picked from a catalog instead of typed freehand. |
| 8 | Customers (full module) | ⬜ Planned | Minimal CRUD already shipped as part of 6.5 (needed for documents); this milestone adds the full ledger view + outstanding balance + customer detail page |
| 9 | Suppliers | ⬜ Planned | CRUD + ledger view |
| 10 | Inventory | ⬜ Planned | Stock in/out, batches, expiry alerts, low-stock alerts, warehouse transfers, valuation report |
| 11 | POS | ⬜ Planned | Barcode/QR scan, keyboard shortcuts, split payments, thermal + A4 print, offline billing (IndexedDB outbox + PWA background sync) |
| 12 | Billing (GST) | ⬜ Planned | Tax Invoice, Quotation, Proforma, Purchase Order, Delivery Challan, Credit/Debit Notes, Receipt/Payment Vouchers, PDF generation |
| 13 | Reports | ⬜ Planned | Sales, Purchase, Stock, Inventory Valuation, GST (GSTR-1/3B ready), Expenses, P&L, Customer/Supplier Ledger, Day Book, Cash Book, Outstanding |
| 14 | CRM | ✅ Done | Leads pipeline (kanban board by status: new→contacted→qualified→converted→lost), lead notes timeline, follow-ups (call/email/whatsapp/meeting) with overdue/upcoming/completed grouping, assign-to-user, one-click convert lead→customer |
| 15 | Settings | ⬜ Planned | Theme, Company, Printer, Taxes, Users & Roles/Permissions UI, Backup/Restore, Email/SMS/WhatsApp integration config |
| 16 | Production deployment | ⬜ Planned | GitHub Actions CI/CD → Cloudflare Pages (frontend) + Workers (API), environment secrets, custom domain (rizipt.in) |

## Working agreement

- Each milestone is delivered as complete, runnable code — `npm run build:app` and the Workers syntax/type checks must pass before moving on.
- Every new module follows the same shape: **UI → Validation (Zod) → API route → Service (DB logic) → Migration (if new tables) → Error handling → Loading state → Toast notification → README update**.
- `company_id` scoping and RBAC guards are mandatory on every new business-table endpoint.
- This file gets updated at the end of every milestone.
