'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BadgeCheck, CheckCircle2, CircleDollarSign, ExternalLink, FileCheck2, HandCoins, ReceiptText, Sparkles, Users, Wallet } from 'lucide-react';

import { ActionBanner } from '@/components/ActionBanner';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBox } from '@/components/ErrorBox';
import { HeaderActions } from '@/components/HeaderActions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProgressPill } from '@/components/ProgressPill';
import { SectionTitle } from '@/components/SectionTitle';
import { StatusBadge } from '@/components/StatusBadge';
import { SuccessToast } from '@/components/SuccessToast';
import { requestActionCenterRefresh } from '@/lib/actionCenter';
import { VARA_EXPLORER_EXTRINSIC_URL } from '@/lib/constants';
import { actorIdToDisplay, addressesEqual, formatTimestamp, formatTvara, parseRouteBigInt, shortAddress } from '@/lib/format';
import { saveRecentWorkPayout } from '@/lib/storage';
import type { ProofInvoice, WorkPayout } from '@/lib/types';
import { useWallet } from '@/lib/wallet';
import { finalizePayout, fundPayout, getPayout, getProof } from '@/lib/workPayoutAdapter';

type TxKind = 'fund' | 'finalize' | null;

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function parseId(value: string | undefined) {
  try {
    return parseRouteBigInt(value, 'payout id');
  } catch {
    return null;
  }
}

function memberAddress(address: string) {
  return shortAddress(actorIdToDisplay(address));
}

