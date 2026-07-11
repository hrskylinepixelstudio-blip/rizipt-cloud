import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Receipt,
  Boxes,
  Users,
  Contact2,
  BarChart3,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  Zap,
  Check,
} from 'lucide-react';
import MarketingNavbar from '../../components/marketing/Navbar.jsx';
import ReceiptStack from '../../components/marketing/ReceiptStack.jsx';

const TRUST_CHIPS = ['GST-ready billing', 'Works on phone & desktop', 'Bank-grade encryption', 'Built in Tamil Nadu 🇮🇳'];

const FEATURES = [
  {
    icon: ShoppingCart,
    title: 'POS & Billing',
    description: 'Bill customers in seconds with barcode scanning, split payments, and instant thermal or A4 printing.',
  },
  {
    icon: Receipt,
    title: 'GST Invoicing',
    description: 'Tax invoices, quotations, proforma and challans with CGST/SGST/IGST calculated automatically, every time.',
  },
  {
    icon: Boxes,
    title: 'Inventory tracking',
    description: 'Stock levels, batches, expiry dates and low-stock alerts across every warehouse you run.',
  },
  {
    icon: Users,
    title: 'Customer & supplier ledgers',
    description: 'See who owes you, who you owe, and every transaction behind that number — in one place.',
  },
  {
    icon: Contact2,
    title: 'CRM & follow-ups',
    description: "Leads, tasks and follow-up reminders so a quote doesn't quietly go cold.",
  },
  {
    icon: BarChart3,
    title: 'Reports that make sense',
    description: 'Sales, GST summaries, day book and profit & loss — ready when your accountant asks for them.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Set up your company',
    description: 'Add your logo, GSTIN, bank details and invoice numbering once — it applies everywhere after.',
  },
  {
    number: '02',
    title: 'Bill in seconds',
    description: 'Raise a quotation, invoice, or receipt from your phone or laptop — GST is calculated for you.',
  },
  {
    number: '03',
    title: 'Track what comes in',
    description: 'Watch payments, outstanding balances, and revenue update live on your dashboard.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: '14-day trial',
    description: 'Try every feature with your real business data.',
    features: ['Unlimited invoices & quotes', '1 user', 'GST billing', 'Email support'],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '₹999',
    period: '/month',
    description: 'For a growing shop or small team.',
    features: ['Everything in Starter', 'Up to 5 users', 'Inventory & POS', 'CRM & follow-ups', 'Priority support'],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '₹2,499',
    period: '/month',
    description: 'Multiple outlets, full reporting, and payroll.',
    features: ['Everything in Growth', 'Unlimited users', 'Multi-warehouse', 'Payroll & attendance', 'Dedicated onboarding'],
    cta: 'Talk to us',
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="mesh-bg min-h-screen font-sans text-white">
      <MarketingNavbar />

      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] overflow-hidden">
        <div className="mesh-blob mesh-blob-animated h-72 w-72 bg-violet-600/40" style={{ top: '5%', left: '8%' }} />
        <div className="mesh-blob mesh-blob-animated h-96 w-96 bg-brand-500/30" style={{ top: '2%', right: '5%', animationDelay: '3s' }} />
      </div>

      {/* HERO */}
      <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-2 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Built for Indian MSMEs
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Bill in seconds.
            <br />
            <span className="text-gradient-brand">Get paid faster.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/70">
            GST invoicing, POS billing, inventory and customer follow-ups — one cloud dashboard built for shops,
            studios and service businesses across India.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-105"
            >
              Start free — no card needed
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5"
            >
              See what's included
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
            {TRUST_CHIPS.map((chip) => (
              <div key={chip} className="flex items-center gap-1.5 text-xs text-white/50">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                {chip}
              </div>
            ))}
          </div>
        </motion.div>

        <ReceiptStack />
      </section>

      {/* PRODUCT FACTS STRIP */}
      <section className="relative border-y border-white/10 bg-white/[0.02] py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 sm:px-8 md:grid-cols-4">
          {[
            ['5 min', 'to your first invoice'],
            ['14 days', 'free, full access'],
            ['CGST/SGST/IGST', 'calculated automatically'],
            ['Any device', 'phone, tablet, desktop'],
          ].map(([stat, label]) => (
            <div key={stat} className="text-center md:text-left">
              <div className="font-mono text-xl font-semibold text-white sm:text-2xl">{stat}</div>
              <div className="mt-1 text-xs text-white/50">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="mb-12 max-w-xl">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-brand-400">Everything in one place</span>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Run the whole business, not just the billing</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="glass-panel rounded-2xl p-6 transition-colors hover:bg-white/[0.09]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-violet-600/30 text-brand-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="mb-14 max-w-xl">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-amber-400">The setup</span>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Three steps. That's genuinely it.</h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div className="font-display text-5xl font-bold text-white/10">{step.number}</div>
              <h3 className="mt-2 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{step.description}</p>
              {i < STEPS.length - 1 && (
                <div className="mt-6 hidden h-px w-full bg-gradient-to-r from-white/20 to-transparent md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="mb-14 max-w-xl">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-emerald-400">Pricing</span>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Straightforward pricing, in rupees</h2>
          <p className="mt-3 text-sm text-white/60">No setup fee. Cancel whenever. GST invoice provided for every payment.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-7 ${
                plan.highlighted ? 'glass-panel border-brand-400/40 shadow-2xl shadow-brand-500/20' : 'glass-panel'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-brand-500 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1 font-mono">
                <span className="text-3xl font-semibold">{plan.price}</span>
                <span className="text-sm text-white/50">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-white/60">{plan.description}</p>

              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`mt-7 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-transform hover:scale-105 ${
                  plan.highlighted ? 'bg-white text-ink' : 'border border-white/20 text-white hover:bg-white/5'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="glass-panel relative overflow-hidden rounded-3xl px-8 py-14 text-center sm:px-16">
          <div className="mesh-blob h-64 w-64 bg-violet-600/30" style={{ top: '-40px', left: '-40px' }} />
          <div className="mesh-blob h-64 w-64 bg-brand-500/30" style={{ bottom: '-40px', right: '-40px' }} />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Start billing in the next 5 minutes</h2>
            <p className="mx-auto mt-3 max-w-md text-white/70">
              Set up your company profile and raise your first GST invoice today — free for 14 days.
            </p>
            <Link
              to="/register"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-105"
            >
              Create your free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-white/10 px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 md:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-white">
                <Boxes className="h-3.5 w-3.5" />
              </div>
              <span className="font-display text-sm font-bold">Rizipt Cloud</span>
            </div>
            <p className="mt-3 max-w-xs text-xs text-white/50">
              ERP, POS, GST billing and CRM for Indian MSMEs. Built in Kelambakkam, Tamil Nadu.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
              <ShieldCheck className="h-3.5 w-3.5" /> Bank-grade encryption
              <Smartphone className="ml-3 h-3.5 w-3.5" /> Works on any device
            </div>
          </div>

          <div className="flex gap-16 text-sm">
            <div className="flex flex-col gap-2.5">
              <span className="font-medium text-white/80">Product</span>
              <a href="#features" className="text-white/50 hover:text-white">Features</a>
              <a href="#pricing" className="text-white/50 hover:text-white">Pricing</a>
              <Link to="/login" className="text-white/50 hover:text-white">Sign in</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-medium text-white/80">Company</span>
              <span className="text-white/50">rizipt.in</span>
              <span className="text-white/50">Tamil Nadu, India</span>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} Rizipt Cloud. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
