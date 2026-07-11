import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, X } from 'lucide-react';
import { searchCustomers, createCustomer } from '../../services/customerService.js';
import TextField from '../TextField.jsx';
import Button from '../Button.jsx';
import Select from '../Select.jsx';
import { INDIAN_STATES } from '../../lib/indianStates.js';
import { toast } from '../../store/toastStore.js';

export default function CustomerPicker({ value, onChange }) {
  const [search, setSearch] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => searchCustomers(search),
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (customer) => {
      toast.success('Customer added');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onChange(customer.id, customer);
      setShowQuickAdd(false);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add customer'),
  });

  const selected = customers.find((c) => c.id === value);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Customer / Client</label>

      {!showQuickAdd ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-900"
              placeholder="Search customer by name or phone..."
              value={selected ? selected.name : search}
              onChange={(e) => {
                setSearch(e.target.value);
                onChange('', null);
              }}
            />
          </div>

          {search && !selected && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
              {customers.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(true)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <UserPlus className="h-4 w-4" /> Add "{search}" as a new customer
                </button>
              ) : (
                customers.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      onChange(c.id, c);
                      setSearch('');
                    }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.phone && <span className="text-xs text-slate-500">{c.phone}</span>}
                  </button>
                ))
              )}
            </div>
          )}

          {!search && (
            <button
              type="button"
              onClick={() => setShowQuickAdd(true)}
              className="flex w-fit items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add new customer
            </button>
          )}
        </>
      ) : (
        <QuickAddForm
          initialName={search}
          onCancel={() => setShowQuickAdd(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isSubmitting={createMutation.isPending}
        />
      )}
    </div>
  );
}

function QuickAddForm({ initialName, onCancel, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    name: initialName || '',
    phone: '',
    email: '',
    gstin: '',
    billingAddress: '',
    state: '',
    stateCode: '',
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">New customer</span>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <TextField
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <TextField
          label="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          label="GSTIN (optional)"
          value={form.gstin}
          onChange={(e) => setForm({ ...form, gstin: e.target.value })}
        />
        <div className="sm:col-span-2">
          <TextField
            label="Billing address"
            value={form.billingAddress}
            onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
          />
        </div>
        <Select
          label="State"
          value={form.stateCode}
          onChange={(e) => {
            const s = INDIAN_STATES.find((st) => st.code === e.target.value);
            setForm({ ...form, stateCode: e.target.value, state: s?.name || '' });
          }}
        >
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          isLoading={isSubmitting}
          disabled={!form.name}
          onClick={() => onSubmit(form)}
        >
          Add customer
        </Button>
      </div>
    </div>
  );
}
