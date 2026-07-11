import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const RECEIPTS = [
  {
    tone: 'quiet',
    rotate: -14,
    x: -70,
    y: 30,
    title: 'QUOTATION',
    number: 'QT-0042',
    lines: [
      ['Website redesign', '₹18,000'],
      ['Hosting (1 yr)', '₹4,000'],
    ],
    total: '₹22,000',
    stamp: null,
  },
  {
    tone: 'quiet',
    rotate: 9,
    x: 66,
    y: 6,
    title: 'DELIVERY CHALLAN',
    number: 'DC-0117',
    lines: [
      ['Rice — 50kg bags', 'x12'],
      ['Cooking oil — 15L', 'x6'],
    ],
    total: '—',
    stamp: null,
  },
  {
    tone: 'main',
    rotate: -3,
    x: 0,
    y: -10,
    title: 'TAX INVOICE',
    number: 'INV-0286',
    lines: [
      ['Consulting services', '₹32,000'],
      ['CGST 9% + SGST 9%', '₹5,760'],
    ],
    total: '₹37,760',
    stamp: 'PAID',
  },
];

export default function ReceiptStack() {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 14 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 14 });

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto h-[380px] w-full max-w-md [perspective:1200px] sm:h-[440px]"
    >
      <motion.div style={{ rotateX, rotateY }} className="relative h-full w-full [transform-style:preserve-3d]">
        {RECEIPTS.map((r, i) => (
          <motion.div
            key={r.number}
            initial={{ opacity: 0, y: 60, rotate: 0, scale: 0.9 }}
            animate={{ opacity: 1, y: r.y, rotate: r.rotate, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ left: '50%', top: '50%', x: r.x, translateX: '-50%', translateY: '-50%' }}
            className={`absolute w-56 rounded-2xl p-4 shadow-2xl sm:w-64 ${
              r.tone === 'main'
                ? 'glass-panel z-20 border-white/20 text-white shadow-brand-900/40'
                : 'glass-panel z-10 text-white/80'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-[10px] font-bold tracking-widest text-white/60">{r.title}</span>
              {r.stamp && (
                <span className="rotate-[-8deg] rounded border border-emerald-400/60 px-1.5 py-0.5 font-display text-[9px] font-bold tracking-widest text-emerald-400">
                  {r.stamp}
                </span>
              )}
            </div>
            <div className="mb-3 font-mono text-[11px] text-white/40">{r.number}</div>
            <div className="space-y-1.5 border-t border-white/10 pt-2 font-mono text-[11px]">
              {r.lines.map(([label, amount]) => (
                <div key={label} className="flex justify-between gap-3">
                  <span className="truncate text-white/60">{label}</span>
                  <span className="shrink-0 text-white/90">{amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between border-t border-white/10 pt-2 font-mono text-xs font-semibold text-white">
              <span className="font-sans text-[10px] font-normal uppercase tracking-wide text-white/50">Total</span>
              <span>{r.total}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
