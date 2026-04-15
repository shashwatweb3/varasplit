'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BadgeCheck, ExternalLink, FileCheck2, HandCoins, ReceiptText, ShieldCheck, Users } from 'lucide-react';

import { ErrorBox } from '@/components/ErrorBox';
import { HeaderActions } from '@/components/HeaderActions';
import { InvoiceSeal } from '@/components/InvoiceSeal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ShareButton } from '@/components/ShareButton';
import { requestActionCenterRefresh } from '@/lib/actionCenter';
import { VARA_EXPLORER_EXTRINSIC_URL } from '@/lib/constants';
import { claimPayout, getInvoiceByToken } from '@/lib/adapter';
import { formatTimestamp, formatTvara, shortAddress, actorIdToDisplay, addressesEqual } from '@/lib/format';
import { getMemberName, loadMemberNames, saveRecentGroup } from '@/lib/storage';
import type { InvoiceNft } from '@/lib/types';
import { useWallet } from '@/lib/wallet';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function parseToken(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null;
  return BigInt(value);
}

function explorerUrl(block: number, index: number) {
  return `${VARA_EXPLORER_EXTRINSIC_URL}/${block}-${index}`;
}

function memberDisplay(address: string, names: Record<string, string>, currentAddress?: string) {
  const isCurrent = currentAddress ? addressesEqual(currentAddress, address) : false;
  const displayAddress = actorIdToDisplay(address);
  return {
    name: isCurrent ? 'You' : getMemberName(address, names) || 'Member',
    address: shortAddress(displayAddress),
  };
}

function memberInlineLabel(address: string, names: Record<string, string>, currentAddress?: string) {
  const member = memberDisplay(address, names, currentAddress);
  return `${member.name} (${member.address})`;
}

function memberIdentityData(address: string, names: Record<string, string>, currentAddress?: string) {
  const member = memberDisplay(address, names, currentAddress);
  return {
    ...member,
    isCurrent: currentAddress ? addressesEqual(currentAddress, address) : false,
  };
}

function MemberIdentity({
  address,
  names,
  currentAddress,
}: {
  address: string;
  names: Record<string, string>;
  currentAddress?: string;
}) {
  const member = memberDisplay(address, names, currentAddress);
  return (
    <span className="block min-w-0">
      <span className="block truncate font-bold text-[#ecfff7]">{member.name}</span>
      <span className="mt-1 block truncate text-sm font-medium text-[rgba(190,230,214,0.5)]">{member.address}</span>
    </span>
  );
}

