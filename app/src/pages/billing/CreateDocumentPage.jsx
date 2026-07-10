import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../../components/Button.jsx';
import TextField from '../../components/TextField.jsx';
import TextArea from '../../components/TextArea.jsx';
import Select from '../../components/Select.jsx';
import CustomerPicker from '../../components/billing/CustomerPicker.jsx';
import { DOC_TYPES } from '../../lib/docTypes.js';
import { createBill } from '../../services/billsService.js';
import { toast } from '../../store/toastStore.js';

const emptyItem = () => ({ itemName: '', hsnCode: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxRate: 18 });

export default function CreateDocumentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialDocType = searchParams.get('type') || 'quotation';

  const [docType, setDocType] = useState(initialDocType);
  const [customerId, setCustomerId] = useState('');
  const [customer, setCustomer] = useState(null);
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [items, setItems] = useState([emptyItem()]);

  const isContract = docType === 'contract';

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;

    items.forEach((item) => {
      const gross = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const discountAmount = (gross * (Number(item.discountPercent) || 0)) / 100;
      const taxable = gross - discountAmount;
      const taxAmount = (taxable * (Number(item.taxRate) || 0)) / 100;
      subtotal += gross;
      discount += discountAmount;
      tax += taxAmount;
    });

    const total = Math.round(subtotal - discount + tax);
    return { subtotal, discount, tax, total };
  }, [items]);

  const createMutation = useMutation({
    mutationFn: createBill,
    onSuccess: (bill) => {
      toast.success(`${DOC_TYPES.find((d) => d.value === docType)?.label} created`);
      navigate(`/billing/${bill.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create document'),
  });

  const onSubmit = (e) => {
    e.preventDefault();

    if (!customerId) {
      toast.error('Select or add a customer / client first');
      return;
    }
    if (items.some((it) => !it.itemName)) {
      toast.error('Every line item needs a description');
      return;
    }

    createMutation.mutate({
      docType,
      customerId,
      billDate,
      dueDate: dueDate || undefined,
      placeOfSupply: customer?.state || undefined,
      notes: notes || undefined,
      termsAndConditions: termsAndConditions || undefined,
      items: items.map((it) => ({
        ...it,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discountPercent: Number(it.discountPercent) || 0,
        taxRate: isContract ? 0 : Number(it.taxRate) || 0,
      })),
    });
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-4xl flex-col gap-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold">New Document</h1>
        <p className="text-sm text-slate-500">Generate a Quotation, Invoice, Proforma, Challan, or Contract.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Document type" value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
          <TextField label="Date" type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
          {!isContract && (
            <TextField label="Due date (optional)" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          )}
        </div>

        <div className="mt-4">
          <CustomerPicker
            value={customerId}
            onChange={(id, cust) => {
              setCustomerId(id);
              setCustomer(cust);
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {isContract ? 'Contract line item(s)' : 'Line items'}
          </h2>
          <Button type="button" variant="ghost" onClick={addItem}>
            <Plus className="h-4 w-4" /> Add item
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-12 dark:border-slate-800"
            >
              <div className="sm:col-span-4">
                <TextField
                  label={index === 0 ? 'Description' : undefined}
                  placeholder="Item / service description"
                  value={item.itemName}
                  onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                />
              </div>
              {!isContract && (
                <div className="sm:col-span-2">
                  <TextField
                    label={index === 0 ? 'HSN/SAC' : undefined}
                    value={item.hsnCode}
                    onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
                  />
                </div>
              )}
              <div className="sm:col-span-1">
                <TextField
                  label={index === 0 ? 'Qty' : undefined}
                  type="number"
                  min="0"
                  step="any"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <TextField
                  label={index === 0 ? 'Unit Price (₹)' : undefined}
                  type="number"
                  min="0"
                  step="any"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                />
              </div>
              {!isContract && (
                <div className="sm:col-span-1">
                  <TextField
                    label={index === 0 ? 'GST %' : undefined}
                    type="number"
                    min="0"
                    max="100"
                    value={item.taxRate}
                    onChange={(e) => updateItem(index, 'taxRate', e.target.value)}
                  />
                </div>
              )}
              <div className="sm:col-span-1">
                <TextField
                  label={index === 0 ? 'Disc %' : undefined}
                  type="number"
                  min="0"
                  max="100"
                  value={item.discountPercent}
                  onChange={(e) => updateItem(index, 'discountPercent', e.target.value)}
                />
              </div>
              <div className="flex items-end justify-end sm:col-span-1">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="rounded-lg p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Discount</span>
              <span>−₹{totals.discount.toFixed(2)}</span>
            </div>
            {!isContract && (
              <div className="flex justify-between text-slate-500">
                <span>Tax (GST)</span>
                <span>₹{totals.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold dark:border-slate-800">
              <span>Total</span>
              <span>₹{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-4">
          {isContract && (
            <TextArea
              label="Contract terms"
              rows={8}
              placeholder="Scope of work, payment schedule, deliverables, termination clause..."
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
            />
          )}
          {!isContract && (
            <TextArea
              label="Terms & conditions (optional)"
              rows={3}
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
            />
          )}
          <TextArea label="Notes (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/billing')}>
          Cancel
        </Button>
        <Button type="submit" isLoading={createMutation.isPending}>
          Generate {DOC_TYPES.find((d) => d.value === docType)?.label}
        </Button>
      </div>
    </form>
  );
}
