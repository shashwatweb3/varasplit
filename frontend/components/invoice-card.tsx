'use client';

import { motion } from 'framer-motion';

import type { GroupView, SettlementTransfer } from '@/lib/types';

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function formatTvara(value: bigint): string {
  const negative = value < BigInt(0);
  const absolute = negative ? value * BigInt(-1) : value;
  const whole = absolute / BigInt(10 ** 12);
  const fraction = absolute % BigInt(10 ** 12);
  const fractionText = fraction.toString().padStart(12, '0').replace(/0+$/, '');
  const formatted = fractionText ? `${whole.toString()}.${fractionText}` : whole.toString();

  return negative ? `-${formatted}` : formatted;
}

function resolveMemberName(address: string, memberNames: Record<string, string>) {
  return memberNames[address] || shortAddress(address);
}

interface InvoiceCardProps {
  group: GroupView;
  settlementPlan: SettlementTransfer[];
  memberNames: Record<string, string>;
  onClose: () => void;
}

export function InvoiceCard({ group, settlementPlan, memberNames, onClose }: InvoiceCardProps) {
  const totalSettled = settlementPlan.reduce((sum, transfer) => sum + transfer.amount, BigInt(0));
  const timestamp = group.expenses.length > 0
    ? Math.max(...group.expenses.map(e => e.createdAt))
    : Date.now();

  const isEmptySettlement = settlementPlan.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0b1220] p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-400 text-xl text-black">
              ✓
            </div>
            <h2 className="text-xl font-semibold text-gray-200">Settlement Complete</h2>
          </motion.div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Group</p>
            <p className="mt-1 text-lg font-semibold text-gray-200">{group.name}</p>
          </motion.div>

          {isEmptySettlement ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 24 }}
            >
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Status</p>
              <p className="mt-1 text-slate-400">No outstanding balances</p>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 24 }}
              >
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Transfers</p>
                <div className="mt-2 space-y-2">
                  {settlementPlan.map((transfer, index) => (
                    <motion.div
                      key={index}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.5, type: 'spring', stiffness: 300, damping: 24 }}
                      className="rounded-lg border border-white/5 bg-[#0b1220] p-3 text-sm text-slate-400"
                    >
                      {resolveMemberName(transfer.from, memberNames)} → {resolveMemberName(transfer.to, memberNames)} → {formatTvara(transfer.amount)} TVARA
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + settlementPlan.length * 0.1, type: 'spring', stiffness: 200 }}
              >
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Total Settled</p>
                <p className="mt-1 text-2xl font-semibold text-green-400">{formatTvara(totalSettled)} TVARA</p>
              </motion.div>
            </>
          )}

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: isEmptySettlement ? 0.4 : 0.6 + settlementPlan.length * 0.1, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Timestamp</p>
            <p className="mt-1 text-slate-400">{new Date(timestamp).toLocaleString()}</p>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}