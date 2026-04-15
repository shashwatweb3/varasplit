'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, CalendarClock, CheckCircle2, ExternalLink, HandCoins, ReceiptText, Sparkles, UserRoundCheck } from 'lucide-react';

import { ErrorBox } from '@/components/ErrorBox';
import { HeaderActions } from '@/components/HeaderActions';
import { InvoiceSeal } from '@/components/InvoiceSeal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ShareButton } from '@/components/ShareButton';
import { StatusBadge } from '@/components/StatusBadge';
import { SuccessToast } from '@/components/SuccessToast';
import { requestActionCenterRefresh } from '@/lib/actionCenter';
import { VARA_EXPLORER_EXTRINSIC_URL } from '@/lib/constants';
import { actorIdToDisplay, addressesEqual, formatTimestamp, formatTvara, parseRouteBigInt, shortAddress } from '@/lib/format';
import { saveRecentWorkPayout } from '@/lib/storage';
import type { ProofInvoice } from '@/lib/types';
import { useWallet } from '@/lib/wallet';
import { claimPayout, getProofByToken } from '@/lib/workPayoutAdapter';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.055 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function parseToken(value: string | undefined) {
  try {
    return parseRouteBigInt(value, 'proof token');
  } catch {
    return null;
  }
}

function displayAddress(address: string) {
  return shortAddress(actorIdToDisplay(address));
}

