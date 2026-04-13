'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AddExpenseModal } from '@/components/add-expense-modal';
import { InvoiceCard } from '@/components/invoice-card';
import { ShareCard } from '@/components/share-card';
import { WalletConnect } from '@/components/wallet-connect';
import { getAdapter } from '@/lib/adapter';
import { addressesEqual, normalizeAddressKey } from '@/lib/address';
import { configError } from '@/lib/config';
import { clearMemberName, loadMemberNames, saveMemberName, saveRecentGroup } from '@/lib/storage';
import type { GroupSummaryCard, GroupView, SettlementTransfer, WalletAccount } from '@/lib/types';
import { disconnectWalletAccount, getWalletAccounts } from '@/lib/wallet';

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function formatTvara(value: bigint): string {
  const negative = value < BigInt(0);
  const absolute = negative ? value * BigInt(-1) : value;
  const whole = absolute / BigInt(10 ** 12);
  const fraction = absolute % BigInt(10 ** 12);
  const fractionText = fraction.toString().padStart(12, '0').replace(/0+$/, '');
  const formatted = fractionText ? `${whole.toString()}.${fractionText}` : whole.toString();

  return negative ? `-${formatted}` : formatted;
}

function resolveMemberName(address: string, memberNames: Record<string, string>) {
  return memberNames[normalizeAddressKey(address)] || memberNames[address] || shortAddress(address);
}

function describeTransfer(
  transfer: SettlementTransfer,
  memberNames: Record<string, string>,
  currentAddress?: string | null,
) {
  const from = resolveMemberName(transfer.from, memberNames);
  const to = resolveMemberName(transfer.to, memberNames);
  const amount = `${formatTvara(transfer.amount)} TVARA`;

  if (currentAddress && addressesEqual(transfer.from, currentAddress)) {
    return `You owe ${to} ${amount}`;
  }

  if (currentAddress && addressesEqual(transfer.to, currentAddress)) {
    return `${from} owes you ${amount}`;
  }

  return `${from} pays ${to} ${amount}`;
}

function summaryFromTransfers(
  groupName: string,
  transfers: SettlementTransfer[],
  memberNames: Record<string, string>,
): GroupSummaryCard {
  const details = transfers
    .map((transfer) => `${resolveMemberName(transfer.from, memberNames)} paid ${resolveMemberName(transfer.to, memberNames)} ${formatTvara(transfer.amount)} TVARA`)
    .join(' • ');
  const body = transfers.length === 0
    ? `Settled ${groupName} in 1 click. No chaos. VaraSplit.`
    : `Settled ${groupName} in 1 click. No chaos. ${details}. VaraSplit.`;

  return {
    title: groupName,
    body,
    tweetUrl: `https://x.com/intent/tweet?text=${encodeURIComponent(body)}`,
  };
}

