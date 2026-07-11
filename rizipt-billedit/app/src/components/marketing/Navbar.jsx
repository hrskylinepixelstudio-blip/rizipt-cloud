import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
];

export default function MarketingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white">
            <Boxes className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-bold text-white">Rizipt Cloud</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="text-sm font-medium text-white/80 transition-colors hover:text-white">
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition-transform hover:scale-105"
          >
            Start free trial
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="text-white md:hidden" aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm font-medium text-white/70">
                {link.label}
              </a>
            ))}
            <Link to="/login" className="text-sm font-medium text-white/80">
              Sign in
            </Link>
            <Link to="/register" className="rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-ink">
              Start free trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
