'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { getAdapter } from '@/lib/adapter';
import { isValidWalletAddress, normalizeAddressKey } from '@/lib/address';
import { configError } from '@/lib/config';
import { clearMemberName, loadMemberNames, saveRecentGroup, saveMemberName } from '@/lib/storage';
import type { WalletAccount } from '@/lib/types';
import { disconnectWalletAccount, getWalletAccounts } from '@/lib/wallet';
import { WalletConnect } from '@/components/wallet-connect';

export default function CreateGroupPage() {
  const router = useRouter();
  const adapter = useMemo(() => getAdapter(), []);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<{ name: string; address: string }[]>(() => [
    { name: '', address: '' },
    { name: '', address: '' },
  ]);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | null>(null);
  const [walletDisplayName, setWalletDisplayName] = useState('');
  const [bulkAddresses, setBulkAddresses] = useState('');
  const [walletState, setWalletState] = useState<'loading' | 'missing' | 'disconnected' | 'ready'>('disconnected');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(configError());

  async function connectWallet() {
    setWalletState('loading');
    const { accounts: found, status } = await getWalletAccounts();
    setAccounts(found);

    if (status !== 'ready') {
      setSelectedAccount(null);
      setWalletState(status);
      return;
    }

    const nextAccount = found[0];
    setSelectedAccount(nextAccount);
    setWalletState('ready');
  }

  function handleDisconnect() {
    if (selectedAccount) {
      clearMemberName(normalizeAddressKey(selectedAccount.address));
    }

    disconnectWalletAccount();
    setSelectedAccount(null);
    setAccounts([]);
    setWalletDisplayName('');
    setWalletState('disconnected');
    setMessage('Wallet disconnected.');
    router.push('/');
  }

  useEffect(() => {
    if (!selectedAccount) return;

    const storedNames = loadMemberNames();
    setWalletDisplayName(storedNames[normalizeAddressKey(selectedAccount.address)] ?? selectedAccount.meta.name ?? '');
  }, [selectedAccount]);

  function handleWalletDisplayNameChange(name: string) {
    setWalletDisplayName(name);

    if (!selectedAccount) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    saveMemberName(normalizeAddressKey(selectedAccount.address), trimmed);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!selectedAccount) {
      setMessage('Connect a wallet first.');
      return;
    }

    if (!groupName.trim()) {
      setMessage('Group name is required.');
      return;
    }

    const bulkMemberAddresses = bulkAddresses
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    const manualMemberAddresses = members.map((member) => member.address.trim()).filter(Boolean);
    const submittedAddresses = [selectedAccount.address, ...manualMemberAddresses, ...bulkMemberAddresses];
    const memberAddresses = Array.from(new Set(submittedAddresses));

    if (memberAddresses.length < 2) {
      setMessage('Add at least one other member address.');
      return;
    }

    if (submittedAddresses.length !== memberAddresses.length) {
      setMessage('Duplicate wallet addresses found. Each member should appear once.');
      return;
    }

    const invalid = memberAddresses.find((address) => !isValidWalletAddress(address));
    if (invalid) {
      setMessage(`Invalid address: ${invalid}`);
      return;
    }

    // Save member names
    if (walletDisplayName.trim()) {
      saveMemberName(normalizeAddressKey(selectedAccount.address), walletDisplayName.trim());
    } else if (selectedAccount.meta.name) {
      saveMemberName(normalizeAddressKey(selectedAccount.address), selectedAccount.meta.name);
    }
    members.forEach((member) => {
      if (member.address.trim() && member.name.trim()) {
        saveMemberName(normalizeAddressKey(member.address.trim()), member.name.trim());
      }
    });

    setIsSubmitting(true);

    try {
      const group = await adapter.createGroup(groupName.trim(), memberAddresses, selectedAccount);
      saveRecentGroup(group.id, group.name);
      router.push(`/group/${group.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create group.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <WalletConnect
          isLoading={isSubmitting}
          accounts={accounts}
          selectedAccount={selectedAccount}
          walletState={walletState}
          onConnect={connectWallet}
          onDisconnect={handleDisconnect}
          onSelect={setSelectedAccount}
          walletDisplayName={walletDisplayName}
          onWalletDisplayNameChange={handleWalletDisplayNameChange}
        />

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-white/5 bg-[#0b1220] p-6 shadow-lg"
        >
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Create Group</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-200">Start in under a minute</h1>

          <label className="mt-6 block">
            <span className="mb-2 block text-sm text-slate-400">Group name</span>
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Goa trip, flatmates, team lunch..."
              className="w-full rounded-2xl border border-white/5 bg-[#0b1220] px-4 py-3 text-gray-200 outline-none"
            />
          </label>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Group members</span>
              <button
                type="button"
                onClick={() => setMembers((current) => [...current, { name: '', address: '' }])}
                className="text-sm text-green-400"
              >
                Add member
              </button>
            </div>

            {members.map((member, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={member.name || ''}
                  onChange={(event) => {
                    const nextMembers = [...members];
                    nextMembers[index] = { ...nextMembers[index], name: event.target.value };
                    setMembers(nextMembers);
                  }}
                  placeholder="Name (e.g., Alice)"
                  className="flex-1 rounded-2xl border border-white/5 bg-[#0b1220] px-4 py-3 text-gray-200 outline-none"
                />
                <input
                  value={member.address || ''}
                  onChange={(event) => {
                    const nextMembers = [...members];
                    nextMembers[index] = { ...nextMembers[index], address: event.target.value };
                    setMembers(nextMembers);
                  }}
                  placeholder="Wallet address"
                  className="flex-1 rounded-2xl border border-white/5 bg-[#0b1220] px-4 py-3 text-gray-200 outline-none"
                />
              </div>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm text-slate-400">Paste multiple addresses</span>
            <textarea
              value={bulkAddresses}
              onChange={(event) => setBulkAddresses(event.target.value)}
              placeholder="Paste wallet addresses separated by commas or new lines"
              rows={4}
              className="w-full rounded-2xl border border-white/5 bg-[#0b1220] px-4 py-3 text-gray-200 outline-none"
            />
          </label>

          <p className="mt-4 text-sm text-slate-400">
            Your connected wallet is auto-added automatically, duplicate members are blocked, and every address is validated before the transaction is sent.
          </p>

          {message ? (
            <div className="mt-4 rounded-2xl border border-white/5 bg-[#0b1220] px-4 py-3 text-sm text-slate-400">
              {message}
            </div>
          ) : null}

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting || walletState !== 'ready'}
            className="mt-6 w-full rounded-full bg-green-400 px-5 py-4 text-base font-semibold text-black hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Group'}
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}
