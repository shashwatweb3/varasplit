'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

type Props = {
  label: string;
  value: string | number;
  copy?: string;
  icon: LucideIcon;
  active?: boolean;
};

export function SummaryStatCard({ label, value, copy, icon: Icon, active = false }: Props) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.18 }}
      className={`soft-card p-4 ${active ? 'border-[#69f5c7]/32 bg-[#69f5c7]/10 shadow-[0_0_44px_rgba(105,245,199,0.1)]' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-[16px] border border-[#70ffc4]/18 bg-[#69f5c7]/10 text-[#69f5c7]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#ecfff7]">{value}</p>
      {copy ? <p className="mt-2 text-sm leading-5 text-[rgba(236,255,247,0.72)]">{copy}</p> : null}
    </motion.div>
  );
}
