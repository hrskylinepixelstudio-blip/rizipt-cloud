import { FileText, Receipt, FileSignature, Truck, ScrollText } from 'lucide-react';

export const DOC_TYPES = [
  { value: 'quotation', label: 'Quotation', icon: FileText, prefix: 'QT' },
  { value: 'tax_invoice', label: 'Tax Invoice', icon: Receipt, prefix: 'INV' },
  { value: 'proforma_invoice', label: 'Proforma Invoice', icon: FileSignature, prefix: 'PI' },
  { value: 'delivery_challan', label: 'Delivery Challan', icon: Truck, prefix: 'DC' },
  { value: 'contract', label: 'Contract', icon: ScrollText, prefix: 'CON' },
];

export function docTypeLabel(value) {
  return DOC_TYPES.find((d) => d.value === value)?.label || value;
}
