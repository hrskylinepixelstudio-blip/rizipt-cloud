import { useState } from 'react';
import { Plus } from 'lucide-react';
import clsx from 'clsx';
import Button from '../../components/Button.jsx';
import LeadBoard from '../../components/crm/LeadBoard.jsx';
import FollowUpsList from '../../components/crm/FollowUpsList.jsx';
import LeadFormModal from '../../components/crm/LeadFormModal.jsx';
import LeadDetailModal from '../../components/crm/LeadDetailModal.jsx';
import FollowUpFormModal from '../../components/crm/FollowUpFormModal.jsx';

export default function CrmPage() {
  const [tab, setTab] = useState('leads');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [openLeadId, setOpenLeadId] = useState(null);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">CRM</h1>
          <p className="text-sm text-slate-500">Leads, follow-ups and the pipeline behind every quote you send.</p>
        </div>
        {tab === 'leads' ? (
          <Button onClick={() => setShowLeadForm(true)}>
            <Plus className="h-4 w-4" /> New Lead
          </Button>
        ) : (
          <Button onClick={() => setShowFollowUpForm(true)}>
            <Plus className="h-4 w-4" /> New Follow-up
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === 'leads'} onClick={() => setTab('leads')}>
          Leads
        </TabButton>
        <TabButton active={tab === 'followups'} onClick={() => setTab('followups')}>
          Follow-ups
        </TabButton>
      </div>

      {tab === 'leads' ? (
        <LeadBoard onOpenLead={(id) => setOpenLeadId(id)} />
      ) : (
        <FollowUpsList />
      )}

      <LeadFormModal open={showLeadForm} onClose={() => setShowLeadForm(false)} lead={null} />

      <LeadFormModal
        open={!!editingLead}
        onClose={() => setEditingLead(null)}
        lead={editingLead}
      />

      <LeadDetailModal
        open={!!openLeadId}
        onClose={() => setOpenLeadId(null)}
        leadId={openLeadId}
        onEdit={(lead) => {
          setOpenLeadId(null);
          setEditingLead(lead);
        }}
      />

      <FollowUpFormModal open={showFollowUpForm} onClose={() => setShowFollowUpForm(false)} leadId={null} leadName={null} />
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
