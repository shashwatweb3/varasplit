'use client';

import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound, LockKeyhole, X } from 'lucide-react';

import { acceptWorkPayoutInvite, WORK_PAYOUT_INVITE_CODE } from '@/lib/workPayoutInvite';

type Props = {
  open: boolean;
  onAccepted: () => void;
  onCancel: () => void;
};

export function WorkPayoutInviteModal({ open, onAccepted, onCancel }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code !== WORK_PAYOUT_INVITE_CODE) {
      setError('That code doesn’t look right.');
      return;
    }

    acceptWorkPayoutInvite();
    setCode('');
    setError(null);
    onAccepted();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-[#040807]/78 px-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.24 }}
            className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-[#70ffc4]/20 bg-[#07110d]/92 p-5 shadow-[0_32px_100px_rgba(0,0,0,0.58),0_0_70px_rgba(105,245,199,0.16)] backdrop-blur-2xl sm:p-6"
          >
            <motion.div
              className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#69f5c7]/12 blur-3xl"
              animate={{ opacity: [0.28, 0.54, 0.28], scale: [0.96, 1.08, 0.96] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <button
              type="button"
              onClick={onCancel}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#70ffc4]/14 bg-[#142a1f]/60 text-[rgba(236,255,247,0.72)] transition hover:border-[#70ffc4]/34 hover:text-[#ecfff7]"
              aria-label="Close invite code"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative">
              <span className="grid h-12 w-12 place-items-center rounded-[20px] border border-[#70ffc4]/20 bg-[#69f5c7]/10 text-[#69f5c7] shadow-[0_0_34px_rgba(105,245,199,0.14)]">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#69f5c7]">Private beta access</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#ecfff7]">Enter your invite code</h2>
              <p className="mt-3 text-sm leading-6 text-[rgba(236,255,247,0.68)]">
                Work & Payouts is gated for now. Enter your access code to create a payout proof.
              </p>

              <label className="mt-6 block text-sm font-semibold text-[#ecfff7]" htmlFor="work-payout-invite">
                Enter invite code
              </label>
              <div className="relative mt-2">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#69f5c7]" />
                <input
                  id="work-payout-invite"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setError(null);
                  }}
                  autoFocus
                  className="premium-input pl-11 focus:shadow-[0_0_34px_rgba(105,245,199,0.18)]"
                  placeholder="Type your access code"
                />
              </div>

              {error ? (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-2xl border border-red-400/18 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300"
                >
                  {error}
                </motion.p>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <motion.button type="submit" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="primary-button justify-center">
                  Continue
                </motion.button>
                <motion.button type="button" onClick={onCancel} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="secondary-button justify-center">
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
