import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';

import authRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/company.routes.js';
import customerRoutes from './routes/customers.routes.js';
import billRoutes from './routes/bills.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { rateLimiter } from './middleware/rateLimit.middleware.js';

const app = new Hono();

// ---------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------
app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: (origin) => origin, // reflect origin; tighten in production via ALLOWED_ORIGINS env var
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use('/api/auth/*', rateLimiter({ windowSeconds: 60, maxRequests: 20 }));

// ---------------------------------------------------------------
// Health check
// ---------------------------------------------------------------
app.get('/', (c) => c.json({ status: 'ok', app: c.env.APP_NAME, env: c.env.ENVIRONMENT }));
app.get('/api/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ---------------------------------------------------------------
// Routes (each mounted module owns its own auth/RBAC guards)
// ---------------------------------------------------------------
app.route('/api/auth', authRoutes);
app.route('/api/company', companyRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/bills', billRoutes);
app.route('/api/uploads', uploadRoutes);
app.route('/api/dashboard', dashboardRoutes);

// More modules (products, suppliers, inventory, reports, settings, users)
// are added incrementally per the project's milestone roadmap - see docs/ROADMAP.md

// ---------------------------------------------------------------
// 404 + error handling
// ---------------------------------------------------------------
app.notFound((c) => c.json({ success: false, error: 'Route not found' }, 404));
app.onError(errorHandler);

export default app;
