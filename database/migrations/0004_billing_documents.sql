-- Migration 0004: Billing Documents, Payments, Expenses, Employees, Notifications

-- ============================================================
-- BILLS / INVOICES (also covers POS sales)
-- doc_type distinguishes: tax_invoice, quotation, proforma_invoice,
--                          purchase_order, delivery_challan, pos_sale
-- ============================================================
CREATE TABLE bills (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  doc_type TEXT NOT NULL,           -- tax_invoice, quotation, proforma_invoice, delivery_challan, pos_sale
  bill_number TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id),
  warehouse_id TEXT REFERENCES warehouses(id),
  bill_date TEXT NOT NULL,
  due_date TEXT,
  status TEXT DEFAULT 'draft',      -- draft, confirmed, paid, partially_paid, overdue, cancelled, void
  place_of_supply TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  balance_amount REAL DEFAULT 0,
  payment_mode TEXT,                -- cash, upi, card, split, credit
  notes TEXT,
  terms_and_conditions TEXT,
  converted_from_id TEXT REFERENCES bills(id), -- e.g. invoice converted from quotation
  is_offline_sync INTEGER DEFAULT 0,           -- flagged true if created offline then synced
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(company_id, doc_type, bill_number)
);
CREATE INDEX idx_bills_company ON bills(company_id);
CREATE INDEX idx_bills_customer ON bills(customer_id);
CREATE INDEX idx_bills_type_status ON bills(doc_type, status);
CREATE INDEX idx_bills_date ON bills(bill_date);

CREATE TABLE bill_items (
  id TEXT PRIMARY KEY,
  bill_id TEXT NOT NULL REFERENCES bills(id),
  product_id TEXT REFERENCES products(id),
  batch_id TEXT REFERENCES product_batches(id),
  item_name TEXT NOT NULL,        -- snapshot at time of billing
  hsn_code TEXT,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  cgst_rate REAL DEFAULT 0,
  sgst_rate REAL DEFAULT 0,
  igst_rate REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  line_total REAL NOT NULL,
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX idx_bill_items_bill ON bill_items(bill_id);
CREATE INDEX idx_bill_items_product ON bill_items(product_id);

-- ============================================================
-- PURCHASE ORDERS (separate from sales bills, supplier-facing)
-- ============================================================
CREATE TABLE purchase_orders (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  po_number TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  warehouse_id TEXT REFERENCES warehouses(id),
  order_date TEXT NOT NULL,
  expected_date TEXT,
  status TEXT DEFAULT 'draft',   -- draft, ordered, partially_received, received, cancelled
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(company_id, po_number)
);
CREATE INDEX idx_po_company ON purchase_orders(company_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);

CREATE TABLE purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity REAL NOT NULL,
  received_quantity REAL DEFAULT 0,
  unit_price REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  line_total REAL NOT NULL
);
CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);

-- ============================================================
-- CREDIT NOTES / DEBIT NOTES
-- ============================================================
CREATE TABLE credit_debit_notes (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  note_type TEXT NOT NULL,        -- credit_note, debit_note
  note_number TEXT NOT NULL,
  party_type TEXT NOT NULL,       -- customer, supplier
  party_id TEXT NOT NULL,
  reference_bill_id TEXT REFERENCES bills(id),
  note_date TEXT NOT NULL,
  reason TEXT,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'issued',   -- issued, cancelled
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(company_id, note_type, note_number)
);
CREATE INDEX idx_cdn_company ON credit_debit_notes(company_id);

-- ============================================================
-- PAYMENT / RECEIPT VOUCHERS
-- ============================================================
CREATE TABLE payment_vouchers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  voucher_type TEXT NOT NULL,     -- receipt (money in), payment (money out)
  voucher_number TEXT NOT NULL,
  party_type TEXT NOT NULL,       -- customer, supplier, expense
  party_id TEXT,
  amount REAL NOT NULL,
  payment_mode TEXT NOT NULL,     -- cash, upi, card, bank_transfer, cheque
  reference_bill_id TEXT REFERENCES bills(id),
  reference_number TEXT,          -- cheque no / UTR etc.
  voucher_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(company_id, voucher_type, voucher_number)
);
CREATE INDEX idx_vouchers_company ON payment_vouchers(company_id);
CREATE INDEX idx_vouchers_party ON payment_vouchers(party_type, party_id);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE expense_categories (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  category_id TEXT REFERENCES expense_categories(id),
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_mode TEXT,
  expense_date TEXT NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX idx_expenses_company ON expenses(company_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- ============================================================
-- EMPLOYEES, ATTENDANCE, PAYROLL (basic)
-- ============================================================
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  user_id TEXT REFERENCES users(id),
  employee_code TEXT,
  full_name TEXT NOT NULL,
  designation TEXT,
  department TEXT,
  phone TEXT,
  email TEXT,
  date_of_joining TEXT,
  salary_amount REAL,
  salary_type TEXT DEFAULT 'monthly', -- monthly, daily, hourly
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX idx_employees_company ON employees(company_id);

CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  attendance_date TEXT NOT NULL,
  status TEXT NOT NULL,          -- present, absent, half_day, leave, holiday
  check_in TEXT,
  check_out TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT,
  UNIQUE(employee_id, attendance_date)
);
CREATE INDEX idx_attendance_company ON attendance(company_id);
CREATE INDEX idx_attendance_employee ON attendance(employee_id);

CREATE TABLE payroll_runs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  employee_id TEXT NOT NULL REFERENCES employees(id),
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  gross_amount REAL NOT NULL,
  deductions REAL DEFAULT 0,
  net_amount REAL NOT NULL,
  status TEXT DEFAULT 'draft',   -- draft, paid
  paid_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT,
  UNIQUE(employee_id, period_month, period_year)
);
CREATE INDEX idx_payroll_company ON payroll_runs(company_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  user_id TEXT REFERENCES users(id), -- NULL = broadcast to whole company
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',      -- info, warning, success, error
  link TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_notifications_company ON notifications(company_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ============================================================
-- SETTINGS (per-company key/value: printer, tax defaults, etc.)
-- ============================================================
CREATE TABLE company_settings (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  setting_key TEXT NOT NULL,     -- e.g. "printer.thermal_width", "theme.mode"
  setting_value TEXT,            -- JSON-encoded value
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(company_id, setting_key)
);
CREATE INDEX idx_settings_company ON company_settings(company_id);
