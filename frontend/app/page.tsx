'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Bell, BriefcaseBusiness, FileCheck2, LockKeyhole, ReceiptText, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';

import { ActionBanner } from '@/components/ActionBanner';
import { AnimatedCard } from '@/components/AnimatedCard';
import { AnimatedHeroBackground } from '@/components/AnimatedHeroBackground';
import { HeaderActions } from '@/components/HeaderActions';
import { MotionSection } from '@/components/MotionSection';
import { SectionTitle } from '@/components/SectionTitle';
import { SummaryStatCard } from '@/components/SummaryStatCard';
import { WorkPayoutInviteModal } from '@/components/WorkPayoutInviteModal';
import { useActionCenter } from '@/lib/actionCenter';
import { PROGRAM_ID, VARA_RPC } from '@/lib/constants';
import { useWallet } from '@/lib/wallet';
import { hasWorkPayoutInviteAccess } from '@/lib/workPayoutInvite';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

const steps = [
  { icon: WalletCards, title: 'Add expenses', copy: 'Create a group and record who paid for what.' },
  { icon: LockKeyhole, title: 'Fund safely', copy: 'VaraSplit turns shared costs into one clean payment plan.' },
  { icon: FileCheck2, title: 'Keep proof', copy: 'The final record stays available from the contract.' },
];

