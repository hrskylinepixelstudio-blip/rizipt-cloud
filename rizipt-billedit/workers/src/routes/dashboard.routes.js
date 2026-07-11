import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getDashboardSummary } from '../services/dashboard.service.js';
import { ok } from '../utils/response.js';

const dashboard = new Hono();
dashboard.use('*', requireAuth);

dashboard.get('/summary', async (c) => {
  const companyId = c.get('companyId');
  const summary = await getDashboardSummary(c.env.DB, companyId);
  return ok(c, summary);
});

export default dashboard;
