'use client';

import { motion } from 'framer-motion';

import type { GroupSummaryCard } from '@/lib/types';

interface ShareCardProps {
  card: GroupSummaryCard;
}

export function ShareCard({ card }: ShareCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-green-400/40 bg-[#0b1220] p-6 shadow-lg hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-green-400/70">Settled</p>
          <h3 className="mt-2 text-2xl font-semibold text-gray-200">{card.title}</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-400 text-2xl text-black">
          ✓
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{card.body}</p>
      <div className="mt-5 flex gap-3">
        <a
          href={card.tweetUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-green-400 px-4 py-2 text-sm font-semibold text-black hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow"
        >
          Share on X
        </a>
      </div>
    </motion.div>
  );
}
