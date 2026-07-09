export function ok(c, data, status = 200) {
  return c.json({ success: true, data }, status);
}

export function fail(c, message, status = 400, details = undefined) {
  return c.json({ success: false, error: message, ...(details ? { details } : {}) }, status);
}

export function paginated(c, items, { page, pageSize, total }) {
  return c.json({
    success: true,
    data: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