export default function WorkProofPage() {
  const params = useParams<{ token: string }>();
  const tokenId = parseToken(params.token);
  const wallet = useWallet();
  const [proof, setProof] = useState<ProofInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(tokenId ? null : 'Invalid proof token.');
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    setError(null);
    try {
      const nextProof = await getProofByToken(tokenId);
      setProof(nextProof);
      saveRecentWorkPayout(Number(nextProof.payoutId), nextProof.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Proof record not found.');
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const explorerUrl = proof?.finalizeBlock ? `${VARA_EXPLORER_EXTRINSIC_URL}/${proof.finalizeBlock}-${proof.finalizeExtrinsicIndex}` : null;

  async function handleClaim() {
    if (!tokenId) return;
    setClaiming(true);
    setError(null);
    setSuccess(null);
    try {
      await claimPayout(tokenId);
      setSuccess('Payout claimed.');
      await refresh();
      requestActionCenterRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed.');
    } finally {
      setClaiming(false);
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
          <LoadingSpinner label="Loading proof from contract..." />
        </div>
      </main>
    );
  }

  return (
    <motion.main className="app-shell max-w-[1180px]" initial="hidden" animate="visible" variants={container}>
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

      {proof ? (
        <motion.section variants={item} className="pt-6 lg:pt-8">
          <div className="glass-card ambient-panel relative overflow-hidden p-5 sm:p-6 lg:p-7">
            <div className="grid gap-5 lg:grid-cols-[1.08fr,0.92fr]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">
                      <Sparkles className="h-4 w-4" />
                      VaraSplit payment proof
                    </p>
                    <h1 className="mt-3 text-4xl font-black leading-none tracking-[-0.05em] text-[#ecfff7] sm:text-5xl">{proof.title}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgba(236,255,247,0.72)]">{proof.reason}</p>
                  </div>
                  <InvoiceSeal />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="soft-card p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">Total paid</p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#ecfff7]">{formatTvara(proof.totalAmount)}</p>
                    <p className="mt-1 text-xs font-semibold text-[#69f5c7]">TVARA</p>
                  </div>
                  <div className="soft-card p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">Category</p>
                    <p className="mt-2 flex items-center gap-2 font-bold text-[#ecfff7]">
                      <BriefcaseBusiness className="h-4 w-4 text-[#69f5c7]" />
                      {proof.category}
                    </p>
                  </div>
                  <div className="soft-card p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">Status</p>
                    <div className="mt-2">
                      <StatusBadge label="Verified On-Chain" tone="success" pulse />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="soft-card p-4">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">
                      <UserRoundCheck className="h-4 w-4 text-[#69f5c7]" />
                      Payer
                    </p>
                    <p className="mt-2 font-bold text-[#ecfff7]">{proof.payerName}</p>
                    <p className="mt-1 text-sm text-[rgba(236,255,247,0.72)]">{displayAddress(proof.payerWallet)}</p>
                  </div>
                  <div className="soft-card p-4">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">
                      <CalendarClock className="h-4 w-4 text-[#69f5c7]" />
                      Recorded
                    </p>
                    <p className="mt-2 font-bold text-[#ecfff7]">{formatTimestamp(proof.paidAt)}</p>
                    <p className="mt-1 text-sm text-[rgba(236,255,247,0.72)]">Token #{proof.tokenId.toString()} · Payout #{proof.payoutId.toString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="soft-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#69f5c7]">
                      <ReceiptText className="h-4 w-4" />
                      Recipients
                    </p>
                    <span className="text-xs font-semibold text-[rgba(190,230,214,0.5)]">{proof.recipients.length} recipients</span>
                  </div>
                  <div className="mt-3 grid max-h-[245px] gap-2 overflow-auto pr-1">
                    {proof.recipients.map((recipient) => (
                      <motion.div key={recipient.wallet} whileHover={{ x: 2 }} className="rounded-[20px] border border-[#70ffc4]/12 bg-[#07110d]/55 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[#ecfff7]">{recipient.name}</p>
                            <p className="mt-1 truncate text-xs text-[rgba(190,230,214,0.5)]">{displayAddress(recipient.wallet)}</p>
                          </div>
                          <p className="shrink-0 text-right font-black text-[#ecfff7]">{formatTvara(recipient.amount)} TVARA</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="soft-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#69f5c7]">
                      <HandCoins className="h-4 w-4" />
                      Payout status
                    </p>
                    <span className="text-xs font-semibold text-[rgba(190,230,214,0.5)]">
                      {proof.payouts.filter((payout) => payout.claimed).length}/{proof.payouts.length} claimed
                    </span>
                  </div>
                  <div className="mt-3 grid max-h-[190px] gap-2 overflow-auto pr-1">
                    {proof.payouts.map((payout) => {
                      const recipient = proof.recipients.find((entry) => addressesEqual(entry.wallet, payout.recipient));
                      const isCurrentUser = wallet.selectedAccount ? addressesEqual(wallet.selectedAccount.address, payout.recipient) : false;

                      return (
                        <motion.div key={payout.recipient} whileHover={{ x: 2 }} className="rounded-[20px] border border-[#70ffc4]/12 bg-[#07110d]/55 p-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-bold text-[#ecfff7]">
                                {recipient?.name ?? 'Recipient'}{isCurrentUser ? ' (You)' : ''}
                              </p>
                              <p className="mt-1 truncate text-xs text-[rgba(190,230,214,0.5)]">{displayAddress(payout.recipient)}</p>
                            </div>
                            <div className="shrink-0 text-left sm:text-right">
                              <p className="font-black text-[#ecfff7]">{formatTvara(payout.amount)} TVARA</p>
                              {payout.claimed ? (
                                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#70ffc4]/18 bg-[#69f5c7]/10 px-3 py-1 text-xs font-bold text-[#d8fff0]">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Claimed
                                </span>
                              ) : isCurrentUser ? (
                                <motion.button
                                  type="button"
                                  disabled={claiming}
                                  onClick={handleClaim}
                                  whileHover={{ y: claiming ? 0 : -2 }}
                                  whileTap={{ scale: claiming ? 1 : 0.97 }}
                                  className="primary-button mt-2 px-4 py-2 text-xs"
                                >
                                  <HandCoins className="h-3.5 w-3.5" />
                                  {claiming ? 'Claiming...' : 'Claim Funds'}
                                </motion.button>
                              ) : (
                                <span className="mt-2 inline-flex rounded-full border border-[#70ffc4]/14 bg-[#142a1f]/55 px-3 py-1 text-xs font-bold text-[rgba(236,255,247,0.72)]">
                                  Claimable
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="soft-card p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#69f5c7]">
                    <BadgeCheck className="h-4 w-4" />
                    Proof
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(236,255,247,0.72)]">
                    This record proves the payout was completed through VaraSplit and can be checked on Vara Subscan.
                  </p>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3 border-b border-[#70ffc4]/10 pb-2">
                      <span className="text-[rgba(190,230,214,0.5)]">Block</span>
                      <span className="font-bold text-[#ecfff7]">{proof.finalizeBlock || 'Pending reference'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-[rgba(190,230,214,0.5)]">Extrinsic</span>
                      <span className="font-bold text-[#ecfff7]">{proof.finalizeExtrinsicIndex}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {explorerUrl ? (
                    <a href={explorerUrl} target="_blank" rel="noreferrer" className="primary-button w-full">
                      <ExternalLink className="h-4 w-4" />
                      View on Explorer
                    </a>
                  ) : (
                    <button type="button" disabled className="primary-button w-full">Explorer pending</button>
                  )}
                  <ShareButton title={`VaraSplit proof #${proof.tokenId.toString()}`} text="Permanent on-chain payout proof from VaraSplit." className="w-full" />
                </div>

                <div className="rounded-[24px] border border-[#70ffc4]/16 bg-[#69f5c7]/10 p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#69f5c7]">Verified by VaraSplit</p>
                  <p className="mt-2 text-sm font-semibold text-[#ecfff7]">VaraSplit Verified Record</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      ) : null}
    </motion.main>
  );
}
