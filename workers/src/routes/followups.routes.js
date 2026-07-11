import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createFollowUpSchema, updateFollowUpStatusSchema } from './followups.schema.js';
import { ok, fail } from '../utils/response.js';
import { id } from '../utils/id.js';

const followUps = new Hono();
followUps.use('*', requireAuth);

followUps.get('/', async (c) => {
  const companyId = c.get('companyId');
  const status = c.req.query('status');
  const upcoming = c.req.query('upcoming');

  let query = `SELECT f.*, l.name AS lead_name, cu.name AS customer_name, u.full_name AS assigned_to_name
               FROM follow_ups f
               LEFT JOIN leads l ON l.id = f.lead_id
               LEFT JOIN customers cu ON cu.id = f.customer_id
               LEFT JOIN users u ON u.id = f.assigned_to
               WHERE f.company_id = ? AND f.deleted_at IS NULL`;
  const params = [companyId];

  if (status) {
    query += ` AND f.status = ?`;
    params.push(status);
  }
  if (upcoming === 'true') {
    query += ` AND f.status = 'pending' AND f.scheduled_at >= datetime('now')`;
  }

  query += ` ORDER BY f.scheduled_at ASC`;

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return ok(c, results);
});

followUps.post('/', async (c) => {
  const companyId = c.get('companyId');
  const userId = c.get('userId');
  const body = createFollowUpSchema.parse(await c.req.json());
  const followUpId = id('fu');

  await c.env.DB.prepare(
    `INSERT INTO follow_ups (id, company_id, lead_id, customer_id, scheduled_at, type, notes, assigned_to, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      followUpId,
      companyId,
      body.leadId || null,
      body.customerId || null,
      body.scheduledAt,
      body.type,
      body.notes || null,
      body.assignedTo || null,
      userId
    )
    .run();

  const created = await c.env.DB.prepare('SELECT * FROM follow_ups WHERE id = ?').bind(followUpId).first();
  return ok(c, created, 201);
});

followUps.patch('/:id/status', async (c) => {
  const companyId = c.get('companyId');
  const followUpId = c.req.param('id');
  const { status } = updateFollowUpStatusSchema.parse(await c.req.json());

  const result = await c.env.DB.prepare(
    `UPDATE follow_ups SET status = ?, updated_at = datetime('now') WHERE id = ? AND company_id = ?`
  )
    .bind(status, followUpId, companyId)
    .run();

  if (result.meta.changes === 0) return fail(c, 'Follow-up not found', 404);

  const updated = await c.env.DB.prepare('SELECT * FROM follow_ups WHERE id = ?').bind(followUpId).first();
  return ok(c, updated);
});

followUps.delete('/:id', async (c) => {
  const companyId = c.get('companyId');
  const followUpId = c.req.param('id');

  const result = await c.env.DB.prepare(
    `UPDATE follow_ups SET deleted_at = datetime('now') WHERE id = ? AND company_id = ? AND deleted_at IS NULL`
  )
    .bind(followUpId, companyId)
    .run();

  if (result.meta.changes === 0) return fail(c, 'Follow-up not found', 404);
  return ok(c, { message: 'Follow-up deleted' });
});

export default followUps;
