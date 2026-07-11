import { z } from 'zod';

export const createFollowUpSchema = z.object({
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  scheduledAt: z.string().min(1, 'Scheduled date/time is required'),
  type: z.enum(['call', 'email', 'whatsapp', 'meeting']).default('call'),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const updateFollowUpStatusSchema = z.object({
  status: z.enum(['pending', 'completed', 'missed']),
});
