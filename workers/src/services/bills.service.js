import { id } from '../utils/id.js';

const PREFIX_BY_DOC_TYPE = {
  quotation: 'QT',
  tax_invoice: 'INV',
  proforma_invoice: 'PI',
  delivery_challan: 'DC',
  contract: 'CON',
};

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Generates the next sequential bill number for a company + doc_type,
 * e.g. "INV-0001". Simple counter based on existing row count; adequate
 * for MSME volumes. Revisit with a dedicated counters table if/when
 * concurrent high-throughput billing across many cashiers becomes a concern.
 */
async function generateBillNumber(db, companyId, docType) {
  const company = await db
    .prepare('SELECT invoice_prefix FROM companies WHERE id = ?')
    .bind(companyId)
    .first();

  const prefix =
    docType === 'tax_invoice' && company?.invoice_prefix
      ? company.invoice_prefix
      : PREFIX_BY_DOC_TYPE[docType] || 'DOC';

  const { count } = await db
    .prepare(`SELECT COUNT(*) as count FROM bills WHERE company_id = ? AND doc_type = ?`)
    .bind(companyId, docType)
    .first();

  const nextNumber = (count || 0) + 1;
  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Computes per-line and document-level totals, splitting tax into
 * CGST+SGST (intra-state) or IGST (inter-state) based on whether the
 * place of supply matches the company's home state.
 */
function computeTotals({ items, companyStateCode, placeOfSupplyStateCode }) {
  const isIntraState =
    !!companyStateCode && !!placeOfSupplyStateCode && companyStateCode === placeOfSupplyStateCode;

  let subtotal = 0;
  let totalDiscount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const computedItems = items.map((item) => {
    const lineGross = item.quantity * item.unitPrice;
    const discountAmount = (lineGross * item.discountPercent) / 100;
    const taxableValue = lineGross - discountAmount;

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isIntraState) {
      cgstRate = item.taxRate / 2;
      sgstRate = item.taxRate / 2;
      cgstAmount = (taxableValue * cgstRate) / 100;
      sgstAmount = (taxableValue * sgstRate) / 100;
    } else {
      igstRate = item.taxRate;
      igstAmount = (taxableValue * igstRate) / 100;
    }

    const lineTotal = taxableValue + cgstAmount + sgstAmount + igstAmount;

    subtotal += lineGross;
    totalDiscount += discountAmount;
    totalCgst += cgstAmount;
    totalSgst += sgstAmount;
    totalIgst += igstAmount;

    return {
      ...item,
      discountAmount,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      lineTotal,
    };
  });

  const preRoundTotal = subtotal - totalDiscount + totalCgst + totalSgst + totalIgst;
  const roundedTotal = Math.round(preRoundTotal);
  const roundOff = Number((roundedTotal - preRoundTotal).toFixed(2));

  return {
    computedItems,
    subtotal: round2(subtotal),
    discountAmount: round2(totalDiscount),
    cgstAmount: round2(totalCgst),
    sgstAmount: round2(totalSgst),
    igstAmount: round2(totalIgst),
    roundOff,
    totalAmount: roundedTotal,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export async function createBill(db, { companyId, userId, warehouseId = null }, payload) {
  const company = await db
    .prepare('SELECT state_code FROM companies WHERE id = ?')
    .bind(companyId)
    .first();

  let placeOfSupplyStateCode = null;
  if (payload.customerId) {
    const customer = await db
      .prepare('SELECT state_code FROM customers WHERE id = ? AND company_id = ?')
      .bind(payload.customerId, companyId)
      .first();
    placeOfSupplyStateCode = customer?.state_code || null;
  }

  const totals = computeTotals({
    items: payload.items,
    companyStateCode: company?.state_code,
    placeOfSupplyStateCode,
  });

  const billId = id('bill');
  const billNumber = await generateBillNumber(db, companyId, payload.docType);

  const statements = [
    db
      .prepare(
        `INSERT INTO bills (
          id, company_id, doc_type, bill_number, customer_id, warehouse_id,
          bill_date, due_date, status, place_of_supply,
          subtotal, discount_amount, cgst_amount, sgst_amount, igst_amount, round_off, total_amount,
          balance_amount, notes, terms_and_conditions, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        billId,
        companyId,
        payload.docType,
        billNumber,
        payload.customerId || null,
        warehouseId,
        payload.billDate,
        payload.dueDate || null,
        payload.placeOfSupply || null,
        totals.subtotal,
        totals.discountAmount,
        totals.cgstAmount,
        totals.sgstAmount,
        totals.igstAmount,
        totals.roundOff,
        totals.totalAmount,
        totals.totalAmount,
        payload.notes || null,
        payload.termsAndConditions || null,
        userId
      ),
  ];

  totals.computedItems.forEach((item, index) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO bill_items (
            id, bill_id, item_name, hsn_code, quantity, unit_price,
            discount_percent, discount_amount, tax_rate,
            cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount,
            line_total, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id('itm'),
          billId,
          item.itemName,
          item.hsnCode || null,
          item.quantity,
          item.unitPrice,
          item.discountPercent,
          item.discountAmount,
          item.taxRate,
          item.cgstRate,
          item.sgstRate,
          item.igstRate,
          item.cgstAmount,
          item.sgstAmount,
          item.igstAmount,
          item.lineTotal,
          index
        )
    );
  });

  await db.batch(statements);

  return getBillById(db, companyId, billId);
}

export async function listBills(db, companyId, { docType, page = 1, pageSize = 20 } = {}) {
  const offset = (page - 1) * pageSize;
  let query = `SELECT b.*, c.name AS customer_name FROM bills b
               LEFT JOIN customers c ON c.id = b.customer_id
               WHERE b.company_id = ? AND b.deleted_at IS NULL`;
  const params = [companyId];

  if (docType) {
    query += ` AND b.doc_type = ?`;
    params.push(docType);
  }

  const countRow = await db
    .prepare(`SELECT COUNT(*) as count FROM (${query})`)
    .bind(...params)
    .first();

  query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
  params.push(pageSize, offset);

  const { results } = await db.prepare(query).bind(...params).all();

  return { items: results, total: countRow?.count || 0, page, pageSize };
}

export async function getBillById(db, companyId, billId) {
  const bill = await db
    .prepare(
      `SELECT b.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
              c.gstin AS customer_gstin, c.billing_address AS customer_billing_address
       FROM bills b
       LEFT JOIN customers c ON c.id = b.customer_id
       WHERE b.id = ? AND b.company_id = ? AND b.deleted_at IS NULL`
    )
    .bind(billId, companyId)
    .first();

  if (!bill) throw new APIError('Document not found', 404);

  const { results: items } = await db
    .prepare(`SELECT * FROM bill_items WHERE bill_id = ? ORDER BY sort_order ASC`)
    .bind(billId)
    .all();

  const company = await db.prepare('SELECT * FROM companies WHERE id = ?').bind(companyId).first();

  return { ...bill, items, company };
}

export async function updateBillStatus(db, companyId, billId, status, userId) {
  const result = await db
    .prepare(
      `UPDATE bills SET status = ?, updated_at = datetime('now'), updated_by = ?
       WHERE id = ? AND company_id = ? AND deleted_at IS NULL`
    )
    .bind(status, userId, billId, companyId)
    .run();

  if (result.meta.changes === 0) throw new APIError('Document not found', 404);
  return getBillById(db, companyId, billId);
}

export async function deleteBill(db, companyId, billId) {
  const result = await db
    .prepare(
      `UPDATE bills SET deleted_at = datetime('now') WHERE id = ? AND company_id = ? AND deleted_at IS NULL`
    )
    .bind(billId, companyId)
    .run();

  if (result.meta.changes === 0) throw new APIError('Document not found', 404);
}

export { APIError };