export default function InvoicePage() {
  const params = useParams<{ token: string }>();
  const token = parseToken(params.token);
  const wallet = useWallet();
  const [invoice, setInvoice] = useState<InvoiceNft | null>(null);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(token ? null : 'Invalid proof token.');
  const parties = useMemo(() => {
    if (!invoice) return [];
    return Array.from(new Set([
      ...invoice.transfers.flatMap((transfer) => [transfer.from, transfer.to]),
      ...invoice.payouts.map((payout) => payout.creditor),
    ]));
  }, [invoice]);

  useEffect(() => {
    setMemberNames(loadMemberNames());
    if (!token) return;
    let mounted = true;

    getInvoiceByToken(token)
      .then((data) => {
        if (!mounted) return;
        setInvoice(data);
        saveRecentGroup(Number(data.groupId), `Group #${data.groupId.toString()}`);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Proof record not found.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleClaim() {
    if (!invoice) return;
    setClaiming(true);
    setError(null);
    try {
      await claimPayout(invoice.tokenId);
      const nextInvoice = await getInvoiceByToken(invoice.tokenId);
      setInvoice(nextInvoice);
      requestActionCenterRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to claim funds.');
    } finally {
      setClaiming(false);
    }
  }

  return (
    <motion.main className="app-shell max-w-[1180px]" initial="hidden" animate="visible" variants={container}>
      <motion.header variants={item} className="top-nav">
        <Link href="/" className="secondary-button px-3 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <HeaderActions />
      </motion.header>

      <motion.div variants={item} className="mt-8 space-y-4">
        {loading ? <LoadingSpinner label="Loading proof from contract" /> : null}
        <ErrorBox message={error} />
      </motion.div>

      {invoice ? (
        <motion.section variants={container} className="mt-5 grid gap-4 xl:grid-cols-[0.92fr,1.08fr]">
          <motion.div variants={item} className="glass-card ambient-panel overflow-hidden p-5 sm:p-6">
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <motion.span
                    className="status-pill bg-[#69f5c7]/12 text-[#d8fff0]"
                    animate={{ boxShadow: ['0 0 0 rgba(105,245,199,0)', '0 0 42px rgba(105,245,199,0.24)', '0 0 0 rgba(105,245,199,0)'] }}
                    transition={{ duration: 2.8, repeat: Infinity }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span className="status-dot" />
                    Verified On-Chain
                  </motion.span>
                  <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">
                    <FileCheck2 className="h-4 w-4" />
                    VaraSplit record
                  </p>
                  <h1 className="mt-1 text-4xl font-black tracking-[-0.05em] text-[#ecfff7] sm:text-5xl">Proof #{invoice.tokenId.toString()}</h1>
                </div>
                <InvoiceSeal />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1.15fr,0.85fr]">
                <div className="soft-card p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">Total closed</p>
                  <motion.p
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 240, damping: 18 }}
                    className="mt-2 text-4xl font-black tracking-[-0.05em] text-[#ecfff7]"
                  >
                    {formatTvara(invoice.totalSettled)}
                  </motion.p>
                  <p className="mt-1 text-sm font-bold text-[#d8fff0]">TVARA recorded</p>
                </div>
                <div className="grid gap-3">
                  <div className="soft-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[rgba(190,230,214,0.5)]">Group</p>
                    <Link href={`/group/${invoice.groupId.toString()}`} className="mt-1 inline-flex text-xl font-black text-[#ecfff7] transition hover:text-[#69f5c7]">#{invoice.groupId.toString()}</Link>
                  </div>
                  <div className="soft-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[rgba(190,230,214,0.5)]">Recorded</p>
                    <p className="mt-1 text-sm font-bold leading-5 text-[#ecfff7]">{formatTimestamp(invoice.settledAt)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {invoice.finalizeBlock > 0 ? (
                  <motion.a
                    href={explorerUrl(invoice.finalizeBlock, invoice.finalizeExtrinsicIndex)}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    className="primary-button"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Explorer
                  </motion.a>
                ) : (
                  <div className="rounded-[20px] border border-[#7dffd4]/25 bg-[#7dffd4]/10 px-4 py-3 text-sm text-[#bcffe5]">
                    Explorer proof unavailable
                  </div>
                )}
                <ShareButton title={`VaraSplit Proof #${invoice.tokenId.toString()}`} text="Permanent on-chain payment proof from VaraSplit." />
              </div>

              <div className="mt-4 rounded-[24px] border border-[#70ffc4]/16 bg-[#07110d]/62 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#69f5c7]">Proof reference</p>
                    <p className="mt-1 text-sm text-[rgba(236,255,247,0.72)]">
                      {invoice.finalizeBlock > 0 ? `Extrinsic ${invoice.finalizeBlock}-${invoice.finalizeExtrinsicIndex}` : 'No explorer reference stored.'}
                    </p>
                  </div>
                  <BadgeCheck className="h-7 w-7 text-[#69f5c7]" />
                </div>
              </div>

              <div className="mt-auto pt-4">
                <div className="rounded-[24px] border border-[#70ffc4]/16 bg-[#69f5c7]/10 p-4 text-center">
                  <motion.div
                    animate={{ boxShadow: ['0 0 20px rgba(105,245,199,0.12)', '0 0 48px rgba(105,245,199,0.26)', '0 0 20px rgba(105,245,199,0.12)'] }}
                    transition={{ duration: 3.5, repeat: Infinity }}
                    className="mx-auto grid h-12 w-12 place-items-center rounded-[18px] bg-[#69f5c7] text-base font-black text-[#03100b]"
                  >
                    VS
                  </motion.div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">Verified by VaraSplit</p>
                  <p className="mt-1 text-sm leading-5 text-[rgba(236,255,247,0.72)]">Permanent on-chain payment proof.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={container} className="grid gap-4">
            <motion.div variants={item} className="glass-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#69f5c7]"><Users className="h-4 w-4" />Parties</p>
                  <h2 className="mt-1 text-xl font-black text-[#ecfff7]">People in this record</h2>
                </div>
                <span className="status-pill bg-[#142a1f]/55 text-[rgba(236,255,247,0.72)]">{parties.length} parties</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {parties.map((party) => {
                  const member = memberIdentityData(party, memberNames, wallet.selectedAccount?.address);
                  return (
                    <div key={party} className={`rounded-[20px] border p-3 ${member.isCurrent ? 'border-[#69f5c7]/35 bg-[#69f5c7]/10' : 'border-[#70ffc4]/13 bg-[#07110d]/62'}`}>
                      <p className="truncate font-bold text-[#ecfff7]">{member.name}</p>
                      <p className="mt-1 truncate text-sm text-[rgba(190,230,214,0.5)]">{member.address}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div variants={item} className="glass-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#69f5c7]"><ReceiptText className="h-4 w-4" />Transfers</p>
                  <h2 className="mt-1 text-xl font-black text-[#ecfff7]">Who paid whom</h2>
                </div>
                <span className="status-pill bg-[#142a1f]/55 text-[rgba(236,255,247,0.72)]">{invoice.transfers.length} rows</span>
              </div>
              <div className="mt-3 max-h-[230px] space-y-2 overflow-auto pr-1">
                {invoice.transfers.map((transfer, index) => (
                  <motion.div
                    key={`${transfer.from}-${transfer.to}-${transfer.amount}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="soft-card p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="min-w-0 text-sm font-bold text-[#ecfff7]">
                        {memberInlineLabel(transfer.from, memberNames, wallet.selectedAccount?.address)} paid {memberInlineLabel(transfer.to, memberNames, wallet.selectedAccount?.address)}
                      </p>
                      <p className="shrink-0 rounded-full bg-[#69f5c7]/10 px-3 py-1 text-sm font-black text-[#d8fff0]">{formatTvara(transfer.amount)} TVARA</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {invoice.payouts.length ? (
              <motion.div variants={item} className="glass-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#69f5c7]"><HandCoins className="h-4 w-4" />Payouts</p>
                    <h2 className="mt-1 text-xl font-black text-[#ecfff7]">Claim status</h2>
                  </div>
                  <span className="status-pill bg-[#142a1f]/55 text-[rgba(236,255,247,0.72)]">{invoice.payouts.filter((payout) => payout.claimed).length}/{invoice.payouts.length} claimed</span>
                </div>
                <div className="mt-3 max-h-[220px] space-y-2 overflow-auto pr-1">
                  {invoice.payouts.map((payout) => {
                    const isCurrentCreditor = wallet.selectedAccount ? addressesEqual(wallet.selectedAccount.address, payout.creditor) : false;
                    const canClaim = !payout.claimed;
                    return (
                      <motion.div
                        key={`${payout.creditor}-${payout.amount}`}
                        layout
                        className={`soft-card p-3 ${isCurrentCreditor && canClaim ? 'border-[#69f5c7]/35 bg-[#69f5c7]/10 shadow-[0_0_48px_rgba(105,245,199,0.1)]' : ''}`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <MemberIdentity address={payout.creditor} names={memberNames} currentAddress={wallet.selectedAccount?.address} />
                            <p className="mt-1 text-sm font-black text-[#ecfff7]">{formatTvara(payout.amount)} TVARA</p>
                          </div>
                          {isCurrentCreditor && canClaim ? (
                            <motion.button
                              type="button"
                              whileHover={{ y: -2, scale: 1.01 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={handleClaim}
                              disabled={claiming}
                              className="primary-button w-full py-3 sm:w-auto"
                            >
                              {claiming ? 'Claiming...' : 'Claim Funds'}
                            </motion.button>
                          ) : (
                            <span className={`status-pill ${canClaim ? 'bg-[#7dffd4]/10 text-[#bcffe5]' : 'bg-[#69f5c7]/12 text-[#d8fff0]'}`}>
                              <span className="status-dot" />
                              {canClaim ? 'Unclaimed' : 'Claimed'}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </motion.div>
        </motion.section>
      ) : null}
    </motion.main>
  );
}
