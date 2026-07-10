import { z } from 'zod';

export const DOC_TYPES = [
  'quotation',
  'tax_invoice',
  'proforma_invoice',
  'delivery_challan',
  'contract',
];

const billItemSchema = z.object({
  itemName: z.string().min(1, 'Item description is required'),
  hsnCode: z.string().optional(),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100).default(0),
});

export const createBillSchema = z.object({
  docType: z.enum(DOC_TYPES),
  customerId: z.string().optional(),
  billDate: z.string().min(1, 'Bill date is required'),
  dueDate: z.string().optional(),
  placeOfSupply: z.string().optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  // Contracts are stored as free-form text in termsAndConditions and typically
  // carry a single symbolic "line item" (e.g. the contract value), but reuse
  // the same items[] structure for a unified schema and print template.
  items: z.array(billItemSchema).min(1, 'At least one line item is required'),
});

export const updateBillStatusSchema = z.object({
  status: z.enum(['draft', 'confirmed', 'paid', 'partially_paid', 'overdue', 'cancelled', 'void']),
});
