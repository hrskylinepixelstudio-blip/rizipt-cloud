import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import clsx from 'clsx';
import Button from '../../components/Button.jsx';
import { listBills } from '../../services/billsService.js';
import { DOC_TYPES, docTypeLabel } from '../../lib/docTypes.js';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800',
  void: 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800',
};

export default function BillingListPage() {
  const [activeType, setActiveType] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['bills', activeType],
    queryFn: () => listBills({ docType: activeType === 'all' ? undefined : activeType }),
  });

  const bills = data?.data || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-slate-500">Quotations, Invoices, Proformas, Challans & Contracts</p>
        </div>
        <Link to="/billing/new">
          <Button>
            <Plus className="h-4 w-4" /> New Document
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton active={activeType === 'all'} onClick={() => setActiveType('all')}>
          All
        </TabButton>
        {DOC_TYPES.map((d) => (
          <TabButton key={d.value} active={activeType === d.value} onClick={() => setActiveType(d.value)}>
            {d.label}
          </TabButton>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading...</div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <FileText className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">No documents yet. Create your first one.</p>
            <Link to="/billing/new">
              <Button variant="secondary">
                <Plus className="h-4 w-4" /> New Document
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
                <th className="px-5 py-3 font-medium">Number</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr
                  key={bill.id}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-5 py-3">
                    <Link to={`/billing/${bill.id}`} className="font-medium text-brand-600 hover:underline">
                      {bill.bill_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{docTypeLabel(bill.doc_type)}</td>
                  <td className="px-5 py-3">{bill.customer_name || '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{bill.bill_date}</td>
                  <td className="px-5 py-3 font-medium">₹{Number(bill.total_amount).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={clsx('rounded-full px-2.5 py-1 text-xs font-medium capitalize', STATUS_STYLES[bill.status])}>
                      {bill.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-brand-600 text-white'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
      )}
    >
      {children}
    </button>
  );
}
