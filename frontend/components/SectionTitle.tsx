'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

type Props = {
  eyebrow?: string;
  title: string;
  copy?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
};

export function SectionTitle({ eyebrow, title, copy, icon: Icon, action }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]"
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {eyebrow}
          </motion.p>
        ) : null}
        <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#ecfff7] sm:text-3xl">{title}</h2>
        {copy ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgba(236,255,247,0.72)]">{copy}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
