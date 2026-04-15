'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, RefreshCw, Wallet } from 'lucide-react';

import { shortAddress } from '@/lib/format';
import { connectWallet, disconnectWallet, loadWalletAccounts, selectWalletAccount, useWallet } from '@/lib/wallet';

import { WalletModal } from './WalletModal';

export function WalletButton() {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);

  async function handleConnect() {
    await connectWallet();
    setOpen(true);
  }

  const loading = wallet.status === 'connecting';

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {wallet.isConnected && wallet.selectedAccount ? (
          <>
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-[20px] border border-[#70ffc4]/25 bg-[#69f5c7]/10 px-3 py-2 text-sm font-semibold text-[#ecfff7] shadow-[0_12px_34px_rgba(105,245,199,0.13)]"
            >
              <span className="h-2 w-2 rounded-full bg-[#69f5c7] shadow-[0_0_16px_rgba(125,255,212,0.9)]" />
              {wallet.selectedAccount.meta.name || shortAddress(wallet.selectedAccount.address)}
            </motion.button>
            <motion.button type="button" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => setOpen(true)} className="secondary-button px-3 py-2 text-sm">
              <RefreshCw className="h-4 w-4" />
              Switch
            </motion.button>
            <motion.button type="button" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={disconnectWallet} className="secondary-button px-3 py-2 text-sm">
              <LogOut className="h-4 w-4" />
              Disconnect
            </motion.button>
          </>
        ) : (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConnect}
            disabled={loading}
            className="primary-button px-4 py-2 text-sm"
          >
            <Wallet className="h-4 w-4" />
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </motion.button>
        )}
      </div>
      <WalletModal
        open={open}
        accounts={wallet.availableAccounts}
        loading={loading}
        error={wallet.error}
        onClose={() => setOpen(false)}
        onRefresh={loadWalletAccounts}
        onSelect={(account) => {
          selectWalletAccount(account).then(() => setOpen(false));
        }}
      />
    </>
  );
}
