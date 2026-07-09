-- Migration 0002: Products, Categories, Brands, Units, Inventory, Warehouses

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES categories(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX idx_categories_company ON categories(company_id);

CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX idx_brands_company ON brands(company_id);

CREATE TABLE units (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,          -- e.g. "Piece", "Kilogram"
  short_code TEXT NOT NULL,    -- e.g. "PCS", "KG"
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX idx_units_company ON units(company_id);

CREATE TABLE warehouses (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  address TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX idx_warehouses_company ON warehouses(company_id);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  category_id TEXT REFERENCES categories(id),
  brand_id TEXT REFERENCES brands(id),
  unit_id TEXT REFERENCES units(id),
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  hsn_code TEXT,
  description TEXT,
  image_url TEXT,
  purchase_price REAL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  mrp REAL,
  tax_rate REAL DEFAULT 0,          -- overall GST % (e.g. 18)
  cgst_rate REAL DEFAULT 0,
  sgst_rate REAL DEFAULT 0,
  igst_rate REAL DEFAULT 0,
  cess_rate REAL DEFAULT 0,
  is_tax_inclusive INTEGER DEFAULT 0,
  track_inventory INTEGER DEFAULT 1,
  low_stock_threshold REAL DEFAULT 0,
  has_batches INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);

-- Batch-wise stock (supports expiry-tracked products)
CREATE TABLE product_batches (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  batch_number TEXT,
  expiry_date TEXT,
  purchase_price REAL,
  selling_price REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);
CREATE INDEX idx_batches_product ON product_batches(product_id);
CREATE INDEX idx_batches_expiry ON product_batches(expiry_date);

-- Current stock per warehouse (and optionally per batch)
CREATE TABLE stock_levels (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  batch_id TEXT REFERENCES product_batches(id),
  quantity REAL NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(product_id, warehouse_id, batch_id)
);
CREATE INDEX idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX idx_stock_levels_warehouse ON stock_levels(warehouse_id);

-- Append-only ledger of every stock movement (stock in / out / adjustment / transfer)
CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  batch_id TEXT REFERENCES product_batches(id),
  movement_type TEXT NOT NULL,   -- purchase, sale, sale_return, purchase_return, adjustment, transfer_in, transfer_out
  quantity REAL NOT NULL,        -- positive = in, negative = out
  reference_type TEXT,           -- e.g. "bill", "purchase_order", "stock_transfer"
  reference_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT
);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_company ON stock_movements(company_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

CREATE TABLE stock_transfers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  transfer_number TEXT NOT NULL,
  from_warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  to_warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
  status TEXT DEFAULT 'pending', -- pending, in_transit, completed, cancelled
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  created_by TEXT,
  updated_by TEXT
);
CREATE INDEX idx_stock_transfers_company ON stock_transfers(company_id);

CREATE TABLE stock_transfer_items (
  id TEXT PRIMARY KEY,
  stock_transfer_id TEXT NOT NULL REFERENCES stock_transfers(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  batch_id TEXT REFERENCES product_batches(id),
  quantity REAL NOT NULL
);
CREATE INDEX idx_transfer_items_transfer ON stock_transfer_items(stock_transfer_id);
