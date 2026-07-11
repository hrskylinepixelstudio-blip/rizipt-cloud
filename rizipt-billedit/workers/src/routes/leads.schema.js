import { z } from 'zod';

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

export const createLeadSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  source: z.string().optional(),
  estimatedValue: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const updateLeadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
});

export const addLeadNoteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty'),
});
