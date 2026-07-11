import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Mail, IndianRupee, UserCheck, Trash2, Send, Loader2 } from 'lucide-react';
import Modal from '../Modal.jsx';
import Button from '../Button.jsx';
import FollowUpFormModal from './FollowUpFormModal.jsx';
import { getLead, addLeadNote, convertLead, deleteLead } from '../../services/crmService.js';
import { toast } from '../../store/toastStore.js';

export default function LeadDetailModal({ open, onClose, leadId, onEdit }) {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => getLead(leadId),
    enabled: open && !!leadId,
  });

  const noteMutation = useMutation({
    mutationFn: (note) => addLeadNote(leadId, note),
    onSuccess: () => {
      setNoteText('');
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add note'),
  });

  const convertMutation = useMutation({
    mutationFn: () => convertLead(leadId),
    onSuccess: () => {
      toast.success('Lead converted to customer');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to convert lead'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLead(leadId),
    onSuccess: () => {
      toast.success('Lead deleted');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete lead'),
  });

  return (
    <>
      <Modal open={open} onClose={onClose} title={lead?.name || 'Lead'} maxWidth="max-w-xl">
        {isLoading || !lead ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
              {lead.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {lead.phone}
                </span>
              )}
              {lead.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {lead.email}
                </span>
              )}
              {lead.estimated_value != null && (
                <span className="flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5" /> {Number(lead.estimated_value).toLocaleString('en-IN')}
                </span>
              )}
              {lead.assigned_to_name && (
                <span className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" /> {lead.assigned_to_name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => onEdit(lead)}>
                Edit lead
              </Button>
              <Button variant="secondary" onClick={() => setShowFollowUp(true)}>
                Schedule follow-up
              </Button>
              {lead.status !== 'converted' && (
                <Button variant="secondary" isLoading={convertMutation.isPending} onClick={() => convertMutation.mutate()}>
                  Convert to customer
                </Button>
              )}
              <Button
                variant="danger"
                className="ml-auto"
                onClick={() => {
                  if (confirm('Delete this lead? This cannot be undone.')) deleteMutation.mutate();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {lead.followUps?.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Follow-ups</h3>
                <div className="flex flex-col gap-1.5">
                  {lead.followUps.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                      <span className="capitalize">{f.type}</span>
                      <span className="text-slate-500">{new Date(f.scheduled_at).toLocaleString('en-IN')}</span>
                      <span className="text-xs capitalize text-slate-400">{f.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Notes</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (noteText.trim()) noteMutation.mutate(noteText.trim());
                }}
                className="mb-3 flex gap-2"
              >
                <input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note about this lead..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-900"
                />
                <Button type="submit" isLoading={noteMutation.isPending} disabled={!noteText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              <div className="flex flex-col gap-2">
                {(lead.notes || []).length === 0 ? (
                  <p className="text-sm text-slate-400">No notes yet.</p>
                ) : (
                  lead.notes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                      <p>{n.note}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {n.created_by_name || 'Someone'} · {new Date(n.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <FollowUpFormModal open={showFollowUp} onClose={() => setShowFollowUp(false)} leadId={leadId} leadName={lead?.name} />
    </>
  );
}
