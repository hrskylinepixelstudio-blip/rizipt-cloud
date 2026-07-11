import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  addLeadNoteSchema,
} from './leads.schema.js';
import { ok, fail } from '../utils/response.js';
import { id } from '../utils/id.js';

const leads = new Hono();
leads.use('*', requireAuth);

leads.get('/', async (c) => {
  const companyId = c.get('companyId');
  const status = c.req.query('status');

  let query = `SELECT l.*, u.full_name AS assigned_to_name
               FROM leads l
               LEFT JOIN users u ON u.id = l.assigned_to
               WHERE l.company_id = ? AND l.deleted_at IS NULL`;
  const params = [companyId];

  if (status) {
    query += ` AND l.status = ?`;
    params.push(status);
  }
  query += ` ORDER BY l.created_at DESC`;

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return ok(c, results);
});

leads.get('/:id', async (c) => {
  const companyId = c.get('companyId');
  const leadId = c.req.param('id');

  const lead = await c.env.DB.prepare(
    `SELECT l.*, u.full_name AS assigned_to_name
     FROM leads l
     LEFT JOIN users u ON u.id = l.assigned_to
     WHERE l.id = ? AND l.company_id = ? AND l.deleted_at IS NULL`
  )
    .bind(leadId, companyId)
    .first();

  if (!lead) return fail(c, 'Lead not found', 404);

  const { results: notes } = await c.env.DB.prepare(
    `SELECT ln.*, u.full_name AS created_by_name FROM lead_notes ln
     LEFT JOIN users u ON u.id = ln.created_by
     WHERE ln.lead_id = ? ORDER BY ln.created_at DESC`
  )
    .bind(leadId)
    .all();

  const { results: followUps } = await c.env.DB.prepare(
    `SELECT * FROM follow_ups WHERE lead_id = ? AND deleted_at IS NULL ORDER BY scheduled_at ASC`
  )
    .bind(leadId)
    .all();

  const { results: tasks } = await c.env.DB.prepare(
    `SELECT * FROM tasks WHERE related_type = 'lead' AND related_id = ? AND deleted_at IS NULL ORDER BY due_date ASC`
  )
    .bind(leadId)
    .all();

  return ok(c, { ...lead, notes, followUps, tasks });
});

leads.post('/', async (c) => {
  const companyId = c.get('companyId');
  const userId = c.get('userId');
  const body = createLeadSchema.parse(await c.req.json());
  const leadId = id('lead');

  await c.env.DB.prepare(
    `INSERT INTO leads (id, company_id, name, phone, email, source, estimated_value, notes, assigned_to, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      leadId,
      companyId,
      body.name,
      body.phone || null,
      body.email || null,
      body.source || null,
      body.estimatedValue ?? null,
      body.notes || null,
      body.assignedTo || null,
      userId
    )
    .run();

  const created = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first();
  return ok(c, created, 201);
});

leads.put('/:id', async (c) => {
  const companyId = c.get('companyId');
  const leadId = c.req.param('id');
  const body = updateLeadSchema.parse(await c.req.json());

  const fieldMap = {
    name: 'name',
    phone: 'phone',
    email: 'email',
    source: 'source',
    estimatedValue: 'estimated_value',
    notes: 'notes',
    assignedTo: 'assigned_to',
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
  values.push(c.get('userId'), leadId, companyId);

  const result = await c.env.DB.prepare(
    `UPDATE leads SET ${setClauses.join(', ')} WHERE id = ? AND company_id = ?`
  )
    .bind(...values)
    .run();

  if (result.meta.changes === 0) return fail(c, 'Lead not found', 404);

  const updated = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first();
  return ok(c, updated);
});

leads.patch('/:id/status', async (c) => {
  const companyId = c.get('companyId');
  const leadId = c.req.param('id');
  const { status } = updateLeadStatusSchema.parse(await c.req.json());

  const result = await c.env.DB.prepare(
    `UPDATE leads SET status = ?, updated_at = datetime('now'), updated_by = ? WHERE id = ? AND company_id = ?`
  )
    .bind(status, c.get('userId'), leadId, companyId)
    .run();

  if (result.meta.changes === 0) return fail(c, 'Lead not found', 404);

  const updated = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first();
  return ok(c, updated);
});

leads.post('/:id/notes', async (c) => {
  const companyId = c.get('companyId');
  const userId = c.get('userId');
  const leadId = c.req.param('id');
  const { note } = addLeadNoteSchema.parse(await c.req.json());

  const lead = await c.env.DB.prepare('SELECT id FROM leads WHERE id = ? AND company_id = ?')
    .bind(leadId, companyId)
    .first();
  if (!lead) return fail(c, 'Lead not found', 404);

  const noteId = id('note');
  await c.env.DB.prepare(`INSERT INTO lead_notes (id, lead_id, note, created_by) VALUES (?, ?, ?, ?)`)
    .bind(noteId, leadId, note, userId)
    .run();

  const created = await c.env.DB.prepare('SELECT * FROM lead_notes WHERE id = ?').bind(noteId).first();
  return ok(c, created, 201);
});

leads.post('/:id/convert', async (c) => {
  const companyId = c.get('companyId');
  const userId = c.get('userId');
  const leadId = c.req.param('id');

  const lead = await c.env.DB.prepare(
    `SELECT * FROM leads WHERE id = ? AND company_id = ? AND deleted_at IS NULL`
  )
    .bind(leadId, companyId)
    .first();

  if (!lead) return fail(c, 'Lead not found', 404);
  if (lead.status === 'converted') return fail(c, 'Lead has already been converted', 422);

  const customerId = id('cust');

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO customers (id, company_id, name, phone, email, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(customerId, companyId, lead.name, lead.phone, lead.email, userId),
    c.env.DB.prepare(
      `UPDATE leads SET status = 'converted', updated_at = datetime('now'), updated_by = ? WHERE id = ?`
    ).bind(userId, leadId),
  ]);

  const customer = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(customerId).first();
  return ok(c, { customer, message: 'Lead converted to customer' }, 201);
});

leads.delete('/:id', async (c) => {
  const companyId = c.get('companyId');
  const leadId = c.req.param('id');

  const result = await c.env.DB.prepare(
    `UPDATE leads SET deleted_at = datetime('now') WHERE id = ? AND company_id = ? AND deleted_at IS NULL`
  )
    .bind(leadId, companyId)
    .run();

  if (result.meta.changes === 0) return fail(c, 'Lead not found', 404);
  return ok(c, { message: 'Lead deleted' });
});

export default leads;
