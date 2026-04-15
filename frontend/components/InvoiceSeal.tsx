'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

export function InvoiceSeal() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
      animate={{ opacity: 1, scale: 1, rotate: -3 }}
      transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative grid h-28 w-28 place-items-center rounded-full border border-[#70ffc4]/28 bg-[#69f5c7]/10 text-center shadow-[0_0_54px_rgba(105,245,199,0.18),inset_0_1px_0_rgba(236,255,247,0.1)]"
    >
      <motion.div
        className="absolute inset-2 rounded-full border border-dashed border-[#70ffc4]/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative">
        <ShieldCheck className="mx-auto h-7 w-7 text-[#69f5c7]" />
        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8fff0]">Verified</p>
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[rgba(236,255,247,0.6)]">VaraSplit</p>
      </div>
    </motion.div>
  );
}
