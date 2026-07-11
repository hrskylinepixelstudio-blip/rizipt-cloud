import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, Wallet, AlertTriangle, Users, Package, Receipt, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { fetchDashboardSummary } from '../services/dashboardService.js';
import { docTypeLabel } from '../lib/docTypes.js';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800',
  void: 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800',
};

function formatCurrency(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short' });
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 60_000,
  });

  const metrics = [
    { label: 'Sales Today', value: formatCurrency(data?.salesToday), icon: TrendingUp },
    { label: 'Sales This Month', value: formatCurrency(data?.salesThisMonth), icon: TrendingUp },
    { label: "Today's Collection", value: formatCurrency(data?.todaysCollection), icon: Wallet },
    { label: 'Pending Payments', value: formatCurrency(data?.pendingPayments), icon: Receipt },
    { label: 'Outstanding Customers', value: data?.outstandingCustomers ?? 0, icon: Users },
    {
      label: 'Low Stock Items',
      value: data?.lowStockItems ?? '—',
      icon: AlertTriangle,
      note: data?.lowStockItems === null ? 'Needs Inventory module' : undefined,
    },
    {
      label: 'Monthly Profit',
      value: data?.monthlyProfit === null ? '—' : formatCurrency(data?.monthlyProfit),
      icon: TrendingUp,
      note: data?.monthlyProfit === null ? 'Needs Expenses module' : undefined,
    },
    {
      label: 'Top Selling Products',
      value: data?.topSellingProducts ?? '—',
      icon: Package,
      note: data?.topSellingProducts === null ? 'Needs Products module' : undefined,
    },
  ];

  const chartData = (data?.revenueByMonth || []).map((row) => ({
    month: formatMonth(row.month),
    total: row.total,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">Live figures from your Tax Invoices (Quotations/Proformas/Contracts don't count as sales).</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, note }) => (
          <div
            key={label}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <Icon className="h-4 w-4 text-brand-600" />
            </div>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
            ) : (
              <span className="text-2xl font-semibold">{value}</span>
            )}
            {note && <span className="text-xs text-slate-400">{note}</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Revenue — Last 6 Months</h2>
          {chartData.length === 0 ? (
            <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-800">
              No paid/confirmed invoices yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Bills</h2>
          {(data?.recentBills || []).length === 0 ? (
            <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-800">
              No bills yet
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentBills.map((bill) => (
                <Link
                  key={bill.id}
                  to={`/billing/${bill.id}`}
                  className="flex items-center justify-between py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-1 px-1 rounded"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{bill.bill_number}</span>
                    <span className="text-xs text-slate-500">
                      {bill.customer_name || '—'} · {docTypeLabel(bill.doc_type)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-medium">{formatCurrency(bill.total_amount)}</span>
                    <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', STATUS_STYLES[bill.status])}>
                      {bill.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
