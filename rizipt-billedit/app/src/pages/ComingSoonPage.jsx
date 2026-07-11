import { Construction } from 'lucide-react';

export default function ComingSoonPage({ title }) {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-center">
      <Construction className="h-10 w-10 text-brand-600" />
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-slate-500">
        This module is scheduled next on the build roadmap. See docs/ROADMAP.md for the milestone order.
      </p>
    </div>
  );
}
