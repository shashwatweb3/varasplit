'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, AlertTriangle, BadgeCheck, Calculator, CheckCircle2, CircleDollarSign, Coins, FileCheck2, HandCoins, ReceiptText, Sparkles, Users } from 'lucide-react';

import { ActionBanner } from '@/components/ActionBanner';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBox } from '@/components/ErrorBox';
import { HeaderActions } from '@/components/HeaderActions';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MemberPill } from '@/components/MemberPill';
import { ProgressPill } from '@/components/ProgressPill';
import { SectionTitle } from '@/components/SectionTitle';
import { SuccessToast } from '@/components/SuccessToast';
import { addExpense, claimPayout, computeSettlement, deposit, finalizeSettlement, getGroup, getInvoice, getSettlementPlan } from '@/lib/adapter';
import { requestActionCenterRefresh } from '@/lib/actionCenter';
import { getDebtors, isGroupFinalized, isGroupFullyFunded } from '@/lib/derived';
import { actorIdToDisplay, addressesEqual, formatTimestamp, formatTvara, isValidTvaraInput, parseRouteBigInt, parseTvara, shortAddress } from '@/lib/format';
import { getMemberName, loadMemberNames, saveRecentGroup } from '@/lib/storage';
import type { Group, InvoiceNft, SettlementTransfer } from '@/lib/types';
import { useWallet } from '@/lib/wallet';

type TxKind = 'add-expense' | 'compute' | 'deposit' | 'finalize' | 'claim' | null;

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
    return parseRouteBigInt(value, 'group id');
  } catch {
    return null;
  }
}

function progressPercent(required: bigint, deposited: bigint) {
  if (required <= BigInt(0)) return 0;
  if (deposited >= required) return 100;
  return Number((deposited * BigInt(100)) / required);
}

function balanceText(balance: bigint) {
  if (balance > BigInt(0)) return `Gets back ${formatTvara(balance)} TVARA`;
  if (balance < BigInt(0)) return `Needs to pay ${formatTvara(-balance)} TVARA`;
  return 'Settled up';
}

function memberDisplay(address: string, names: Record<string, string>, currentAddress?: string) {
  const isCurrent = currentAddress ? addressesEqual(currentAddress, address) : false;
  const displayAddress = actorIdToDisplay(address);
  return {
    name: isCurrent ? 'You' : getMemberName(address, names) || 'Member',
    address: shortAddress(displayAddress),
  };
}

function memberOptionLabel(address: string, names: Record<string, string>, currentAddress?: string) {
  const member = memberDisplay(address, names, currentAddress);
  return `${member.name} - ${member.address}`;
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
  className = '',
}: {
  address: string;
  names: Record<string, string>;
  currentAddress?: string;
  className?: string;
}) {
  const member = memberDisplay(address, names, currentAddress);
  return (
    <span className={`block min-w-0 ${className}`}>
      <span className="block truncate font-bold text-[#ecfff7]">{member.name}</span>
      <span className="mt-1 block truncate text-sm font-medium text-[rgba(190,230,214,0.5)]">{member.address}</span>
    </span>
  );
}