export default function WorkPayoutDetailPage() {
  const params = useParams<{ id: string }>();
  const payoutId = parseId(params.id);
  const wallet = useWallet();

  const [payout, setPayout] = useState<WorkPayout | null>(null);
  const [proof, setProof] = useState<ProofInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [txKind, setTxKind] = useState<TxKind>(null);
  const [error, setError] = useState<string | null>(payoutId ? null : 'Invalid payout id.');
  const [success, setSuccess] = useState<string | null>(null);

  const isPayer = useMemo(() => {
    if (!payout || !wallet.selectedAccount) return false;
    return addressesEqual(wallet.selectedAccount.address, payout.payerWallet);
  }, [payout, wallet.selectedAccount]);

  const statusLabel = payout?.completed ? 'Completed' : payout?.funded ? 'Funded' : 'Needs funding';
  const progress = payout?.completed ? 100 : payout?.funded ? 65 : 15;

  const refresh = useCallback(async () => {
    if (!payoutId) return;
    setLoading(true);
    setError(null);
    try {
      const nextPayout = await getPayout(payoutId);
      setPayout(nextPayout);
      saveRecentWorkPayout(Number(nextPayout.id), nextPayout.title);
      try {
        setProof(await getProof(payoutId));
      } catch {
        setProof(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payout.');
    } finally {
      setLoading(false);
    }
  }, [payoutId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleFund() {
    if (!payout || !payoutId) return;
    setTxKind('fund');
    setError(null);
    setSuccess(null);
    try {
      await fundPayout(payoutId, payout.totalAmount);
      setSuccess('Payout funded. You can close and record it now.');
      await refresh();
      requestActionCenterRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Funding failed.');
    } finally {
      setTxKind(null);
    }
  }

  async function handleFinalize() {
    if (!payoutId) return;
    setTxKind('finalize');
    setError(null);
    setSuccess(null);
    try {
      const nextProof = await finalizePayout(payoutId);
      setSuccess('Proof created. Recipients can now claim their funds.');
      setProof(nextProof);
      await refresh();
      requestActionCenterRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Close failed.');
    } finally {
      setTxKind(null);
    }
  }

  if (loading) {
    return (
      <main className="app-shell">
        <div className="top-nav">
          <Link href="/work-payouts" className="secondary-button px-3 py-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Work & Payouts
          </Link>
          <HeaderActions />
        </div>
        <div className="mt-16 flex justify-center">
          <LoadingSpinner label="Loading payout from contract..." />
        </div>
      </main>
    );
  }

  return (
    <motion.main className="app-shell" initial="hidden" animate="visible" variants={container}>
      <motion.header variants={item} className="top-nav">
        <Link href="/work-payouts" className="secondary-button px-3 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Work & Payouts
        </Link>
        <HeaderActions />
      </motion.header>

      <div className="mt-5">
        <ErrorBox message={error} />
        <SuccessToast message={success} />
      </div>

      {!payout ? (
        <motion.section variants={item} className="mt-8">
          <EmptyState title="Payout not found" copy="Check the payout number and try again." icon={ReceiptText} />
        </motion.section>
      ) : (
        <>
          <motion.section variants={item} className="pt-8">
            <div className="glass-card ambient-panel p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">
                    <Sparkles className="h-4 w-4" />
                    Payout #{payout.id.toString()}
                  </p>
                  <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#ecfff7] sm:text-5xl">{payout.title}</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-[rgba(236,255,247,0.72)]">{payout.reason}</p>
                </div>
                <div className="soft-card min-w-[240px] p-5">
                  <StatusBadge label={statusLabel} tone={payout.completed ? 'success' : payout.funded ? 'info' : 'warning'} pulse={!payout.completed} />
                  <p className="mt-5 text-sm text-[rgba(190,230,214,0.5)]">Total payout</p>
                  <p className="mt-1 text-4xl font-black tracking-[-0.04em] text-[#ecfff7]">{formatTvara(payout.totalAmount)} TVARA</p>
                  <div className="mt-5">
                    <ProgressPill value={progress} label="Payout progress" />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section variants={item} className="mt-5 grid gap-5 lg:grid-cols-[0.9fr,1.1fr]">
            <div className="glass-card p-5 sm:p-6">
              <SectionTitle
                eyebrow="Payment plan"
                title="Who gets paid"
                copy="Recipients can claim funds after this payout is closed."
                icon={Users}
              />
              <div className="mt-5 grid gap-3">
                {payout.recipients.map((recipient) => (
                  <motion.div key={recipient.wallet} whileHover={{ x: 2 }} className="soft-card flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#ecfff7]">{recipient.name}</p>
                      <p className="mt-1 truncate text-sm text-[rgba(190,230,214,0.5)]">{memberAddress(recipient.wallet)}</p>
                    </div>
                    <p className="shrink-0 text-right text-lg font-black text-[#ecfff7]">{formatTvara(recipient.amount)} TVARA</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6">
              <SectionTitle
                eyebrow="Next action"
                title={payout.completed ? 'Proof is ready' : payout.funded ? 'Close and record' : 'Fund the payout'}
                copy={payout.completed ? 'Your payment proof is recorded and shareable.' : payout.funded ? 'Close the payout to create claimable funds and a verified record.' : 'Attach the exact total amount to fund this payout.'}
                icon={CircleDollarSign}
              />

              <div className="mt-5 grid gap-3">
                <div className="soft-card p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">Payer</p>
                  <p className="mt-2 font-bold text-[#ecfff7]">{payout.payerName}{isPayer ? ' (You)' : ''}</p>
                  <p className="mt-1 text-sm text-[rgba(236,255,247,0.72)]">{memberAddress(payout.payerWallet)}</p>
                </div>
                <div className="soft-card p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">Created</p>
                  <p className="mt-2 font-bold text-[#ecfff7]">{formatTimestamp(payout.createdAt)}</p>
                </div>
              </div>

              {!wallet.isConnected ? (
                <div className="mt-5">
                  <ActionBanner eyebrow="Wallet needed" title="Connect your wallet to fund or close." copy="Reading payout status does not require a signature." icon={Wallet} />
                </div>
              ) : null}

              {!payout.completed && isPayer ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  {!payout.funded ? (
                    <motion.button type="button" disabled={txKind !== null} onClick={handleFund} whileHover={{ y: txKind ? 0 : -2 }} whileTap={{ scale: txKind ? 1 : 0.98 }} className="primary-button w-full">
                      <HandCoins className="h-4 w-4" />
                      {txKind === 'fund' ? 'Funding...' : `Fund ${formatTvara(payout.totalAmount)} TVARA`}
                    </motion.button>
                  ) : (
                    <motion.button type="button" disabled={txKind !== null} onClick={handleFinalize} whileHover={{ y: txKind ? 0 : -2 }} whileTap={{ scale: txKind ? 1 : 0.98 }} className="primary-button w-full">
                      <CheckCircle2 className="h-4 w-4" />
                      {txKind === 'finalize' ? 'Closing...' : 'Close & Record'}
                    </motion.button>
                  )}
                </div>
              ) : null}

              {payout.completed && proof ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href={`/work-payouts/proof/${proof.tokenId.toString()}`} className="primary-button w-full">
                    <FileCheck2 className="h-4 w-4" />
                    View Proof
                  </Link>
                  {proof.finalizeBlock ? (
                    <a href={`${VARA_EXPLORER_EXTRINSIC_URL}/${proof.finalizeBlock}-${proof.finalizeExtrinsicIndex}`} target="_blank" rel="noreferrer" className="secondary-button w-full">
                      <ExternalLink className="h-4 w-4" />
                      Explorer
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </motion.section>

          {payout.completed ? (
            <motion.section variants={item} className="mt-5">
              <ActionBanner
                eyebrow="Payment complete"
                title="This payout is complete on-chain."
                copy="Recipients can now claim what they are owed from the proof record."
                icon={BadgeCheck}
                glow
              />
            </motion.section>
          ) : null}
        </>
      )}
    </motion.main>
  );
}
