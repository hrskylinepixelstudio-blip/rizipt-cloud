import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createBillSchema, updateBillSchema, updateBillStatusSchema } from './bills.schema.js';
import * as billsService from '../services/bills.service.js';
import { ok, paginated } from '../utils/response.js';

const bills = new Hono();
bills.use('*', requireAuth);

bills.get('/', async (c) => {
  const companyId = c.get('companyId');
  const docType = c.req.query('docType') || undefined;
  const page = parseInt(c.req.query('page') || '1', 10);
  const pageSize = parseInt(c.req.query('pageSize') || '20', 10);

  const { items, total } = await billsService.listBills(c.env.DB, companyId, { docType, page, pageSize });
  return paginated(c, items, { page, pageSize, total });
});

bills.get('/:id', async (c) => {
  const companyId = c.get('companyId');
  const bill = await billsService.getBillById(c.env.DB, companyId, c.req.param('id'));
  return ok(c, bill);
});

bills.post('/', async (c) => {
  const companyId = c.get('companyId');
  const userId = c.get('userId');
  const body = createBillSchema.parse(await c.req.json());

  const bill = await billsService.createBill(c.env.DB, { companyId, userId }, body);
  return ok(c, bill, 201);
});

bills.put('/:id', async (c) => {
  const companyId = c.get('companyId');
  const userId = c.get('userId');
  const body = updateBillSchema.parse(await c.req.json());

  const bill = await billsService.updateBill(c.env.DB, { companyId, userId }, c.req.param('id'), body);
  return ok(c, bill);
});

bills.patch('/:id/status', async (c) => {
  const companyId = c.get('companyId');
  const userId = c.get('userId');
  const { status } = updateBillStatusSchema.parse(await c.req.json());

  const bill = await billsService.updateBillStatus(c.env.DB, companyId, c.req.param('id'), status, userId);
  return ok(c, bill);
});

bills.delete('/:id', async (c) => {
  const companyId = c.get('companyId');
  await billsService.deleteBill(c.env.DB, companyId, c.req.param('id'));
  return ok(c, { message: 'Document deleted' });
});

export default bills;
