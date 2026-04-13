'use client';

import { motion } from 'framer-motion';

import type { WalletAccount } from '@/lib/types';

interface WalletConnectProps {
  isLoading: boolean;
  accounts: WalletAccount[];
  selectedAccount: WalletAccount | null;
  walletState: 'loading' | 'missing' | 'disconnected' | 'ready';
  onConnect: () => Promise<void> | void;
  onSelect: (account: WalletAccount) => void;
  onDisconnect?: () => void;
  walletDisplayName?: string;
  onWalletDisplayNameChange?: (name: string) => void;
}

export function WalletConnect({
  isLoading,
  accounts,
  selectedAccount,
  walletState,
  onConnect,
  onDisconnect,
  onSelect,
  walletDisplayName,
  onWalletDisplayNameChange,
}: WalletConnectProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0b1220] p-4 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Wallet</p>
          <p className="mt-1 text-sm text-slate-400">
            {walletState === 'loading' && 'Checking Vara-compatible extensions'}
            {walletState === 'missing' && 'No supported wallet extension found'}
            {walletState === 'disconnected' && 'Connect a wallet to send transactions'}
            {walletState === 'ready' && selectedAccount
              ? `${selectedAccount.meta.name ?? 'Connected account'} ready`
              : 'Wallet ready'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedAccount && onDisconnect ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onDisconnect}
              className="rounded-full border border-green-400 bg-transparent px-4 py-2 text-sm font-semibold text-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow"
            >
              Disconnect
            </motion.button>
          ) : null}
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onConnect}
            disabled={isLoading}
            className="rounded-full bg-green-400 px-4 py-2 text-sm font-semibold text-black hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow disabled:opacity-50"
          >
            {selectedAccount ? 'Refresh' : 'Connect'}
          </motion.button>
        </div>
      </div>

      {accounts.length > 0 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {accounts.map((account) => {
            const active = selectedAccount?.address === account.address;

            return (
              <motion.button
                whileTap={{ scale: 0.96 }}
                key={account.address}
                type="button"
                onClick={() => onSelect(account)}
                className={`min-w-[180px] rounded-3xl border px-4 py-3 text-left transition hover:scale-105 ${
                  active
                    ? 'border-green-400 bg-green-400/15 text-gray-200 shadow-[0_0_20px_rgba(74,222,128,0.2)]'
                    : 'border-white/5 bg-[#0b1220] text-slate-400 hover:border-green-400/40'
                }`}
              >
                <p className="text-sm font-semibold">{account.meta.name ?? 'Unnamed account'}</p>
                <p className="mt-1 truncate text-xs text-slate-400">{account.address}</p>
              </motion.button>
            );
          })}
        </div>
      ) : null}

      {selectedAccount && onWalletDisplayNameChange ? (
        <label className="mt-4 block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">
            Display Name (Optional)
          </span>
          <input
            value={walletDisplayName ?? ''}
            onChange={(event) => onWalletDisplayNameChange(event.target.value)}
            placeholder={selectedAccount.meta.name ?? 'Your name'}
            className="w-full rounded-2xl border border-white/5 bg-[#0b1220] px-4 py-3 text-sm text-gray-200 outline-none"
          />
        </label>
      ) : null}
    </div>
  );
}
