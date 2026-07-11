import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, IndianRupee } from 'lucide-react';
import { listLeads, updateLeadStatus } from '../../services/crmService.js';
import { toast } from '../../store/toastStore.js';

const COLUMNS = [
  { status: 'new', label: 'New', accent: 'border-t-slate-400' },
  { status: 'contacted', label: 'Contacted', accent: 'border-t-blue-400' },
  { status: 'qualified', label: 'Qualified', accent: 'border-t-amber-400' },
  { status: 'converted', label: 'Converted', accent: 'border-t-emerald-400' },
  { status: 'lost', label: 'Lost', accent: 'border-t-red-300' },
];

export default function LeadBoard({ onOpenLead }) {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => listLeads(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update status'),
  });

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-slate-400">Loading leads...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {COLUMNS.map((col) => {
        const columnLeads = leads.filter((l) => l.status === col.status);
        return (
          <div key={col.status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{col.label}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
                {columnLeads.length}
              </span>
            </div>
            <div className={`flex flex-col gap-2 rounded-xl border-t-4 ${col.accent} bg-slate-50 p-2 min-h-[100px] dark:bg-slate-900/50`}>
              {columnLeads.length === 0 ? (
                <p className="p-3 text-center text-xs text-slate-400">No leads</p>
              ) : (
                columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onOpenLead(lead.id)}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <p className="text-sm font-medium">{lead.name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </span>
                      )}
                      {lead.estimated_value != null && (
                        <span className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" /> {Number(lead.estimated_value).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {lead.assigned_to_name && (
                      <p className="mt-1.5 text-xs text-slate-400">{lead.assigned_to_name}</p>
                    )}
                    <select
                      value={lead.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => statusMutation.mutate({ id: lead.id, status: e.target.value })}
                      className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] capitalize outline-none dark:border-slate-700 dark:bg-slate-800"
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.status} value={c.status}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
