'use client';

import { motion } from 'framer-motion';

type Props = {
  name: string;
  address: string;
  isCurrent?: boolean;
};

function initials(name: string) {
  const clean = name.trim();
  if (!clean || clean === 'Member') return 'M';
  if (clean === 'You') return 'Y';
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function MemberPill({ name, address, isCurrent = false }: Props) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={`flex items-center gap-3 rounded-[24px] border p-3 ${
        isCurrent
          ? 'border-[#69f5c7]/35 bg-[#69f5c7]/12 shadow-[0_0_34px_rgba(105,245,199,0.12)]'
          : 'border-[#70ffc4]/13 bg-[#07110d]/70'
      }`}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-[#69f5c7] text-sm font-black text-[#03100b] shadow-[0_0_28px_rgba(105,245,199,0.22)]">
        {initials(name)}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 truncate font-bold text-[#ecfff7]">
          {name}
          {isCurrent ? <span className="status-pill bg-[#69f5c7]/12 px-2 py-1 text-[10px] text-[#d8fff0]">You</span> : null}
        </span>
        <span className="mt-1 block truncate text-sm text-[rgba(190,230,214,0.5)]">{address}</span>
      </span>
    </motion.div>
  );
}
