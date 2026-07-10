import clsx from 'clsx';
import { forwardRef } from 'react';

const Select = forwardRef(function Select({ label, error, className, id, children, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={clsx(
          'rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors',
          'focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500',
          'dark:bg-slate-900 dark:border-slate-700 dark:text-white',
          error ? 'border-red-500' : 'border-slate-300',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default Select;
