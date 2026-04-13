'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { FormEvent, useState } from 'react';

import { normalizeAddressKey } from '@/lib/address';

interface AddExpenseModalProps {
  open: boolean;
  members: string[];
  memberNames: Record<string, string>;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { payer: string; amount: bigint; description: string }) => Promise<void>;
}

export function AddExpenseModal({ open, members, memberNames, loading, onClose, onSubmit }: AddExpenseModalProps) {
  const [payer, setPayer] = useState(members[0] ?? '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const parsedAmount = Number(amount);
  const memberCount = members.length;
  const perMemberShare = memberCount > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount / memberCount : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedPayer = members.includes(payer) ? payer : (members[0] ?? '');
    if (!selectedPayer) return;
    if (!amount || Number(amount) <= 0) return;
    if (!description.trim()) return;

    await onSubmit({
      payer: selectedPayer,
      amount: BigInt(Math.round(Number(amount) * 10 ** 12)),
      description: description.trim(),
    });

    setAmount('');
    setDescription('');
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end bg-black/60 p-4 md:items-center md:justify-center"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0b1220] p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">New Expense</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-200">Split it in one move</h2>
              </div>
              <button type="button" onClick={onClose} className="text-slate-400">
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Payer</span>
                <select
                  value={members.includes(payer) ? payer : (members[0] ?? '')}
                  onChange={(event) => setPayer(event.target.value)}
                  className="w-full rounded-2xl border border-white/5 bg-[#0b1220] px-4 py-3 text-gray-200 outline-none"
                >
                  {members.map((member) => (
                    <option key={member} value={member} className="bg-neutral-900">
                      {memberNames[normalizeAddressKey(member)] || memberNames[member] || member}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Amount</span>
                <input
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="420"
                  className="w-full rounded-2xl border border-white/5 bg-[#0b1220] px-4 py-3 text-gray-200 outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Description</span>
                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Dinner, cab, tickets..."
                  className="w-full rounded-2xl border border-white/5 bg-[#0b1220] px-4 py-3 text-gray-200 outline-none"
                />
              </label>

              {perMemberShare > 0 ? (
                <div className="rounded-2xl border border-green-400/20 bg-[#0b1220] px-4 py-3 text-sm text-green-400">
                  Each member pays -&gt; {perMemberShare.toFixed(2)} TVARA
                </div>
              ) : null}

              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full rounded-full bg-green-400 px-4 py-3 font-semibold text-black hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
