import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, Mail, MessageCircle, Users, Check, X as XIcon } from 'lucide-react';
import { listFollowUps, updateFollowUpStatus } from '../../services/crmService.js';
import { toast } from '../../store/toastStore.js';

const TYPE_ICONS = { call: Phone, email: Mail, whatsapp: MessageCircle, meeting: Users };

export default function FollowUpsList() {
  const queryClient = useQueryClient();

  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['follow-ups'],
    queryFn: () => listFollowUps(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateFollowUpStatus(id, status),
    onSuccess: () => {
      toast.success('Follow-up updated');
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update follow-up'),
  });

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-slate-400">Loading follow-ups...</div>;
  }

  const now = new Date();
  const pending = followUps.filter((f) => f.status === 'pending');
  const overdue = pending.filter((f) => new Date(f.scheduled_at) < now);
  const upcoming = pending.filter((f) => new Date(f.scheduled_at) >= now);
  const done = followUps.filter((f) => f.status !== 'pending');

  return (
    <div className="flex flex-col gap-8">
      <Group title="Overdue" items={overdue} tone="text-red-600" onUpdate={statusMutation.mutate} />
      <Group title="Upcoming" items={upcoming} tone="text-slate-700 dark:text-slate-300" onUpdate={statusMutation.mutate} />
      <Group title="Completed / Missed" items={done} tone="text-slate-400" onUpdate={statusMutation.mutate} muted />
    </div>
  );
}

function Group({ title, items, tone, onUpdate, muted }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${tone}`}>
        {title} ({items.length})
      </h3>
      <div className="flex flex-col gap-2">
        {items.map((f) => {
          const Icon = TYPE_ICONS[f.type] || Phone;
          return (
            <div
              key={f.id}
              className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 ${
                muted ? 'opacity-60' : ''
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.lead_name || f.customer_name || 'Unknown'}</p>
                <p className="text-xs text-slate-500">
                  {new Date(f.scheduled_at).toLocaleString('en-IN')}
                  {f.assigned_to_name && ` · ${f.assigned_to_name}`}
                </p>
                {f.notes && <p className="mt-0.5 truncate text-xs text-slate-400">{f.notes}</p>}
              </div>
              {f.status === 'pending' && (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => onUpdate({ id: f.id, status: 'completed' })}
                    className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    title="Mark completed"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onUpdate({ id: f.id, status: 'missed' })}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    title="Mark missed"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
              {f.status !== 'pending' && (
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500 dark:bg-slate-800">
                  {f.status}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
