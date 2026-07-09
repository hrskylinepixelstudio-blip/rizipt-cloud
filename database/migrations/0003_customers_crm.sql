-- Migration 0003: Customers, Suppliers, CRM (Leads, Follow-ups, Tasks)

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  state TEXT,
  state_code TEXT,
  opening_balance REAL DEFAULT 0,
  credit_limit REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_phone ON customers(phone);

CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  address TEXT,
  state TEXT,
  state_code TEXT,
  opening_balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX idx_suppliers_company ON suppliers(company_id);

-- Ledger entries for customer/supplier running balance (debit/credit)
CREATE TABLE ledger_entries (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  party_type TEXT NOT NULL,      -- customer, supplier
  party_id TEXT NOT NULL,
  entry_type TEXT NOT NULL,      -- debit, credit
  amount REAL NOT NULL,
  balance_after REAL,
  reference_type TEXT,           -- bill, payment_voucher, receipt_voucher, credit_note, debit_note
  reference_id TEXT,
  notes TEXT,
  entry_date TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT
);
CREATE INDEX idx_ledger_party ON ledger_entries(party_type, party_id);
CREATE INDEX idx_ledger_company ON ledger_entries(company_id);

CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT,                   -- website, referral, walk-in, ad, whatsapp
  status TEXT DEFAULT 'new',     -- new, contacted, qualified, converted, lost
  assigned_to TEXT REFERENCES users(id),
  estimated_value REAL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);

CREATE TABLE lead_notes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  note TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT
);
CREATE INDEX idx_lead_notes_lead ON lead_notes(lead_id);

CREATE TABLE follow_ups (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  lead_id TEXT REFERENCES leads(id),
  customer_id TEXT REFERENCES customers(id),
  scheduled_at TEXT NOT NULL,
  type TEXT DEFAULT 'call',      -- call, email, whatsapp, meeting
  status TEXT DEFAULT 'pending', -- pending, completed, missed
  notes TEXT,
  assigned_to TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT
);
CREATE INDEX idx_followups_company ON follow_ups(company_id);
CREATE INDEX idx_followups_scheduled ON follow_ups(scheduled_at);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  priority TEXT DEFAULT 'medium', -- low, medium, high
  status TEXT DEFAULT 'pending',  -- pending, in_progress, completed
  assigned_to TEXT REFERENCES users(id),
  related_type TEXT,              -- lead, customer
  related_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT
);
CREATE INDEX idx_tasks_company ON tasks(company_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);

CREATE TABLE call_logs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  lead_id TEXT REFERENCES leads(id),
  customer_id TEXT REFERENCES customers(id),
  direction TEXT DEFAULT 'outbound', -- outbound, inbound
  duration_seconds INTEGER,
  outcome TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT
);
CREATE INDEX idx_call_logs_company ON call_logs(company_id);
