import { TrendingUp, Wallet, AlertTriangle, Users, Package, Receipt } from 'lucide-react';

const METRICS = [
  { label: "Sales Today", value: '₹0', icon: TrendingUp },
  { label: 'Sales This Month', value: '₹0', icon: TrendingUp },
  { label: "Today's Collection", value: '₹0', icon: Wallet },
  { label: 'Pending Payments', value: '₹0', icon: Receipt },
  { label: 'Outstanding Customers', value: '0', icon: Users },
  { label: 'Low Stock Items', value: '0', icon: AlertTriangle },
  { label: 'Monthly Profit', value: '₹0', icon: TrendingUp },
  { label: 'Top Selling Products', value: '—', icon: Package },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Live data wires up once the Products, Billing, and Reports modules land (see docs/ROADMAP.md).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <Icon className="h-4 w-4 text-brand-600" />
            </div>
            <span className="text-2xl font-semibold">{value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Revenue Graph</h2>
          <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-800">
            Chart renders once /api/reports/sales is available
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Bills</h2>
          <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-800">
            No bills yet
          </div>
        </div>
      </div>
    </div>
  );
}
