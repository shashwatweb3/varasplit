'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';

import type { WalletAccount } from '@/lib/types';
import { shortAddress } from '@/lib/format';

type Props = {
  open: boolean;
  accounts: WalletAccount[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onSelect: (account: WalletAccount) => void;
};

export function WalletModal({ open, accounts, loading, error, onClose, onRefresh, onSelect }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-end bg-[#040807]/82 px-4 pb-4 backdrop-blur-md sm:place-items-center sm:pb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="glass-card w-full max-w-lg p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">Wallet access</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#ecfff7]">Choose an account</h2>
                <p className="mt-1 text-sm text-[rgba(236,255,247,0.72)]">This wallet signs VaraSplit actions on Vara testnet.</p>
              </div>
              <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onClose} className="secondary-button px-3 py-2 text-sm">
                <X className="h-4 w-4" />
                Close
              </motion.button>
            </div>

            {error ? <p className="mt-4 rounded-[20px] border border-[#ff7f9b]/30 bg-[#ff7f9b]/10 p-3 text-sm text-[#ffd5de]">{error}</p> : null}

            <div className="mt-5 space-y-3">
              {accounts.map((account, index) => (
                <motion.button
                  key={`${account.meta.source}-${account.address}`}
                  type="button"
                  onClick={() => onSelect(account)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="soft-card w-full p-4 text-left hover:border-[#69f5c7]/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#ecfff7]">{account.meta.name || 'Unnamed account'}</p>
                      <p className="mt-1 text-xs text-[rgba(190,230,214,0.5)]">
                        {shortAddress(account.address)} · {account.meta.source}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-[#69f5c7]" />
                  </div>
                </motion.button>
              ))}
            </div>

            {!accounts.length ? (
              <div className="mt-4 rounded-[22px] border border-[#70ffc4]/14 bg-[#142a1f]/45 p-4 text-sm text-[rgba(236,255,247,0.72)]">
                <ShieldCheck className="mb-3 h-5 w-5 text-[#69f5c7]" />
                Approve access in SubWallet, Polkadot.js, or Talisman to continue.
              </div>
            ) : null}

            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRefresh}
              disabled={loading}
              className="primary-button mt-4 w-full"
            >
              {loading ? 'Checking wallets...' : 'Refresh Wallets'}
            </motion.button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
