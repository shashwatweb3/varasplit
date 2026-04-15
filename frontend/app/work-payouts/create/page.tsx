'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Plus, Sparkles, Trash2, UserRoundCheck, Wallet } from 'lucide-react';

import { ConnectGuard } from '@/components/ConnectGuard';
import { ErrorBox } from '@/components/ErrorBox';
import { HeaderActions } from '@/components/HeaderActions';
import { SectionTitle } from '@/components/SectionTitle';
import { SuccessToast } from '@/components/SuccessToast';
import { WorkPayoutInviteModal } from '@/components/WorkPayoutInviteModal';
import { requestActionCenterRefresh } from '@/lib/actionCenter';
import { formatTvara, isValidAddress, isValidTvaraInput, parseTvara, shortAddress } from '@/lib/format';
import type { PayoutCategory } from '@/lib/types';
import { useWallet } from '@/lib/wallet';
import { hasWorkPayoutInviteAccess } from '@/lib/workPayoutInvite';
import { createPayout } from '@/lib/workPayoutAdapter';
import { saveRecentWorkPayout } from '@/lib/storage';

type RecipientDraft = {
  name: string;
  wallet: string;
  amount: string;
};

const categories: PayoutCategory[] = ['Freelance', 'Bounty', 'Salary', 'Custom'];

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function CreatePayoutPage() {
  const router = useRouter();
  const wallet = useWallet();
  const [payerName, setPayerName] = useState('');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<PayoutCategory>('Freelance');
  const [recipients, setRecipients] = useState<RecipientDraft[]>([{ name: '', wallet: '', amount: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteChecked, setInviteChecked] = useState(false);
  const [inviteAccepted, setInviteAccepted] = useState(false);

  useEffect(() => {
    setPayerName(wallet.selectedAccount?.meta.name ?? '');
  }, [wallet.selectedAccount?.address, wallet.selectedAccount?.meta.name]);

  useEffect(() => {
    setInviteAccepted(hasWorkPayoutInviteAccess());
    setInviteChecked(true);
  }, []);

  const totalAmount = useMemo(() => {
    try {
      return recipients.reduce((total, recipient) => {
        if (!recipient.amount.trim()) return total;
        return total + parseTvara(recipient.amount);
      }, BigInt(0));
    } catch {
      return BigInt(0);
    }
  }, [recipients]);

  function updateRecipient(index: number, patch: Partial<RecipientDraft>) {
    setRecipients((current) => current.map((recipient, currentIndex) => (currentIndex === index ? { ...recipient, ...patch } : recipient)));
  }

  function addRecipient() {
    setRecipients((current) => [...current, { name: '', wallet: '', amount: '' }]);
  }

  function removeRecipient(index: number) {
    setRecipients((current) => (current.length === 1 ? current : current.filter((_, currentIndex) => currentIndex !== index)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!wallet.selectedAccount) {
      setError('Connect a wallet before creating a payout proof.');
      return;
    }
    if (!payerName.trim()) {
      setError('Add your payer name so the proof reads clearly.');
      return;
    }
    if (!title.trim()) {
      setError('Add a short title for this payout.');
      return;
    }
    if (!reason.trim()) {
      setError('Add a simple reason for the payment.');
      return;
    }

    const cleaned = recipients.map((recipient) => ({
      name: recipient.name.trim(),
      wallet: recipient.wallet.trim(),
      amount: recipient.amount.trim(),
    }));

    const invalid = cleaned.find((recipient) => !recipient.name || !isValidAddress(recipient.wallet) || !recipient.amount);
    if (invalid) {
      setError('Each recipient needs a name, valid Vara address, and amount.');
      return;
    }

    try {
      const parsedRecipients = cleaned.map((recipient) => ({
        name: recipient.name,
        wallet: recipient.wallet,
        amount: parseTvara(recipient.amount),
      }));
      setLoading(true);
      const payout = await createPayout(payerName.trim(), parsedRecipients, title.trim(), reason.trim(), category);
      saveRecentWorkPayout(Number(payout.id), payout.title);
      requestActionCenterRefresh();
      setSuccess(`Payout ${payout.id.toString()} is ready. Opening it now.`);
      await wait(850);
      router.push(`/work-payouts/${payout.id.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payout proof.');
    } finally {
      setLoading(false);
    }
  }

  if (!inviteChecked || !inviteAccepted) {
    return (
      <motion.main className="app-shell max-w-[1080px]" initial="hidden" animate="visible" variants={container}>
        <motion.header variants={item} className="top-nav">
          <Link href="/work-payouts" className="secondary-button px-3 py-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Work & Payouts
          </Link>
          <HeaderActions />
        </motion.header>

        <motion.section variants={item} className="pt-8">
          <div className="glass-card p-6 sm:p-8">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">
              <Sparkles className="h-4 w-4" />
              Invite required
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#ecfff7] sm:text-5xl">Create your payout</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[rgba(236,255,247,0.72)] sm:text-base">
              Enter your invite code to continue into the Work & Payouts create flow.
            </p>
          </div>
        </motion.section>

        <WorkPayoutInviteModal
          open={inviteChecked && !inviteAccepted}
          onAccepted={() => setInviteAccepted(true)}
          onCancel={() => router.replace('/')}
        />
      </motion.main>
    );
  }

  return (
    <motion.main className="app-shell max-w-[1080px]" initial="hidden" animate="visible" variants={container}>
      <motion.header variants={item} className="top-nav">
        <Link href="/work-payouts" className="secondary-button px-3 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Work & Payouts
        </Link>
        <HeaderActions />
      </motion.header>

      <motion.section variants={item} className="pt-8">
        <div className="glass-card p-6 sm:p-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">
            <Sparkles className="h-4 w-4" />
            New proof
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#ecfff7] sm:text-5xl">Create your payout</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[rgba(236,255,247,0.72)] sm:text-base">
            Add who is getting paid, fund the payout later, and VaraSplit will create a shareable proof.
          </p>
        </div>
      </motion.section>

      <motion.form onSubmit={submit} variants={item} className="mt-5 grid gap-5 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="glass-card p-5 sm:p-6">
          <SectionTitle
            eyebrow="Step 1"
            title="Describe the payout"
            copy="Keep it human. The proof page will use this text."
            icon={BriefcaseBusiness}
          />

          <div className="mt-5">
            <ConnectGuard>
              <div className="rounded-[24px] border border-[#70ffc4]/22 bg-[#69f5c7]/10 p-4 text-sm text-[#ecfff7] shadow-[0_0_42px_rgba(105,245,199,0.08)]">
                <p className="flex items-center gap-2 font-semibold">
                  <Wallet className="h-4 w-4 text-[#69f5c7]" />
                  You are the payer
                </p>
                <p className="mt-1 text-[rgba(236,255,247,0.72)]">{wallet.selectedAccount ? shortAddress(wallet.selectedAccount.address) : null}</p>
              </div>
            </ConnectGuard>
          </div>

          <label className="mt-6 block text-sm font-semibold text-[#ecfff7]" htmlFor="payer-name">Payer name</label>
          <input id="payer-name" value={payerName} onChange={(event) => setPayerName(event.target.value)} className="premium-input mt-2" placeholder="Your name or company" />

          <label className="mt-5 block text-sm font-semibold text-[#ecfff7]" htmlFor="title">Payout title</label>
          <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} className="premium-input mt-2" placeholder="Landing page design, March salary, bounty reward" />

          <label className="mt-5 block text-sm font-semibold text-[#ecfff7]" htmlFor="reason">Reason</label>
          <textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} className="premium-input mt-2 min-h-28 resize-none" placeholder="What was this payment for?" />

          <label className="mt-5 block text-sm font-semibold text-[#ecfff7]" htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(event) => setCategory(event.target.value as PayoutCategory)} className="premium-input mt-2">
            {categories.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle
              eyebrow="Step 2"
              title="Add recipients"
              copy="Each recipient needs a Vara wallet address and amount."
              icon={UserRoundCheck}
            />
            <motion.button type="button" onClick={addRecipient} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="secondary-button px-4 py-3 text-sm">
              <Plus className="h-4 w-4" />
              Add
            </motion.button>
          </div>

          <div className="mt-5 grid gap-3">
            <AnimatePresence initial={false}>
              {recipients.map((recipient, index) => {
                const addressValid = recipient.wallet.trim() ? isValidAddress(recipient.wallet) : false;
                return (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    className="soft-card p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-[#ecfff7]">Recipient {index + 1}</p>
                      <button type="button" onClick={() => removeRecipient(index)} className="rounded-full border border-[#70ffc4]/16 p-2 text-[rgba(236,255,247,0.72)] transition hover:border-[#70ffc4]/36 hover:text-[#69f5c7]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <input value={recipient.name} onChange={(event) => updateRecipient(index, { name: event.target.value })} className="premium-input" placeholder="Recipient name" />
                      <input
                        value={recipient.amount}
                        onChange={(event) => {
                          if (isValidTvaraInput(event.target.value)) updateRecipient(index, { amount: event.target.value });
                        }}
                        className="premium-input"
                        inputMode="decimal"
                        placeholder="Amount in TVARA"
                      />
                    </div>
                    <input value={recipient.wallet} onChange={(event) => updateRecipient(index, { wallet: event.target.value })} className="premium-input mt-3" placeholder="Vara wallet address" />
                    <p className={`mt-2 text-xs font-semibold ${addressValid ? 'text-[#69f5c7]' : 'text-[rgba(190,230,214,0.5)]'}`}>
                      {addressValid ? 'Wallet looks ready.' : 'Paste the recipient wallet address.'}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#70ffc4]/16 bg-[#142a1f]/45 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#ecfff7]">
              <CheckCircle2 className="h-4 w-4 text-[#69f5c7]" />
              Total to fund
            </p>
            <p className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#ecfff7]">{formatTvara(totalAmount)} TVARA</p>
            <p className="mt-2 text-xs leading-5 text-[rgba(190,230,214,0.5)]">Funding happens on the payout page with attached value.</p>
          </div>

          <div className="mt-4">
            <ErrorBox message={error} />
            <SuccessToast message={success} />
          </div>

          <motion.button type="submit" disabled={loading} whileHover={{ y: loading ? 0 : -2 }} whileTap={{ scale: loading ? 1 : 0.98 }} className="primary-button mt-6 w-full">
            {loading ? 'Creating proof...' : 'Create Payout Proof'}
          </motion.button>
        </div>
      </motion.form>
    </motion.main>
  );
}
