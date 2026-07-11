import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Printer, ArrowLeft, Loader2, Pencil } from 'lucide-react';
import Button from '../../components/Button.jsx';
import Select from '../../components/Select.jsx';
import { getBill, updateBillStatus } from '../../services/billsService.js';
import { docTypeLabel } from '../../lib/docTypes.js';
import { toast } from '../../store/toastStore.js';

export default function DocumentViewPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: bill, isLoading } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => getBill(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateBillStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['bill', id] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update status'),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!bill) return null;

  const isIntraState = Number(bill.cgst_amount) > 0 || Number(bill.sgst_amount) > 0;
  const isContract = bill.doc_type === 'contract';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-12">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/billing" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Back to documents
        </Link>
        <div className="flex items-center gap-2">
          {bill.status === 'draft' && (
            <Link to={`/billing/${bill.id}/edit`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </Link>
          )}
          <Select
            value={bill.status}
            onChange={(e) => statusMutation.mutate(e.target.value)}
            className="!py-2"
          >
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      <div id="print-area" className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm print:rounded-none print:border-0 print:shadow-none dark:border-slate-800 dark:bg-slate-900 print:dark:bg-white print:text-black">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            {bill.company?.logo_url && (
              <img src={bill.company.logo_url} alt={bill.company.name} className="h-14 w-14 object-contain" />
            )}
            <div>
              <h2 className="text-lg font-bold">{bill.company?.name}</h2>
              {bill.company?.address_line1 && (
                <p className="text-xs text-slate-500">
                  {bill.company.address_line1}
                  {bill.company.city ? `, ${bill.company.city}` : ''}
                  {bill.company.state ? `, ${bill.company.state}` : ''} {bill.company.pincode || ''}
                </p>
              )}
              <p className="text-xs text-slate-500">
                {bill.company?.phone && <>{bill.company.phone} · </>}
                {bill.company?.email}
              </p>
              {bill.company?.gstin && <p className="text-xs text-slate-500">GSTIN: {bill.company.gstin}</p>}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold uppercase tracking-wide text-brand-700">
              {docTypeLabel(bill.doc_type)}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{bill.bill_number}</p>
            <p className="text-sm text-slate-500">{bill.bill_date}</p>
          </div>
        </div>

        {/* Bill to */}
        <div className="mb-6 grid grid-cols-2 gap-4 border-y border-slate-200 py-4 text-sm dark:border-slate-800">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Bill To</p>
            <p className="font-medium">{bill.customer_name}</p>
            {bill.customer_billing_address && <p className="text-slate-500">{bill.customer_billing_address}</p>}
            {bill.customer_phone && <p className="text-slate-500">{bill.customer_phone}</p>}
            {bill.customer_gstin && <p className="text-slate-500">GSTIN: {bill.customer_gstin}</p>}
          </div>
          {bill.due_date && (
            <div className="text-right">
              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Due Date</p>
              <p className="font-medium">{bill.due_date}</p>
            </div>
          )}
        </div>

        {isContract ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {bill.terms_and_conditions}
          </div>
        ) : (
          <>
            <table className="mb-6 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left text-xs uppercase text-slate-400">
                  <th className="py-2 pr-2">Description</th>
                  <th className="py-2 pr-2">HSN</th>
                  <th className="py-2 pr-2 text-right">Qty</th>
                  <th className="py-2 pr-2 text-right">Price</th>
                  <th className="py-2 pr-2 text-right">Tax</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-2">{item.item_name}</td>
                    <td className="py-2 pr-2 text-slate-500">{item.hsn_code}</td>
                    <td className="py-2 pr-2 text-right">{item.quantity}</td>
                    <td className="py-2 pr-2 text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                    <td className="py-2 pr-2 text-right">{item.tax_rate}%</td>
                    <td className="py-2 text-right font-medium">₹{Number(item.line_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-1.5 text-sm">
                <Row label="Subtotal" value={bill.subtotal} />
                <Row label="Discount" value={-bill.discount_amount} />
                {isIntraState ? (
                  <>
                    <Row label="CGST" value={bill.cgst_amount} />
                    <Row label="SGST" value={bill.sgst_amount} />
                  </>
                ) : (
                  <Row label="IGST" value={bill.igst_amount} />
                )}
                {Number(bill.round_off) !== 0 && <Row label="Round off" value={bill.round_off} />}
                <div className="flex justify-between border-t border-slate-300 pt-1.5 text-base font-bold">
                  <span>Total</span>
                  <span>₹{Number(bill.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {bill.terms_and_conditions && !isContract && (
          <div className="mt-6 text-xs text-slate-500">
            <p className="mb-1 font-semibold uppercase">Terms & Conditions</p>
            <p className="whitespace-pre-wrap">{bill.terms_and_conditions}</p>
          </div>
        )}

        {bill.notes && (
          <div className="mt-4 text-xs text-slate-500">
            <p className="mb-1 font-semibold uppercase">Notes</p>
            <p className="whitespace-pre-wrap">{bill.notes}</p>
          </div>
        )}

        {bill.company?.upi_id && !isContract && (
          <div className="mt-6 text-xs text-slate-500">
            Pay via UPI: <span className="font-medium">{bill.company.upi_id}</span>
          </div>
        )}

        <div className="mt-10 flex justify-end">
          <div className="text-center text-xs text-slate-500">
            <div className="mb-10 h-px w-40 border-b border-slate-300" />
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-slate-500">
      <span>{label}</span>
      <span>₹{Number(value).toFixed(2)}</span>
    </div>
  );
}
