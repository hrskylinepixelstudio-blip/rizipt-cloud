import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../Modal.jsx';
import TextField from '../TextField.jsx';
import TextArea from '../TextArea.jsx';
import Select from '../Select.jsx';
import Button from '../Button.jsx';
import { createFollowUp } from '../../services/crmService.js';
import { fetchCompanyUsers } from '../../services/companyService.js';
import { searchCustomers } from '../../services/customerService.js';
import { toast } from '../../store/toastStore.js';

const TYPES = ['call', 'email', 'whatsapp', 'meeting'];

export default function FollowUpFormModal({ open, onClose, leadId, leadName }) {
  const queryClient = useQueryClient();

  const nowLocal = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
  const [form, setForm] = useState({
    scheduledAt: nowLocal,
    type: 'call',
    notes: '',
    assignedTo: '',
    customerId: '',
  });

  const { data: users = [] } = useQuery({ queryKey: ['company-users'], queryFn: fetchCompanyUsers, enabled: open });
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', ''],
    queryFn: () => searchCustomers(''),
    enabled: open && !leadId,
  });

  const mutation = useMutation({
    mutationFn: createFollowUp,
    onSuccess: () => {
      toast.success('Follow-up scheduled');
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to schedule follow-up'),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.scheduledAt) {
      toast.error('Pick a date and time');
      return;
    }
    if (!leadId && !form.customerId) {
      toast.error('Select a customer for this follow-up');
      return;
    }
    mutation.mutate({
      leadId: leadId || undefined,
      customerId: leadId ? undefined : form.customerId,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      type: form.type,
      notes: form.notes || undefined,
      assignedTo: form.assignedTo || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={leadName ? `Follow up with ${leadName}` : 'New Follow-up'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {!leadId && (
          <Select label="Customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
            <option value="">Select a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Date & time"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </Select>
        </div>
        <Select label="Assign to" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </Select>
        <TextArea label="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
