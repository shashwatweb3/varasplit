'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Plus, Sparkles, Trash2, UserPlus, Users, Wallet } from 'lucide-react';

import { ActionBanner } from '@/components/ActionBanner';
import { ConnectGuard } from '@/components/ConnectGuard';
import { ErrorBox } from '@/components/ErrorBox';
import { HeaderActions } from '@/components/HeaderActions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SectionTitle } from '@/components/SectionTitle';
import { SuccessToast } from '@/components/SuccessToast';
import { requestActionCenterRefresh } from '@/lib/actionCenter';
import { createGroup } from '@/lib/adapter';
import { addressesEqual, isValidAddress, shortAddress } from '@/lib/format';
import { saveMemberName, saveRecentGroup } from '@/lib/storage';
import { useWallet } from '@/lib/wallet';

type MemberDraft = {
  name: string;
  address: string;
};

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function memberState(member: MemberDraft) {
  const trimmed = member.address.trim();
  if (!trimmed) return 'empty';
  return isValidAddress(trimmed) ? 'valid' : 'invalid';
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function CreatePage() {
  const router = useRouter();
  const wallet = useWallet();
  const [name, setName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [members, setMembers] = useState<MemberDraft[]>([{ name: '', address: '' }]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCreatorName(wallet.selectedAccount?.meta.name ?? '');
  }, [wallet.selectedAccount?.address, wallet.selectedAccount?.meta.name]);

  const validMemberCount = useMemo(() => members.filter((member) => memberState(member) === 'valid').length, [members]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!wallet.selectedAccount) {
      setError('Connect a wallet before creating a group.');
      return;
    }
    if (!name.trim()) {
      setError('Name the group so everyone recognizes it later.');
      return;
    }

    const missingAddress = members.find((member) => member.name.trim() && !member.address.trim());
    if (missingAddress) {
      setError(`Add a wallet address for ${missingAddress.name.trim()}.`);
      return;
    }

    const enteredMembers = members.map((member) => member.address.trim()).filter(Boolean);
    const invalidDraft = members.find((member) => member.address.trim() && !isValidAddress(member.address));
    if (invalidDraft) {
      setError(`This address does not look valid: ${invalidDraft.address}`);
      return;
    }

    const nonCreatorMembers = enteredMembers.filter((address) => !addressesEqual(address, wallet.selectedAccount!.address));
    const addresses = [wallet.selectedAccount.address, ...nonCreatorMembers];
    const unique = addresses.reduce<string[]>((acc, address) => {
      if (!acc.some((existing) => addressesEqual(existing, address))) {
        acc.push(address);
      }
      return acc;
    }, []);

    if (unique.length < 2) {
      setError('Add at least one other member address.');
      return;
    }
    if (unique.length !== addresses.length) {
      setError('One address is listed twice. Keep each member unique.');
      return;
    }

    setLoading(true);
    try {
      const groupId = await createGroup(name.trim(), unique);
      saveRecentGroup(Number(groupId), name.trim());
      requestActionCenterRefresh();
      saveMemberName(wallet.selectedAccount.address, creatorName.trim() || wallet.selectedAccount.meta.name || 'You');
      members.forEach((member) => {
        if (member.address.trim() && member.name.trim()) {
          saveMemberName(member.address, member.name);
        }
      });
      setSuccess(`Group ${groupId} is live. Opening it now.`);
      await wait(850);
      router.push(`/group/${groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.main className="app-shell max-w-[920px]" initial="hidden" animate="visible" variants={container}>
      <motion.header variants={item} className="top-nav">
        <Link href="/" className="secondary-button px-3 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <HeaderActions />
      </motion.header>

      <motion.section variants={item} className="pt-8">
        <div className="glass-card p-6 sm:p-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">
            <Sparkles className="h-4 w-4" />
            New split
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#ecfff7] sm:text-5xl">Create your group</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[rgba(236,255,247,0.72)] sm:text-base">
            Start with a group name, add the people sharing costs, and VaraSplit will keep addresses ready for on-chain payments.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Connect wallet', icon: Wallet },
              { label: 'Add friends', icon: Users },
              { label: 'Create group', icon: CheckCircle2 },
            ].map(({ label, icon: Icon }, index) => (
              <div key={label} className="soft-card p-4">
                <Icon className="h-5 w-5 text-[#69f5c7]" />
                <span className="mt-4 block text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">Step {index + 1}</span>
                <p className="mt-2 font-semibold text-[#ecfff7]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.form onSubmit={submit} variants={item} className="mt-5 grid gap-5 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="glass-card p-5 sm:p-6">
          <SectionTitle
            eyebrow="Step 1"
            title="Start with a group name"
            copy="This is the name your friends will recognize when they open the group."
            icon={Sparkles}
          />
          <div className="mt-5">
            <ConnectGuard>
              <div className="rounded-[24px] border border-[#70ffc4]/22 bg-[#69f5c7]/10 p-4 text-sm text-[#ecfff7] shadow-[0_0_42px_rgba(105,245,199,0.08)]">
                <p className="flex items-center gap-2 font-semibold">
                  <Wallet className="h-4 w-4 text-[#69f5c7]" />
                  You
                </p>
                <p className="mt-1 text-[rgba(236,255,247,0.72)]">{wallet.selectedAccount ? shortAddress(wallet.selectedAccount.address) : null}</p>
                <label className="mt-4 block text-sm font-semibold text-[#ecfff7]" htmlFor="creator-name">Your display name</label>
                <input
                  id="creator-name"
                  value={creatorName}
                  onChange={(event) => setCreatorName(event.target.value)}
                  className="premium-input mt-2"
                  placeholder="Your name"
                />
                <p className="mt-2 text-xs leading-5 text-[rgba(190,230,214,0.5)]">Names are friendly labels in your browser. The contract still uses your wallet address.</p>
              </div>
            </ConnectGuard>
          </div>

          <label className="mt-6 block text-sm font-semibold text-[#ecfff7]" htmlFor="name">Group name</label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="premium-input mt-2"
            placeholder="Weekend trip, team lunch, rent"
          />
          <p className="mt-2 text-xs leading-5 text-[rgba(190,230,214,0.5)]">Keep it simple, like “Goa trip” or “Flatmates”.</p>

          <div className="mt-6 rounded-[24px] border border-[#70ffc4]/16 bg-[#142a1f]/45 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#ecfff7]">
              <CheckCircle2 className="h-4 w-4 text-[#69f5c7]" />
              Ready check
            </p>
            <p className="mt-1 text-sm text-[rgba(236,255,247,0.72)]">
              {wallet.isConnected ? 'Wallet connected.' : 'Connect your wallet first.'} {validMemberCount ? `${validMemberCount} invited member${validMemberCount === 1 ? '' : 's'} look valid.` : 'Add at least one other member.'}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">
                <UserPlus className="h-4 w-4" />
                Step 2
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#ecfff7]">Add your group members</h2>
              <p className="mt-1 text-sm text-[rgba(236,255,247,0.72)]">Each person needs a friendly name and a Vara wallet address.</p>
            </div>
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMembers((current) => [...current, { name: '', address: '' }])}
              className="secondary-button px-3 py-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add
            </motion.button>
          </div>

          <div className="mt-5">
            <ActionBanner
              title="Names help people read the app faster."
              copy="They are saved locally for display only. Every payment, deposit, and claim still uses wallet addresses."
              icon={Wallet}
            />
          </div>

          <div className="mt-5 space-y-3">
            <AnimatePresence initial={false}>
              {members.map((member, index) => {
                const state = memberState(member);
                return (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    whileHover={{ y: -2 }}
                    className={`soft-card p-4 ${state === 'valid' ? 'border-[#69f5c7]/35' : state === 'invalid' ? 'border-[#ff7f9b]/35' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-semibold text-[#ecfff7]" htmlFor={`member-${index}`}>Member {index + 1}</label>
                      <span className={`status-pill ${state === 'valid' ? 'bg-[#69f5c7]/10 text-[#d8fff0]' : state === 'invalid' ? 'bg-[#ff7f9b]/10 text-[#ffd5de]' : 'bg-[#142a1f]/55 text-[rgba(236,255,247,0.72)]'}`}>
                        <span className="status-dot" />
                        {state === 'valid' ? 'Valid' : state === 'invalid' ? 'Check address' : 'Waiting'}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[0.75fr,1.25fr]">
                      <input
                        value={member.name}
                        onChange={(event) => {
                          const next = [...members];
                          next[index] = { ...next[index], name: event.target.value };
                          setMembers(next);
                        }}
                        className="premium-input"
                        placeholder="Name"
                        aria-label={`Member ${index + 1} name`}
                      />
                      <input
                        id={`member-${index}`}
                        value={member.address}
                        onChange={(event) => {
                          const next = [...members];
                          next[index] = { ...next[index], address: event.target.value };
                          setMembers(next);
                        }}
                        className="premium-input"
                        placeholder="Vara address"
                      />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[rgba(190,230,214,0.5)]">
                      {state === 'valid' ? 'Ready to add.' : state === 'invalid' ? 'Check the wallet address before creating the group.' : 'Add the address when you are ready.'}
                    </p>
                    {members.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setMembers((current) => current.filter((_, memberIndex) => memberIndex !== index))}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(190,230,214,0.5)] transition hover:text-[#ffd5de]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    ) : null}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="mt-5 space-y-3">
            <ErrorBox message={error} />
            <SuccessToast message={success} />
            {loading ? <LoadingSpinner label="Creating group on-chain" /> : null}
          </div>

          <motion.button
            type="submit"
            whileHover={{ y: loading || !wallet.isConnected ? 0 : -2 }}
            whileTap={{ scale: loading || !wallet.isConnected ? 1 : 0.98 }}
            disabled={loading || !wallet.isConnected}
            className="primary-button mt-5 w-full"
          >
            {loading ? 'Creating...' : 'Create Group On-Chain'}
          </motion.button>
        </div>
      </motion.form>
    </motion.main>
  );
}
