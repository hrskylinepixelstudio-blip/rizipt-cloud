import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createCustomerSchema, updateCustomerSchema } from './customers.schema.js';
import { ok, fail } from '../utils/response.js';
import { id } from '../utils/id.js';

const customers = new Hono();
customers.use('*', requireAuth);

customers.get('/', async (c) => {
  const companyId = c.get('companyId');
  const search = c.req.query('search');

  let query = `SELECT * FROM customers WHERE company_id = ? AND deleted_at IS NULL`;
  const params = [companyId];

  if (search) {
    query += ` AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY name ASC LIMIT 200`;

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return ok(c, results);
});

customers.get('/:id', async (c) => {
  const companyId = c.get('companyId');
  const customerId = c.req.param('id');

  const customer = await c.env.DB.prepare(
    `SELECT * FROM customers WHERE id = ? AND company_id = ? AND deleted_at IS NULL`
  )
    .bind(customerId, companyId)
    .first();

  if (!customer) return fail(c, 'Customer not found', 404);
  return ok(c, customer);
});

customers.post('/', async (c) => {
  const companyId = c.get('companyId');
  const userId = c.get('userId');
  const body = createCustomerSchema.parse(await c.req.json());
  const customerId = id('cust');

  await c.env.DB.prepare(
    `INSERT INTO customers (id, company_id, name, phone, email, gstin, billing_address, shipping_address, state, state_code, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      customerId,
      companyId,
      body.name,
      body.phone || null,
      body.email || null,
      body.gstin || null,
      body.billingAddress || null,
      body.shippingAddress || null,
      body.state || null,
      body.stateCode || null,
      userId
    )
    .run();

  const created = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(customerId).first();
  return ok(c, created, 201);
});

customers.put('/:id', async (c) => {
  const companyId = c.get('companyId');
  const customerId = c.req.param('id');
  const body = updateCustomerSchema.parse(await c.req.json());

  const fieldMap = {
    name: 'name',
    phone: 'phone',
    email: 'email',
    gstin: 'gstin',
    billingAddress: 'billing_address',
    shippingAddress: 'shipping_address',
    state: 'state',
    stateCode: 'state_code',
  };

  const setClauses = [];
  const values = [];
  for (const [key, column] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) {
      setClauses.push(`${column} = ?`);
      values.push(body[key]);
    }
  }

  if (setClauses.length === 0) return fail(c, 'No fields provided to update', 422);

  setClauses.push(`updated_at = datetime('now')`, `updated_by = ?`);
  values.push(c.get('userId'), customerId, companyId);

  const result = await c.env.DB.prepare(
    `UPDATE customers SET ${setClauses.join(', ')} WHERE id = ? AND company_id = ?`
  )
    .bind(...values)
    .run();

  if (result.meta.changes === 0) return fail(c, 'Customer not found', 404);

  const updated = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(customerId).first();
  return ok(c, updated);
});

customers.delete('/:id', async (c) => {
  const companyId = c.get('companyId');
  const customerId = c.req.param('id');

  const result = await c.env.DB.prepare(
    `UPDATE customers SET deleted_at = datetime('now') WHERE id = ? AND company_id = ? AND deleted_at IS NULL`
  )
    .bind(customerId, companyId)
    .run();

  if (result.meta.changes === 0) return fail(c, 'Customer not found', 404);
  return ok(c, { message: 'Customer deleted' });
});

export default customers;
