'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export function SuccessToast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[24px] border border-[#69f5c7]/30 bg-[#69f5c7]/10 px-4 py-3 text-sm font-semibold text-[#ecfff7] shadow-[0_0_44px_rgba(105,245,199,0.14)]"
        >
          <motion.span
            className="absolute -left-10 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-[#69f5c7]/20 blur-2xl"
            animate={{ x: ['0%', '320%'], opacity: [0.2, 0.75, 0.2] }}
            transition={{ duration: 1.15 }}
          />
          <span className="relative flex items-center gap-2">
            <motion.span
              initial={{ scale: 0.4, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              className="grid h-6 w-6 place-items-center rounded-full bg-[#69f5c7] text-[#03100b]"
            >
              <CheckCircle2 className="h-4 w-4" />
            </motion.span>
            {message}
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
