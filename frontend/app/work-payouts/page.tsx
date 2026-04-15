'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, Gift, ReceiptText, Sparkles, WalletCards } from 'lucide-react';

import { ActionBanner } from '@/components/ActionBanner';
import { AnimatedCard } from '@/components/AnimatedCard';
import { AnimatedHeroBackground } from '@/components/AnimatedHeroBackground';
import { HeaderActions } from '@/components/HeaderActions';
import { MotionSection } from '@/components/MotionSection';
import { SectionTitle } from '@/components/SectionTitle';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const categories = [
  { title: 'Freelance', copy: 'Pay a contractor and share a clean proof record.', icon: BriefcaseBusiness },
  { title: 'Bounty', copy: 'Reward contributors with a verifiable on-chain record.', icon: Gift },
  { title: 'Salary', copy: 'Create salary payment proof that can be shared later.', icon: WalletCards },
];

export default function WorkPayoutsPage() {
  return (
    <motion.main className="app-shell" initial="hidden" animate="visible" variants={container}>
      <motion.header variants={item} className="top-nav">
        <Link href="/" className="secondary-button px-3 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <HeaderActions />
      </motion.header>

      <motion.section variants={item} className="pt-8">
        <div className="glass-card ambient-panel relative overflow-hidden p-6 sm:p-10 lg:p-14">
          <AnimatedHeroBackground />
          <div className="grid items-center gap-8 lg:grid-cols-[1fr,0.8fr]">
            <div>
              <motion.p
                className="inline-flex items-center gap-2 rounded-full border border-[#70ffc4]/22 bg-[#69f5c7]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#d8fff0]"
                animate={{ boxShadow: ['0 0 0 rgba(105,245,199,0)', '0 0 36px rgba(105,245,199,0.18)', '0 0 0 rgba(105,245,199,0)'] }}
                transition={{ duration: 3.2, repeat: Infinity }}
              >
                <Sparkles className="h-4 w-4 text-[#69f5c7]" />
                Work & Payouts
              </motion.p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-[#ecfff7] sm:text-6xl">
                Pay work. Keep proof.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[rgba(236,255,247,0.72)] sm:text-lg">
                Fund a payout on Vara, close it on-chain, and share a polished record anyone can verify.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/work-payouts/create" className="primary-button w-full sm:w-auto">
                  Create Payout Proof
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/" className="secondary-button w-full sm:w-auto">
                  Split Expenses
                </Link>
              </div>
            </div>

            <motion.div
              className="soft-card p-5"
              animate={{ y: [0, -10, 0], rotate: [0, 0.4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-[20px] bg-[#69f5c7] text-[#03100b] shadow-[0_0_34px_rgba(105,245,199,0.34)]">
                  <ReceiptText className="h-6 w-6" />
                </span>
                <span className="status-pill bg-[#69f5c7]/12 text-[#d8fff0]">
                  <span className="status-dot" />
                  Verified
                </span>
              </div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">Payment proof</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#ecfff7]">Freelance launch design</h2>
              <div className="mt-6 rounded-[24px] border border-[#70ffc4]/14 bg-[#07110d]/60 p-4">
                <p className="text-sm text-[rgba(190,230,214,0.5)]">Total paid</p>
                <p className="mt-1 text-4xl font-black text-[#ecfff7]">420 TVARA</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <MotionSection className="mt-8">
        <SectionTitle
          eyebrow="Use cases"
          title="Designed for real payment proof"
          copy="Keep the blockchain details behind the scenes until someone needs to verify the payment."
          icon={BadgeCheck}
        />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {categories.map(({ title, copy, icon: Icon }) => (
            <AnimatedCard key={title} soft className="p-5">
              <span className="grid h-11 w-11 place-items-center rounded-[18px] border border-[#70ffc4]/18 bg-[#69f5c7]/10 text-[#69f5c7]">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-xl font-bold text-[#ecfff7]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[rgba(236,255,247,0.72)]">{copy}</p>
            </AnimatedCard>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="mt-6">
        <ActionBanner
          eyebrow="How it works"
          title="Create the payout, fund it with attached value, then close the record."
          copy="The proof page is public, shareable, and linked to the explorer reference stored by the contract."
          icon={ReceiptText}
          glow
        />
      </MotionSection>
    </motion.main>
  );
}
