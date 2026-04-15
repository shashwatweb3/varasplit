'use client';

import { motion } from 'framer-motion';

export function ProgressPill({ value, label }: { value: number; label?: string }) {
  const percent = Math.max(0, Math.min(100, value));

  return (
    <div>
      {label ? <p className="mb-2 text-xs font-semibold text-[rgba(190,230,214,0.5)]">{label}</p> : null}
      <div className="h-3 overflow-hidden rounded-full bg-[#142a1f] shadow-inner">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#39d98a] via-[#69f5c7] to-[#7dffd4] shadow-[0_0_24px_rgba(105,245,199,0.42)]"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}
