'use client';

import { motion } from 'framer-motion';

type Tone = 'success' | 'warning' | 'info' | 'neutral' | 'danger';

const tones: Record<Tone, string> = {
  success: 'bg-[#69f5c7]/12 text-[#d8fff0]',
  warning: 'bg-[#39d98a]/10 text-[#bcffe5]',
  info: 'bg-[#7dffd4]/10 text-[#d8fff0]',
  neutral: 'bg-[#142a1f]/55 text-[rgba(236,255,247,0.78)]',
  danger: 'bg-[#ff7f9b]/10 text-[#ffd5de]',
};

export function StatusBadge({ label, tone = 'neutral', pulse = false }: { label: string; tone?: Tone; pulse?: boolean }) {
  return (
    <motion.span
      className={`status-pill ${tones[tone]}`}
      animate={pulse ? { boxShadow: ['0 0 0 rgba(110,231,183,0)', '0 0 30px rgba(110,231,183,0.2)', '0 0 0 rgba(110,231,183,0)'] } : undefined}
      transition={pulse ? { duration: 2.8, repeat: Infinity } : undefined}
    >
      <span className="status-dot" />
      {label}
    </motion.span>
  );
}
