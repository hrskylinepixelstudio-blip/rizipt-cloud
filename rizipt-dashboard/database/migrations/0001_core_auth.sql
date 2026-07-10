-- Migration 0001: Core Auth, Companies, Roles, Users
-- Rizipt Cloud

-- ============================================================
-- COMPANIES (Tenants)
-- ============================================================
CREATE TABLE companies (
  id TEXT PRIMARY KEY,                 -- UUID
  name TEXT NOT NULL,
  legal_name TEXT,
  logo_url TEXT,
  gstin TEXT,
  pan TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,                     -- GST state code, e.g. "33" for Tamil Nadu
  pincode TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  upi_id TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  quotation_prefix TEXT DEFAULT 'QT',
  purchase_prefix TEXT DEFAULT 'PO',
  financial_year_start_month INTEGER DEFAULT 4, -- April
  currency TEXT DEFAULT 'INR',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  subscription_plan TEXT DEFAULT 'trial', -- trial, starter, pro, enterprise
  subscription_status TEXT DEFAULT 'active', -- active, suspended, cancelled
  trial_ends_at TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX idx_companies_gstin ON companies(gstin);
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- ============================================================
-- COMPANY BANK ACCOUNTS
-- ============================================================
CREATE TABLE company_bank_accounts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  account_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT,
  branch TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX idx_bank_accounts_company ON company_bank_accounts(company_id);

-- ============================================================
-- ROLES (system-defined + extensible per company)
-- ============================================================
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id), -- NULL = system/global role template
  name TEXT NOT NULL,               -- super_admin, company_admin, manager, cashier, accountant, sales_executive, store_keeper
  display_name TEXT NOT NULL,
  is_system_role INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX idx_roles_company ON roles(company_id);

-- ============================================================
-- PERMISSIONS
-- ============================================================
CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,        -- e.g. "products.create", "bills.void"
  module TEXT NOT NULL,             -- e.g. "products", "bills"
  description TEXT
);

CREATE TABLE role_permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id),
  permission_id TEXT NOT NULL REFERENCES permissions(id),
  UNIQUE(role_id, permission_id)
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id), -- NULL for super_admin (platform-level)
  role_id TEXT NOT NULL REFERENCES roles(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  is_active INTEGER DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(company_id, email)
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);

-- ============================================================
-- REFRESH TOKENS (for JWT refresh flow)
-- ============================================================
CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  user_agent TEXT,
  ip_address TEXT
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,             -- e.g. "product.create", "bill.void"
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes_json TEXT,                -- JSON diff of before/after
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- SEED: system roles
-- ============================================================
INSERT INTO roles (id, company_id, name, display_name, is_system_role) VALUES
  ('role_super_admin', NULL, 'super_admin', 'Super Admin', 1),
  ('role_company_admin', NULL, 'company_admin', 'Company Admin', 1),
  ('role_manager', NULL, 'manager', 'Manager', 1),
  ('role_cashier', NULL, 'cashier', 'Cashier', 1),
  ('role_accountant', NULL, 'accountant', 'Accountant', 1),
  ('role_sales_executive', NULL, 'sales_executive', 'Sales Executive', 1),
  ('role_store_keeper', NULL, 'store_keeper', 'Store Keeper', 1);