export default function GroupPage() {
  const params = useParams<{ id: string }>();
  const groupId = parseId(params.id);
  const wallet = useWallet();

  const [group, setGroup] = useState<Group | null>(null);
  const [settlementPlan, setSettlementPlan] = useState<SettlementTransfer[]>([]);
  const [invoice, setInvoice] = useState<InvoiceNft | null>(null);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [txKind, setTxKind] = useState<TxKind>(null);
  const [error, setError] = useState<string | null>(groupId ? null : 'Invalid group id.');
  const [success, setSuccess] = useState<string | null>(null);

  const [payer, setPayer] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const refresh = useCallback(async () => {
    if (!groupId) return;
    console.log('Route ID:', params.id);
    console.log('BigInt ID:', BigInt(params.id));
    setLoading(true);
    setError(null);

    try {
      const [nextGroup, nextPlan] = await Promise.all([
        getGroup(groupId),
        getSettlementPlan(groupId),
      ]);

      setGroup(nextGroup);
      saveRecentGroup(Number(nextGroup.id), nextGroup.name);
      setSettlementPlan(nextPlan);
      setPayer((current) => current || nextGroup.members[0] || '');

      try {
        const nextInvoice = await getInvoice(groupId);
        setInvoice(nextInvoice);
      } catch {
        setInvoice(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group from contract.');
    } finally {
      setLoading(false);
    }
  }, [groupId, params.id]);

  useEffect(() => {
    setMemberNames(loadMemberNames());
    refresh().catch(() => null);
  }, [refresh]);

  const finalized = useMemo(() => isGroupFinalized(group, invoice), [group, invoice]);
  const debtors = useMemo(() => (group && !finalized ? getDebtors(group, settlementPlan) : []), [group, finalized, settlementPlan]);
  const fullyFunded = useMemo(() => Boolean(group && !finalized && isGroupFullyFunded(group, settlementPlan)), [group, finalized, settlementPlan]);
  const currentDebtor = useMemo(
    () => wallet.selectedAccount ? debtors.find((debtor) => addressesEqual(wallet.selectedAccount!.address, debtor.address)) : undefined,
    [debtors, wallet.selectedAccount],
  );
  const totalDeposited = useMemo(() => debtors.reduce((total, debtor) => total + debtor.deposited, BigInt(0)), [debtors]);
  const totalRequired = useMemo(() => debtors.reduce((total, debtor) => total + debtor.required, BigInt(0)), [debtors]);
  const displayedTransfers = useMemo(() => (finalized ? invoice?.transfers ?? [] : settlementPlan), [finalized, invoice, settlementPlan]);

  async function runTx(kind: TxKind, action: () => Promise<void>, successMessage: string) {
    setTxKind(kind);
    setError(null);
    setSuccess(null);
    try {
      await action();
      await refresh();
      requestActionCenterRefresh();
      setSuccess(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed.');
    } finally {
      setTxKind(null);
    }
  }

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupId) return;
    if (!wallet.isConnected) {
      setError('Connect a wallet before adding an expense.');
      return;
    }
    if (!payer) {
      setError('Choose who paid.');
      return;
    }
    if (!description.trim()) {
      setError('Add a short note so the group knows what this was for.');
      return;
    }

    let parsedAmount: bigint;
    try {
      parsedAmount = parseTvara(amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid amount.');
      return;
    }

    await runTx('add-expense', async () => {
      await addExpense(groupId, payer, parsedAmount, description.trim());
      setAmount('');
      setDescription('');
    }, 'Expense added from the contract.');
  }

  async function handleCompute() {
    if (!groupId) return;
    await runTx('compute', async () => {
      await computeSettlement(groupId);
    }, 'Payment plan is ready.');
  }

  async function handleDeposit(address: string, remaining: bigint) {
    if (!groupId) return;
    if (!wallet.selectedAccount || !addressesEqual(wallet.selectedAccount.address, address)) {
      setError('Only the debtor can deposit their escrow funds.');
      return;
    }
    await runTx('deposit', async () => {
      await deposit(groupId, remaining);
    }, 'Your escrow payment is recorded on-chain.');
  }

  async function handleFinalize() {
    if (!groupId) return;
    await runTx('finalize', async () => {
      const minted = await finalizeSettlement(groupId);
      setInvoice(minted);
    }, 'Split complete. Proof created.');
  }

  async function handleClaimPayout() {
    if (!invoice) return;
    await runTx('claim', async () => {
      const nextInvoice = await claimPayout(invoice.tokenId);
      setInvoice(nextInvoice);
    }, 'Payout claimed from escrow.');
  }

  if (!groupId) {
    return (
      <main className="app-shell max-w-[920px]">
        <div className="pt-6">
          <ErrorBox message="Invalid group id." />
        </div>
      </main>
    );
  }

  return (
    <motion.main className="app-shell" initial="hidden" animate="visible" variants={container}>
      <motion.header variants={item} className="top-nav">
        <Link href="/" className="secondary-button px-3 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <HeaderActions />
      </motion.header>

      <motion.div variants={item} className="mt-6 space-y-3">
        <ErrorBox message={error} />
        <SuccessToast message={success} />
      </motion.div>

      {loading ? (
        <motion.div variants={item} className="glass-card mt-8 p-6">
          <LoadingSpinner label="Loading fresh contract state" />
        </motion.div>
      ) : group ? (
        <motion.div variants={container} className="mt-8 space-y-5">
          <motion.section variants={item} className="glass-card overflow-hidden p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className={`status-pill ${finalized ? 'bg-[#69f5c7]/12 text-[#d8fff0]' : fullyFunded ? 'bg-[#39d98a]/12 text-[#bcffe5]' : 'bg-[#7dffd4]/10 text-[#bcffe5]'}`}>
                  <span className="status-dot" />
                  {finalized ? 'Complete' : fullyFunded ? 'Ready to close' : 'In progress'}
                </span>
                <p className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#69f5c7]">
                  <Sparkles className="h-4 w-4" />
                  Group #{group.id.toString()}
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#ecfff7] sm:text-5xl">{group.name}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[rgba(236,255,247,0.72)]">
                  {finalized
                    ? 'This split is complete. Payment prompts are closed and the proof is available from chain.'
                    : currentDebtor && currentDebtor.remaining > BigInt(0)
                      ? `You still need to pay ${formatTvara(currentDebtor.remaining)} TVARA.`
                    : fullyFunded
                        ? 'Everyone has funded escrow. Close the group when you are ready.'
                        : 'Add expenses, create the payment plan, then each debtor pays their share into escrow.'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[310px]">
                <div className="soft-card p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">
                    <Users className="h-4 w-4 text-[#69f5c7]" />
                    Members
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#ecfff7]">{group.members.length}</p>
                </div>
                <div className="soft-card p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[rgba(190,230,214,0.5)]">
                    <ReceiptText className="h-4 w-4 text-[#69f5c7]" />
                    Expenses
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#ecfff7]">{group.expenses.length}</p>
                </div>
                {invoice ? (
                  <Link href={`/invoice/${invoice.tokenId.toString()}`} className="primary-button sm:col-span-2">
                    <FileCheck2 className="h-4 w-4" />
                    View Proof #{invoice.tokenId.toString()}
                  </Link>
                ) : null}
              </div>
            </div>
          </motion.section>

          <motion.section variants={item} className="glass-card p-5 sm:p-6">
            <SectionTitle
              eyebrow="Members"
              title="People in this split"
              copy="Names make the group easier to read. Wallet addresses remain the identity used on-chain."
              icon={Users}
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.members.map((member) => {
                const data = memberIdentityData(member, memberNames, wallet.selectedAccount?.address);
                return <MemberPill key={member} name={data.name} address={data.address} isCurrent={data.isCurrent} />;
              })}
            </div>
          </motion.section>

          {!finalized ? (
            <ActionBanner
              eyebrow="Next best step"
              title={
                !group.expenses.length
                  ? 'Add who paid and how much'
                  : !settlementPlan.length
                    ? 'Let VaraSplit calculate who owes what'
                    : fullyFunded
                      ? 'Everyone has funded escrow'
                      : currentDebtor && currentDebtor.remaining > BigInt(0)
                        ? 'Pay your share into escrow'
                        : 'Waiting for remaining payments'
              }
              copy={
                !group.expenses.length
                  ? 'Start by recording the first shared cost. No payment plan is created until you ask for it.'
                  : !settlementPlan.length
                    ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28 }}
                        className="mt-1 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-red-400 shadow-[0_0_28px_rgba(248,113,113,0.12)]"
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          Before you create the plan, make sure every group expense is added. Then VaraSplit will show who pays whom.
                        </span>
                      </motion.div>
                    )
                  : fullyFunded
                      ? 'Close when ready. This creates the permanent proof and opens claiming.'
                      : currentDebtor && currentDebtor.remaining > BigInt(0)
                        ? 'Your payment is sent to the escrow contract with attached TVARA value.'
                        : 'The group is waiting for debtors to finish funding their share.'
              }
              icon={BadgeCheck}
              glow={Boolean(currentDebtor?.remaining || fullyFunded)}
              action={!group.expenses.length ? (
                <a href="#add-expense" className="secondary-button">Add Expense</a>
              ) : !settlementPlan.length ? (
                <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleCompute} disabled={txKind !== null || !wallet.isConnected} className="primary-button">
                  {txKind === 'compute' ? 'Calculating...' : 'Create Payment Plan'}
                </motion.button>
              ) : fullyFunded ? (
                <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleFinalize} disabled={txKind !== null || !wallet.isConnected} className="primary-button">
                  {txKind === 'finalize' ? 'Closing...' : 'Close Group'}
                </motion.button>
              ) : currentDebtor && currentDebtor.remaining > BigInt(0) ? (
                <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleDeposit(currentDebtor.address, currentDebtor.remaining)} disabled={txKind !== null} className="primary-button">
                  {txKind === 'deposit' ? 'Paying...' : `Pay ${formatTvara(currentDebtor.remaining)} TVARA`}
                </motion.button>
              ) : null}
            />
          ) : (
            <motion.section variants={item} className="glass-card ambient-panel border-[#69f5c7]/25 p-6 shadow-[0_0_76px_rgba(105,245,199,0.16)]">
              <div className="relative">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <motion.span
                      className="status-pill bg-[#69f5c7]/12 text-[#d8fff0]"
                      animate={{ boxShadow: ['0 0 0 rgba(105,245,199,0)', '0 0 40px rgba(105,245,199,0.24)', '0 0 0 rgba(105,245,199,0)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <span className="status-dot" />Complete
                    </motion.span>
                    <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-[#ecfff7]">Split complete</h2>
                    <p className="mt-2 text-sm leading-6 text-[rgba(236,255,247,0.72)]">Your proof is permanently recorded on-chain. Payment prompts are closed for this group.</p>
                  </div>
                  {invoice ? <Link href={`/invoice/${invoice.tokenId.toString()}`} className="primary-button"><FileCheck2 className="h-4 w-4" />Open Proof</Link> : null}
                </div>
              </div>
              {invoice?.payouts.length ? (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {invoice.payouts.map((payout, index) => {
                    const isCurrentCreditor = wallet.selectedAccount ? addressesEqual(wallet.selectedAccount.address, payout.creditor) : false;
                    return (
                      <div key={`${payout.creditor}-${index}`} className="soft-card p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2 font-bold text-[#ecfff7]">
                              <HandCoins className="h-4 w-4 text-[#69f5c7]" />
                              <MemberIdentity address={payout.creditor} names={memberNames} currentAddress={wallet.selectedAccount?.address} />
                            </div>
                            <p className="mt-1 text-sm text-[rgba(236,255,247,0.72)]">{formatTvara(payout.amount)} TVARA · {payout.claimed ? 'claimed' : 'unclaimed'}</p>
                          </div>
                          {isCurrentCreditor && !payout.claimed ? (
                            <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleClaimPayout} disabled={txKind !== null} className="primary-button w-full sm:w-auto">
                              {txKind === 'claim' ? 'Claiming...' : 'Claim Funds'}
                            </motion.button>
                          ) : (
                            <span className={`status-pill ${payout.claimed ? 'bg-[#69f5c7]/12 text-[#d8fff0]' : 'bg-[#7dffd4]/10 text-[#bcffe5]'}`}>
                              <span className="status-dot" />
                              {payout.claimed ? 'Claimed' : 'Unclaimed'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </motion.section>
          )}

          {!finalized ? (
            <motion.form id="add-expense" onSubmit={submitExpense} variants={item} className="glass-card p-5 sm:p-6">
              <SectionTitle
                eyebrow="Add expense"
                title="Record who paid"
                copy="Add who covered the cost, how much they paid, and a short note for the group."
                icon={CircleDollarSign}
              />
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <select value={payer} onChange={(event) => setPayer(event.target.value)} className="premium-input">
                  {group.members.map((member) => (
                    <option key={member} value={member}>{memberOptionLabel(member, memberNames, wallet.selectedAccount?.address)}</option>
                  ))}
                </select>
                <input
                  value={amount}
                  onChange={(event) => {
                    const nextAmount = event.target.value;
                    if (isValidTvaraInput(nextAmount)) setAmount(nextAmount);
                  }}
                  inputMode="decimal"
                  placeholder="Amount TVARA"
                  className="premium-input"
                />
                <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What was it for?" className="premium-input" />
                <motion.button type="submit" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={txKind !== null || !wallet.isConnected} className="primary-button">
                  {txKind === 'add-expense' ? 'Adding...' : 'Add Expense'}
                </motion.button>
              </div>
            </motion.form>
          ) : null}

          <motion.section variants={item} className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="glass-card p-5 sm:p-6">
              <SectionTitle
                eyebrow="Expenses"
                title="Activity so far"
                copy="Every item here comes from the group stored on-chain."
                icon={ReceiptText}
              />
              <div className="mt-5 space-y-3">
                {group.expenses.length ? group.expenses.map((expense, index) => (
                  <motion.div key={`${expense.createdAt}-${index}`} layout className="soft-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#ecfff7]">{expense.description}</p>
                        <p className="mt-1 text-sm text-[rgba(190,230,214,0.5)]">Paid by {memberInlineLabel(expense.payer, memberNames, wallet.selectedAccount?.address)} · {formatTimestamp(expense.createdAt)}</p>
                      </div>
                      <p className="rounded-full bg-[#69f5c7]/10 px-3 py-1 text-sm font-bold text-[#d8fff0]">{formatTvara(expense.amount)} TVARA</p>
                    </div>
                  </motion.div>
                )) : (
                  <EmptyState
                    icon={ReceiptText}
                    title="No expenses yet"
                    copy="Add the first shared cost to start building the payment plan."
                  />
                )}
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6">
              <SectionTitle
                eyebrow="Balances"
                title="Current position"
                copy="Positive balances receive money. Negative balances pay into escrow."
                icon={Users}
              />
              <div className="mt-5 space-y-3">
                {group.balances.map((balance) => (
                  <motion.div key={balance.member} layout className="soft-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <MemberIdentity address={balance.member} names={memberNames} currentAddress={wallet.selectedAccount?.address} />
                        <p className="mt-1 text-sm text-[rgba(190,230,214,0.5)]">{balanceText(balance.balance)}</p>
                      </div>
                      <span className={`status-pill ${balance.balance < BigInt(0) ? 'bg-[#7dffd4]/10 text-[#bcffe5]' : balance.balance > BigInt(0) ? 'bg-[#69f5c7]/12 text-[#d8fff0]' : 'bg-[#142a1f]/55 text-[rgba(236,255,247,0.72)]'}`}>
                        <span className="status-dot" />
                        {balance.balance < BigInt(0) ? 'Owes' : balance.balance > BigInt(0) ? 'Receives' : 'Clear'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section variants={item} className="glass-card p-5 sm:p-6">
            <SectionTitle
              eyebrow="Who owes what"
              title={finalized ? 'Completed transfers' : 'Simple payment plan'}
              copy={finalized ? 'This is the final proof record from the contract.' : 'These rows explain who should pay whom before closing the group.'}
              icon={Calculator}
              action={!settlementPlan.length && group.expenses.length && !finalized ? (
                <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleCompute} disabled={txKind !== null || !wallet.isConnected} className="primary-button">
                  {txKind === 'compute' ? 'Calculating...' : 'Create Payment Plan'}
                </motion.button>
              ) : null}
            />

            <div className="mt-5">
              {finalized ? (
                <div className="rounded-[24px] border border-[#69f5c7]/25 bg-[#69f5c7]/10 p-5 text-sm leading-6 text-[#ecfff7] shadow-[0_0_46px_rgba(105,245,199,0.1)]">
                  This split is complete on-chain. Live debtor payments are inactive for this group.
                </div>
              ) : null}
              {displayedTransfers.length ? (
                <div className="space-y-3">
                  {displayedTransfers.map((transfer, index) => {
                    const from = memberDisplay(transfer.from, memberNames, wallet.selectedAccount?.address);
                    const to = memberDisplay(transfer.to, memberNames, wallet.selectedAccount?.address);
                    const isCurrentUser = wallet.selectedAccount
                      ? addressesEqual(wallet.selectedAccount.address, transfer.from) || addressesEqual(wallet.selectedAccount.address, transfer.to)
                      : false;
                    return (
                      <motion.div
                        key={`${transfer.from}-${transfer.to}-${transfer.amount}-${index}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className={`soft-card p-4 ${isCurrentUser ? 'border-[#69f5c7]/30 bg-[#69f5c7]/10' : ''}`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <MemberPill name={from.name} address={from.address} isCurrent={from.name === 'You'} />
                            <ArrowRight className="hidden h-5 w-5 shrink-0 text-[#69f5c7] sm:block" />
                            <MemberPill name={to.name} address={to.address} isCurrent={to.name === 'You'} />
                          </div>
                          <div className="rounded-[22px] border border-[#70ffc4]/16 bg-[#07110d]/70 px-4 py-3 text-right">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgba(190,230,214,0.5)]">Amount</p>
                            <p className="mt-1 text-xl font-black text-[#ecfff7]">{formatTvara(transfer.amount)} TVARA</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-[rgba(236,255,247,0.72)]">
                          {from.name} owes {to.name} {formatTvara(transfer.amount)} TVARA.
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              ) : !finalized ? (
                <EmptyState
                  icon={Calculator}
                  title="No payment plan yet"
                  copy="Add expenses, then create a plan to see who pays whom."
                />
              ) : null}
            </div>
          </motion.section>

          {!finalized ? (
            <motion.section variants={item} className="glass-card p-5 sm:p-6">
              <SectionTitle
                eyebrow="Escrow funding"
                title={totalRequired > BigInt(0) ? `${formatTvara(totalDeposited)} of ${formatTvara(totalRequired)} TVARA funded` : 'No payments needed yet'}
                copy="Debtors fund their share first. Once the group is fully funded, you can close the group."
                icon={Coins}
                action={fullyFunded ? <span className="status-pill bg-[#69f5c7]/12 text-[#d8fff0]"><span className="status-dot" />All paid</span> : null}
              />

              <div className="mt-5 space-y-4">
                {debtors.length ? debtors.map((debtor) => {
                  const isCurrentUser = wallet.selectedAccount ? addressesEqual(wallet.selectedAccount.address, debtor.address) : false;
                  const percent = progressPercent(debtor.required, debtor.deposited);
                  return (
                    <motion.div key={debtor.address} layout className={`soft-card p-4 ${isCurrentUser ? 'border-[#69f5c7]/35 bg-[#69f5c7]/10 shadow-[0_0_48px_rgba(105,245,199,0.1)]' : ''}`}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <MemberIdentity address={debtor.address} names={memberNames} currentAddress={wallet.selectedAccount?.address} />
                            <span className={`status-pill ${debtor.paid ? 'bg-[#69f5c7]/12 text-[#d8fff0]' : 'bg-[#7dffd4]/10 text-[#bcffe5]'}`}>
                              <span className="status-dot" />
                              {debtor.paid ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[rgba(236,255,247,0.72)]">
                            {isCurrentUser && debtor.remaining > BigInt(0)
                              ? `You still need to pay ${formatTvara(debtor.remaining)} TVARA.`
                              : `Deposited ${formatTvara(debtor.deposited)} of ${formatTvara(debtor.required)} TVARA.`}
                          </p>
                          <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            {[
                              ['Required', debtor.required],
                              ['Deposited', debtor.deposited],
                              ['Remaining', debtor.remaining],
                            ].map(([label, value]) => (
                              <div key={label as string} className="rounded-[18px] border border-[#70ffc4]/13 bg-[#07110d]/62 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[rgba(190,230,214,0.5)]">{label as string}</p>
                                <p className="mt-1 text-sm font-black text-[#ecfff7]">{formatTvara(value as bigint)}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4">
                            <ProgressPill value={percent} />
                          </div>
                        </div>
                        {isCurrentUser && debtor.remaining > BigInt(0) ? (
                          <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleDeposit(debtor.address, debtor.remaining)} disabled={txKind !== null} className="primary-button w-full sm:w-auto">
                            {txKind === 'deposit' ? 'Paying...' : `Pay ${formatTvara(debtor.remaining)}`}
                          </motion.button>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                }) : (
                  <EmptyState
                    icon={Coins}
                    title="No escrow payments yet"
                    copy="Create the payment plan first. Then everyone will see exactly how much to pay."
                  />
                )}
              </div>
            </motion.section>
          ) : null}

          {fullyFunded ? (
            <motion.section variants={item} className="glass-card border-[#69f5c7]/25 p-6 shadow-[0_0_62px_rgba(105,245,199,0.12)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="status-pill bg-[#69f5c7]/12 text-[#d8fff0]"><span className="status-dot" />Ready</span>
                  <h2 className="mt-4 flex items-center gap-2 text-2xl font-black tracking-[-0.03em] text-[#ecfff7]">
                    <CheckCircle2 className="h-6 w-6 text-[#69f5c7]" />
                    Close group
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[rgba(236,255,247,0.72)]">All debtor deposits are funded in contract escrow.</p>
                </div>
                <motion.button type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleFinalize} disabled={txKind !== null || !wallet.isConnected} className="primary-button">
                  {txKind === 'finalize' ? 'Closing...' : 'Close Group'}
                </motion.button>
              </div>
            </motion.section>
          ) : null}

          {txKind ? <LoadingSpinner label="Waiting for on-chain transaction" /> : null}
        </motion.div>
      ) : null}
    </motion.main>
  );
}
