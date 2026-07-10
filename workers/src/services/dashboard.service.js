// "Revenue-recognized" statuses: an invoice counts as a sale once it's been
// confirmed/issued, regardless of whether it's been paid yet. Draft, cancelled,
// and void documents never count toward sales.
const REVENUE_STATUSES = ['confirmed', 'partially_paid', 'paid', 'overdue'];
const REVENUE_PLACEHOLDERS = REVENUE_STATUSES.map(() => '?').join(',');

export async function getDashboardSummary(db, companyId) {
  const [salesToday, salesThisMonth, todaysCollection, pendingPayments, outstandingCustomers, recentBills, revenueByMonth] =
    await Promise.all([
      sumSales(db, companyId, `bill_date = date('now')`),
      sumSales(db, companyId, `strftime('%Y-%m', bill_date) = strftime('%Y-%m', 'now')`),
      sumCollectionToday(db, companyId),
      sumPending(db, companyId),
      countOutstandingCustomers(db, companyId),
      getRecentBills(db, companyId),
      getRevenueByMonth(db, companyId),
    ]);

  return {
    salesToday,
    salesThisMonth,
    todaysCollection,
    pendingPayments,
    outstandingCustomers,
    // Low Stock Items and Top Selling Products require the Products/Inventory
    // module (Milestone 7 / 10) - surfaced as null so the UI can show "—"
    // instead of a misleading zero.
    lowStockItems: null,
    monthlyProfit: null,
    topSellingProducts: null,
    recentBills,
    revenueByMonth,
  };
}

async function sumSales(db, companyId, dateCondition) {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(total_amount), 0) as total
       FROM bills
       WHERE company_id = ? AND doc_type = 'tax_invoice' AND deleted_at IS NULL
         AND status IN (${REVENUE_PLACEHOLDERS}) AND ${dateCondition}`
    )
    .bind(companyId, ...REVENUE_STATUSES)
    .first();
  return row?.total || 0;
}

async function sumCollectionToday(db, companyId) {
  // Approximation: bills that were marked 'paid' today (based on updated_at).
  // A precise figure requires the Payment/Receipt Vouchers module (Milestone 12).
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(total_amount), 0) as total
       FROM bills
       WHERE company_id = ? AND doc_type = 'tax_invoice' AND deleted_at IS NULL
         AND status = 'paid' AND date(updated_at) = date('now')`
    )
    .bind(companyId)
    .first();
  return row?.total || 0;
}

async function sumPending(db, companyId) {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(balance_amount), 0) as total
       FROM bills
       WHERE company_id = ? AND doc_type = 'tax_invoice' AND deleted_at IS NULL
         AND status IN ('confirmed', 'partially_paid', 'overdue')`
    )
    .bind(companyId)
    .first();
  return row?.total || 0;
}

async function countOutstandingCustomers(db, companyId) {
  const row = await db
    .prepare(
      `SELECT COUNT(DISTINCT customer_id) as count
       FROM bills
       WHERE company_id = ? AND doc_type = 'tax_invoice' AND deleted_at IS NULL
         AND status IN ('confirmed', 'partially_paid', 'overdue') AND balance_amount > 0`
    )
    .bind(companyId)
    .first();
  return row?.count || 0;
}

async function getRecentBills(db, companyId) {
  const { results } = await db
    .prepare(
      `SELECT b.id, b.doc_type, b.bill_number, b.bill_date, b.total_amount, b.status, c.name as customer_name
       FROM bills b
       LEFT JOIN customers c ON c.id = b.customer_id
       WHERE b.company_id = ? AND b.deleted_at IS NULL
       ORDER BY b.created_at DESC
       LIMIT 5`
    )
    .bind(companyId)
    .all();
  return results;
}

async function getRevenueByMonth(db, companyId) {
  const { results } = await db
    .prepare(
      `SELECT strftime('%Y-%m', bill_date) as month, COALESCE(SUM(total_amount), 0) as total
       FROM bills
       WHERE company_id = ? AND doc_type = 'tax_invoice' AND deleted_at IS NULL
         AND status IN (${REVENUE_PLACEHOLDERS})
         AND bill_date >= date('now', '-5 months', 'start of month')
       GROUP BY month
       ORDER BY month ASC`
    )
    .bind(companyId, ...REVENUE_STATUSES)
    .all();
  return results;
}
