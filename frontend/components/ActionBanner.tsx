'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

type Props = {
  eyebrow?: string;
  title: string;
  copy: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  glow?: boolean;
};

export function ActionBanner({ eyebrow, title, copy, icon: Icon = ArrowRight, action, glow = false }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-[32px] border border-[#70ffc4]/18 bg-[#07110d]/72 p-5 shadow-[inset_0_1px_0_rgba(236,255,247,0.06)] ${glow ? 'shadow-[0_0_70px_rgba(105,245,199,0.12)]' : ''}`}
    >
      <motion.div
        className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#69f5c7]/10 blur-3xl"
        animate={{ opacity: [0.22, 0.48, 0.22], scale: [0.96, 1.08, 0.96] }}
        transition={{ duration: 5.5, repeat: Infinity }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[20px] border border-[#70ffc4]/22 bg-[#69f5c7]/10 text-[#69f5c7]">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">{eyebrow}</p> : null}
            <h3 className="mt-1 text-xl font-black tracking-[-0.02em] text-[#ecfff7]">{title}</h3>
            <div className="mt-2 max-w-2xl text-sm leading-6 text-[rgba(236,255,247,0.72)]">{copy}</div>
          </div>
        </div>
        {action ? <div className="relative shrink-0">{action}</div> : null}
      </div>
    </motion.div>
  );
}
