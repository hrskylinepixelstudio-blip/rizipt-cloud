import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  gstin: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  state: z.string().optional(),
  stateCode: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();
