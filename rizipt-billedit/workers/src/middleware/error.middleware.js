import { ZodError } from 'zod';

export function errorHandler(err, c) {
  console.error('[Rizipt Cloud API Error]', err);

  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: 'Validation failed',
        details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
      },
      422
    );
  }

  if (err.status) {
    return c.json({ success: false, error: err.message }, err.status);
  }

  return c.json({ success: false, error: 'Internal server error' }, 500);
}
