import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';
import { useToastStore } from '../store/toastStore.js';

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const STYLES = {
  success: 'bg-white border-green-200 text-green-800 dark:bg-slate-900 dark:border-green-900 dark:text-green-300',
  error: 'bg-white border-red-200 text-red-800 dark:bg-slate-900 dark:border-red-900 dark:text-red-300',
  info: 'bg-white border-blue-200 text-blue-800 dark:bg-slate-900 dark:border-blue-900 dark:text-blue-300',
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(({ id, message, type }) => {
        const Icon = ICONS[type] || Info;
        return (
          <div
            key={id}
            className={clsx(
              'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg',
              STYLES[type]
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{message}</span>
            <button onClick={() => dismiss(id)} className="ml-2 opacity-60 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