export default function GroupPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const groupId = Number(params.id);
  const adapter = useMemo(() => getAdapter(), []);
  const [memberNames, setMemberNames] = useState<Record<string, string>>(() => loadMemberNames());
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | null>(null);
  const [walletDisplayName, setWalletDisplayName] = useState('');
  const [walletState, setWalletState] = useState<'loading' | 'missing' | 'disconnected' | 'ready'>('disconnected');
  const [group, setGroup] = useState<GroupView | null>(null);
  const [settlementPlan, setSettlementPlan] = useState<SettlementTransfer[]>([]);
  const [shareCard, setShareCard] = useState<GroupSummaryCard | null>(null);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [paymentState, setPaymentState] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
  const [paymentToast, setPaymentToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [message, setMessage] = useState<string | null>(configError());
  const [messageType, setMessageType] = useState<'error' | 'success' | null>(configError() ? 'error' : null);

  const myBalance = useMemo(() => {
    if (!group || !selectedAccount) {
      return null;
    }

    return group.balances.find((balance) => addressesEqual(balance.member, selectedAccount.address)) ?? null;
  }, [group, selectedAccount]);

  const isSettled = useMemo(() => {
    return group && group.balances.every((balance) => balance.balance === BigInt(0));
  }, [group]);

  const mySettlementSteps = useMemo(() => {
    if (!selectedAccount) {
      return [];
    }

    return settlementPlan.filter(
      (transfer) =>
        addressesEqual(transfer.from, selectedAccount.address) ||
        addressesEqual(transfer.to, selectedAccount.address),
    );
  }, [selectedAccount, settlementPlan]);

  useEffect(() => {
    if (!paymentToast) {
      return;
    }

    const timeout = window.setTimeout(() => setPaymentToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [paymentToast]);

  function transferKey(transfer: SettlementTransfer) {
    return `${normalizeAddressKey(transfer.from)}-${normalizeAddressKey(transfer.to)}-${transfer.amount.toString()}`;
  }

  async function handlePayTransfer(transfer: SettlementTransfer) {
    if (!selectedAccount) {
      setPaymentToast({ type: 'error', text: 'Connect a wallet before sending payment.' });
      return;
    }

    if (!addressesEqual(transfer.from, selectedAccount.address)) {
      setPaymentToast({ type: 'error', text: 'Only the sender can pay this settlement step.' });
      return;
    }

    const key = transferKey(transfer);
    setPaymentState((current) => ({ ...current, [key]: 'loading' }));

    try {
      await adapter.paySettlementTransfer(transfer.to, transfer.amount, selectedAccount);
      await adapter.confirmPayment(groupId, transfer.from, transfer.to, transfer.amount, selectedAccount);
      await refreshGroup(selectedAccount);
      setPaymentState((current) => ({ ...current, [key]: 'success' }));
      setPaymentToast({ type: 'success', text: 'Payment confirmed on-chain.' });
    } catch (error) {
      setPaymentState((current) => ({ ...current, [key]: 'error' }));
      setPaymentToast({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to confirm payment.',
      });
    }
  }

  function renderSettlementItem(transfer: SettlementTransfer) {
    const key = transferKey(transfer);
    const isSender = selectedAccount ? addressesEqual(transfer.from, selectedAccount.address) : false;
    const status = paymentState[key] ?? 'idle';
    const isDisabled = walletState !== 'ready' || status === 'loading' || status === 'success';

    return (
      <motion.div
        layout
        key={key}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="rounded-2xl border border-white/5 bg-[#0b1220] p-4 hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-400">{describeTransfer(transfer, memberNames, selectedAccount?.address)}</p>
          {isSender ? (
            <button
              type="button"
              onClick={() => handlePayTransfer(transfer)}
              disabled={isDisabled}
              className="rounded-full bg-green-400 px-4 py-2 text-xs font-semibold text-black hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending...' : status === 'success' ? 'Paid' : 'Pay Now'}
            </button>
          ) : null}
        </div>
      </motion.div>
    );
  }

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

  const refreshGroup = useCallback(async (account = selectedAccount) => {
    setIsLoading(true);
    try {
      const [nextGroup, nextPlan] = await Promise.all([
        adapter.getGroup(groupId, account),
        adapter.getSettlementPlan(groupId, account),
      ]);

      setGroup(nextGroup);
      setSettlementPlan(nextPlan);
      saveRecentGroup(nextGroup.id, nextGroup.name);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load group.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }, [adapter, groupId, selectedAccount]);

  useEffect(() => {
    if (!selectedAccount) return;
    setWalletDisplayName(memberNames[normalizeAddressKey(selectedAccount.address)] ?? selectedAccount.meta.name ?? '');
  }, [selectedAccount, memberNames]);

  function handleWalletDisplayNameChange(name: string) {
    setWalletDisplayName(name);

    if (!selectedAccount) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const key = normalizeAddressKey(selectedAccount.address);
    saveMemberName(key, trimmed);
    setMemberNames((current) => ({ ...current, [key]: trimmed }));
  }

  useEffect(() => {
    refreshGroup().catch(() => null);
  }, [refreshGroup]);

  async function handleAddExpense(payload: { payer: string; amount: bigint; description: string }) {
    if (!selectedAccount) {
      setMessage('Connect a wallet before adding expenses.');
      setMessageType('error');
      return;
    }

    setIsMutating(true);
    setMessage(null);
    setMessageType(null);

    try {
      await adapter.addExpense(
        groupId,
        payload.payer,
        payload.amount,
        payload.description,
        selectedAccount,
      );
      await refreshGroup(selectedAccount);
      setShareCard(null);
      setMessage('Expense added on-chain.');
      setMessageType('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to add expense.');
      setMessageType('error');
    } finally {
      setIsMutating(false);
    }
  }

  async function handleSettle() {
    if (!selectedAccount || !group) {
      setMessage('Connect a wallet before settling.');
      setMessageType('error');
      return;
    }

    setIsMutating(true);
    setMessage(null);
    setMessageType(null);

    try {
      const settlement = await adapter.settleGroup(groupId, selectedAccount);
      await refreshGroup(selectedAccount);
      setShareCard(summaryFromTransfers(group.name, settlement.transfers, memberNames));
      setMessage('Group settled on-chain.');
      setMessageType('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to settle group.');
      setMessageType('error');
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-6">
      {paymentToast ? (
        <div
          className={`fixed right-4 top-4 z-50 rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_60px_rgba(0,0,0,0.28)] ${
            paymentToast.type === 'success'
              ? 'border-emerald-300/30 bg-emerald-300/12 text-emerald-100'
              : 'border-rose-300/30 bg-rose-300/12 text-rose-100'
          }`}
        >
          {paymentToast.text}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-sm text-slate-400">
          Back
        </Link>
        <p className="text-sm uppercase tracking-[0.26em] text-slate-400">
          Live Vara
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
        <WalletConnect
          isLoading={isMutating}
          accounts={accounts}
          selectedAccount={selectedAccount}
          walletState={walletState}
          onConnect={connectWallet}
          onDisconnect={handleDisconnect}
          onSelect={setSelectedAccount}
          walletDisplayName={walletDisplayName}
          onWalletDisplayNameChange={handleWalletDisplayNameChange}
        />
      </motion.div>

      {message ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            messageType === 'success'
              ? 'border-green-400/30 bg-[#0b1220] text-green-100'
              : 'border-white/5 bg-[#0b1220] text-slate-400'
          }`}
        >
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr,0.7fr]">
          {[0, 1].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-2xl bg-[#0b1220]" />
          ))}
        </div>
      ) : group ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-[1.3fr,0.7fr]">
            <motion.div
              layout
              className="rounded-2xl border border-white/5 bg-[#0b1220] p-6 shadow-lg hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]"
            >
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Group</p>
              <h1 className="mt-3 text-4xl font-bold text-gray-200">{group.name}</h1>
              <p className="mt-2 text-sm text-slate-400">{group.members.length} members</p>

              {myBalance ? (
                <motion.div
                  layout
                  className="mt-6 rounded-2xl border border-white/5 bg-[#0b1220] p-4 shadow-lg"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Balance
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-200">
                    {myBalance.balance === BigInt(0)
                      ? 'You are settled'
                      : myBalance.balance > BigInt(0)
                        ? `You are owed ${formatTvara(myBalance.balance)} TVARA overall`
                        : `You owe ${formatTvara(myBalance.balance * BigInt(-1))} TVARA overall`}
                  </p>
                </motion.div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-2">
                {group.members.map((member) => (
                  <span key={member} className="rounded-full border border-green-400 bg-transparent px-3 py-2 text-xs text-green-400">
                    {resolveMemberName(member, memberNames)}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsExpenseOpen(true)}
                  disabled={walletState !== 'ready'}
                  className="rounded-full bg-green-400 px-5 py-4 text-sm font-semibold text-black hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow disabled:opacity-50"
                >
                  Add Expense
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleSettle}
                  disabled={walletState !== 'ready' || isMutating}
                  className="rounded-full border border-green-400 bg-transparent px-5 py-4 text-sm font-semibold text-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow disabled:opacity-50"
                >
                  {isMutating ? 'Settling...' : 'Settle All'}
                </motion.button>
                {isSettled && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setIsInvoiceOpen(true)}
                    className="rounded-full border border-green-400 bg-transparent px-5 py-4 text-sm font-semibold text-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] transition-shadow"
                  >
                    View Invoice
                  </motion.button>
                )}
              </div>
            </motion.div>

            <motion.div layout className="rounded-2xl border border-white/5 bg-[#0b1220] p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Settlement Plan</p>
              <div className="mt-5 space-y-3">
                <AnimatePresence mode="popLayout">
                  {mySettlementSteps.length ? (
                    mySettlementSteps.map(renderSettlementItem)
                  ) : settlementPlan.length ? (
                    settlementPlan.map(renderSettlementItem)
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed border-white/5 p-5 text-sm text-slate-400">
                      Nothing left to settle.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </section>

          <section className="mt-4 grid gap-4 md:grid-cols-[0.9fr,1.1fr]">
            <div className="rounded-2xl border border-white/5 bg-[#0b1220] p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Balances</p>
              <div className="mt-5 space-y-3">
                {group.balances.map((balance) => {
                  const positive = balance.balance > BigInt(0);
                  const neutral = balance.balance === BigInt(0);
                  const isCurrentUser = selectedAccount ? addressesEqual(balance.member, selectedAccount.address) : false;
                  const label = isCurrentUser ? 'You' : resolveMemberName(balance.member, memberNames);

                  return (
                    <motion.div layout key={balance.member} className="rounded-2xl border border-white/5 bg-[#0b1220] p-4 hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
                      <p className={`mt-2 text-sm ${neutral ? 'text-slate-400' : positive ? 'text-green-400' : 'text-red-400'}`}>
                        {neutral
                          ? 'Settled'
                          : isCurrentUser && positive
                            ? `You are owed ${formatTvara(balance.balance)} TVARA overall`
                            : isCurrentUser
                              ? `You owe ${formatTvara(balance.balance * BigInt(-1))} TVARA overall`
                              : positive
                                ? `${label} should receive ${formatTvara(balance.balance)} TVARA overall`
                                : `${label} owes ${formatTvara(balance.balance * BigInt(-1))} TVARA overall`}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0b1220] p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Expenses</p>
              <div className="mt-5 space-y-3">
                <AnimatePresence mode="popLayout">
                  {group.expenses.length ? (
                    group.expenses.map((expense, index) => (
                      <motion.div
                        layout
                        key={`${expense.description}-${expense.createdAt}-${index}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="rounded-2xl border border-white/5 bg-[#0b1220] p-4 hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-gray-200">{expense.description}</p>
                            <p className="mt-1 text-sm text-slate-400">{resolveMemberName(expense.payer, memberNames)} paid</p>
                          </div>
                          <p className="text-2xl font-semibold text-gray-200">
                            {formatTvara(expense.amount)} TVARA
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/5 p-5 text-sm text-slate-400">
                      No expenses yet. Add the first one.
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {shareCard ? (
            <section className="mt-4">
              <ShareCard card={shareCard} />
            </section>
          ) : null}
        </>
      ) : null}

      <AddExpenseModal
        open={isExpenseOpen}
        members={group?.members ?? []}
        memberNames={memberNames}
        loading={isMutating}
        onClose={() => setIsExpenseOpen(false)}
        onSubmit={handleAddExpense}
      />

      {isInvoiceOpen && group && (
        <InvoiceCard
          group={group}
          settlementPlan={settlementPlan}
          memberNames={memberNames}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}
    </main>
  );
}