export default function HomePage() {
  const router = useRouter();
  const wallet = useWallet();
  const {
    counts,
    loading: actionsLoading,
    error: actionsError,
    refresh: refreshActions,
    hasKnownRecords,
    hasCheckedKnownRecords,
  } = useActionCenter(wallet.selectedAccount);
  const actionCount = counts.pending;
  const [inviteOpen, setInviteOpen] = useState(false);

  function openPayoutCreate() {
    if (hasWorkPayoutInviteAccess()) {
      router.push('/work-payouts/create');
      return;
    }

    setInviteOpen(true);
  }

  return (
    <motion.main className="app-shell" initial="hidden" animate="visible" variants={container}>
      <WorkPayoutInviteModal
        open={inviteOpen}
        onAccepted={() => {
          setInviteOpen(false);
          router.push('/work-payouts/create');
        }}
        onCancel={() => setInviteOpen(false)}
      />
      <motion.header variants={item} className="top-nav">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[20px] bg-[#69f5c7] text-lg font-black text-[#03100b] shadow-[0_0_34px_rgba(105,245,199,0.34)]">
            VS
          </span>
          <span>
            <span className="block text-sm font-bold text-[#ecfff7]">VaraSplit</span>
            <span className="block text-xs text-[rgba(190,230,214,0.5)]">split and payout proofs</span>
          </span>
        </Link>
        <HeaderActions />
      </motion.header>

      <motion.section variants={item} className="pt-8 lg:pt-14">
        <div className="glass-card ambient-panel relative mx-auto max-w-[980px] overflow-hidden p-6 text-center sm:p-10 lg:p-14">
          <AnimatedHeroBackground />
          <div className="relative mx-auto max-w-4xl">
            <motion.div
              className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-[#70ffc4]/22 bg-[#69f5c7]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#d8fff0]"
              animate={{ boxShadow: ['0 0 0 rgba(105,245,199,0)', '0 0 36px rgba(105,245,199,0.18)', '0 0 0 rgba(105,245,199,0)'] }}
              transition={{ duration: 3.4, repeat: Infinity }}
            >
              <Sparkles className="h-4 w-4 text-[#69f5c7]" />
              Simple shared expenses
            </motion.div>

            <motion.h1 variants={item} className="mx-auto max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-[#ecfff7] sm:text-6xl lg:text-7xl">
              Split costs. Prove payments.
            </motion.h1>
            <motion.p variants={item} className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[rgba(236,255,247,0.72)] sm:text-lg">
              No confusion. No screenshots. Track, pay, claim, and share one clean proof.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link href="/create" className="primary-button w-full sm:w-auto">
                  Create Group
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <button type="button" onClick={openPayoutCreate} className="secondary-button w-full sm:w-auto">
                  Create Payout Proof
                  <ReceiptText className="h-4 w-4" />
                </button>
              </motion.div>
            </motion.div>

            <motion.div variants={item} className="mx-auto mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
              {['Track costs', 'Pay safely', 'Share proof'].map((label) => (
                <div key={label} className="rounded-full border border-[#70ffc4]/14 bg-[#07110d]/55 px-4 py-3 text-sm font-bold text-[rgba(236,255,247,0.82)]">
                  {label}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {wallet.isConnected ? (
        <MotionSection className="mt-8">
          <SectionTitle
            eyebrow="Your action center"
            title={
              actionCount
                ? `${actionCount} pending item${actionCount === 1 ? '' : 's'}`
                : actionsLoading
                  ? 'Checking contract records'
                  : hasCheckedKnownRecords
                  ? 'Nothing urgent right now'
                  : hasKnownRecords
                    ? 'Checking known records'
                    : 'No known actions yet'
            }
            copy={actionsError || (hasCheckedKnownRecords
              ? 'These cards refresh from live contract reads for your connected wallet.'
              : hasKnownRecords
                ? 'Checking records linked to this wallet.'
                : 'Open a group or payout to track it here. Your recent records will appear automatically once opened.')}
            icon={Bell}
            action={<button type="button" onClick={() => refreshActions()} className="secondary-button">{actionsLoading ? 'Refreshing...' : 'Refresh'}</button>}
          />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <SummaryStatCard label="Pending groups" value={counts.pendingGroups} copy={hasCheckedKnownRecords ? 'Needs your action' : 'Checking contract'} icon={Bell} active={counts.pendingGroups > 0} />
            <SummaryStatCard label="Pending work" value={counts.pendingWork} copy={hasCheckedKnownRecords ? 'Payouts waiting' : 'Checking contract'} icon={BriefcaseBusiness} active={counts.pendingWork > 0} />
            <SummaryStatCard label="Proof Ready" value={counts.proofReady} copy={hasCheckedKnownRecords ? 'Ready to share' : 'Checking contract'} icon={FileCheck2} active={counts.proofReady > 0} />
          </div>
        </MotionSection>
      ) : null}

      <MotionSection className="mt-8">
        <SectionTitle
          eyebrow="Choose your flow"
          title="Two ways to create proof"
          copy="Split a shared bill with friends, or create a formal on-chain payment record for work."
          icon={Sparkles}
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <AnimatedCard className="p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-[20px] border border-[#70ffc4]/18 bg-[#69f5c7]/10 text-[#69f5c7]">
                <WalletCards className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">Split Expenses</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#ecfff7]">Share costs with a group</h2>
                <p className="mt-2 text-sm leading-6 text-[rgba(236,255,247,0.72)]">
                  Add expenses, calculate who pays whom, fund escrow, and keep a verified proof.
                </p>
                <Link href="/create" className="primary-button mt-5 w-full sm:w-auto">
                  Create Group
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-[20px] border border-[#70ffc4]/18 bg-[#69f5c7]/10 text-[#69f5c7]">
                <BriefcaseBusiness className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">Work & Payouts</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#ecfff7]">Pay work and share proof</h2>
                <p className="mt-2 text-sm leading-6 text-[rgba(236,255,247,0.72)]">
                  Fund freelance, bounty, salary, or custom payouts and create a shareable proof.
                </p>
                <button type="button" onClick={openPayoutCreate} className="secondary-button mt-5 w-full sm:w-auto">
                  Create Payout Proof
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </MotionSection>

      <MotionSection className="mt-8">
        <SectionTitle
          eyebrow="How it works"
          title="A calmer way to close shared costs"
          copy="VaraSplit keeps the money flow simple: record costs, fund the plan, then claim what you are owed."
          icon={BadgeCheck}
        />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, copy }) => (
          <AnimatedCard key={title} soft className="p-5">
            <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-[#70ffc4]/18 bg-[#69f5c7]/10 text-[#69f5c7]">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-[#ecfff7]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[rgba(236,255,247,0.72)]">{copy}</p>
          </AnimatedCard>
        ))}
        </div>
      </MotionSection>

      <MotionSection className="mt-6">
        <ActionBanner
          eyebrow="Verified, not remembered"
          title="Payment and proof status reload from contract data."
          copy="You can refresh the page and still see who owes what, who can claim, and where the explorer proof lives."
          icon={ShieldCheck}
          glow
        />
      </MotionSection>

      <motion.section variants={item} className="mt-6">
        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-8 w-8 text-[#69f5c7]" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">Trust layer</p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#ecfff7]">Every important state comes from chain.</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="soft-card p-4 text-sm text-[rgba(236,255,247,0.72)]">
              Program <span className="mt-1 block break-all font-semibold text-[#ecfff7]">{PROGRAM_ID}</span>
            </div>
            <div className="soft-card p-4 text-sm text-[rgba(236,255,247,0.72)]">
              Network <span className="mt-1 block font-semibold text-[#ecfff7]">{VARA_RPC}</span>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.main>
  );
}
