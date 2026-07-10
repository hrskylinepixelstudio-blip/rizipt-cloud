import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { ok, fail } from '../utils/response.js';

const company = new Hono();

const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  legalName: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  stateCode: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
  upiId: z.string().optional(),
  invoicePrefix: z.string().optional(),
});

company.use('*', requireAuth);

company.get('/profile', async (c) => {
  const companyId = c.get('companyId');
  const profile = await c.env.DB.prepare(
    `SELECT * FROM companies WHERE id = ? AND deleted_at IS NULL`
  )
    .bind(companyId)
    .first();

  if (!profile) return fail(c, 'Company not found', 404);
  return ok(c, profile);
});

company.put('/profile', requireRole('company_admin', 'super_admin'), async (c) => {
  const companyId = c.get('companyId');
  const body = updateCompanySchema.parse(await c.req.json());

  // Build a dynamic SET clause only for fields the client actually sent
  const fieldMap = {
    name: 'name',
    legalName: 'legal_name',
    gstin: 'gstin',
    pan: 'pan',
    addressLine1: 'address_line1',
    addressLine2: 'address_line2',
    city: 'city',
    state: 'state',
    stateCode: 'state_code',
    pincode: 'pincode',
    phone: 'phone',
    email: 'email',
    website: 'website',
    upiId: 'upi_id',
    invoicePrefix: 'invoice_prefix',
  };

  const setClauses = [];
  const values = [];
  for (const [key, column] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) {
      setClauses.push(`${column} = ?`);
      values.push(body[key]);
    }
  }

  if (setClauses.length === 0) {
    return fail(c, 'No fields provided to update', 422);
  }

  setClauses.push(`updated_at = datetime('now')`, `updated_by = ?`);
  values.push(c.get('userId'), companyId);

  await c.env.DB.prepare(`UPDATE companies SET ${setClauses.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(companyId).first();
  return ok(c, updated);
});

company.get('/bank-accounts', async (c) => {
  const companyId = c.get('companyId');
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM company_bank_accounts WHERE company_id = ? AND deleted_at IS NULL ORDER BY is_default DESC`
  )
    .bind(companyId)
    .all();
  return ok(c, results);
});

export default company;
