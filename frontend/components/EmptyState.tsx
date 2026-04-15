'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';

type Props = {
  title: string;
  copy: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
};

export function EmptyState({ title, copy, icon: Icon = Sparkles, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-[28px] border border-dashed border-[#70ffc4]/18 bg-[#07110d]/62 p-6 text-center shadow-[inset_0_1px_0_rgba(236,255,247,0.05)]"
    >
      <motion.span
        animate={{ y: [0, -4, 0], boxShadow: ['0 0 20px rgba(105,245,199,0.12)', '0 0 42px rgba(105,245,199,0.26)', '0 0 20px rgba(105,245,199,0.12)'] }}
        transition={{ duration: 3.2, repeat: Infinity }}
        className="mx-auto grid h-12 w-12 place-items-center rounded-[20px] border border-[#70ffc4]/22 bg-[#69f5c7]/10 text-[#69f5c7]"
      >
        <Icon className="h-5 w-5" />
      </motion.span>
      <h3 className="mt-4 text-lg font-black text-[#ecfff7]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[rgba(236,255,247,0.72)]">{copy}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  );
}
