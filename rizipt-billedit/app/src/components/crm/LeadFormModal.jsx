import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../Modal.jsx';
import TextField from '../TextField.jsx';
import TextArea from '../TextArea.jsx';
import Select from '../Select.jsx';
import Button from '../Button.jsx';
import { createLead, updateLead } from '../../services/crmService.js';
import { fetchCompanyUsers } from '../../services/companyService.js';
import { toast } from '../../store/toastStore.js';

const SOURCES = ['website', 'referral', 'walk-in', 'advertisement', 'whatsapp', 'phone', 'other'];

export default function LeadFormModal({ open, onClose, lead }) {
  const queryClient = useQueryClient();
  const isEdit = !!lead;

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'website',
    estimatedValue: '',
    notes: '',
    assignedTo: '',
  });

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        source: lead.source || 'website',
        estimatedValue: lead.estimated_value ?? '',
        notes: lead.notes || '',
        assignedTo: lead.assigned_to || '',
      });
    } else {
      setForm({ name: '', phone: '', email: '', source: 'website', estimatedValue: '', notes: '', assignedTo: '' });
    }
  }, [lead, open]);

  const { data: users = [] } = useQuery({ queryKey: ['company-users'], queryFn: fetchCompanyUsers, enabled: open });

  const mutation = useMutation({
    mutationFn: (payload) => (isEdit ? updateLead(lead.id, payload) : createLead(payload)),
    onSuccess: () => {
      toast.success(isEdit ? 'Lead updated' : 'Lead added');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save lead'),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
    mutation.mutate({
      ...form,
      estimatedValue: form.estimatedValue === '' ? undefined : Number(form.estimatedValue),
      assignedTo: form.assignedTo || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Lead' : 'New Lead'}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {SOURCES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>
          <TextField
            label="Estimated value (₹)"
            type="number"
            value={form.estimatedValue}
            onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
          />
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
            {isEdit ? 'Save changes' : 'Add lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
