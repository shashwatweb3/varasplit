'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { getGroup, getInvoice, getSettlementPlan } from './adapter';
import { getDebtors } from './derived';
import { addressesEqual, formatTvara } from './format';
import { loadRecentGroups, loadRecentWorkPayouts } from './storage';
import type { InvoiceNft, ProofInvoice, WalletAccount } from './types';
import { useWallet } from './wallet';
import { getPayout, getProof } from './workPayoutAdapter';

export const ACTION_CENTER_REFRESH_EVENT = 'varasplit:action-center-refresh';

const READ_ACTIONS_KEY = 'varasplit.action-center.read';
const POLL_MS = 20_000;

export type ActionItemType =
  | 'group_pay'
  | 'group_claim'
  | 'group_proof'
  | 'payout_fund'
  | 'payout_record'
  | 'payout_claim'
  | 'payout_proof';

export type ActionItemGroup = 'Pending' | 'Proof Ready';

export interface ActionItem {
  id: string;
  type: ActionItemType;
  group: ActionItemGroup;
  title: string;
  description: string;
  href: string;
  createdAt: number;
  unread: boolean;
  priority: number;
}

interface ActionCounts {
  pendingGroups: number;
  pendingWork: number;
  pending: number;
  proofReady: number;
}

const emptyCounts: ActionCounts = {
  pendingGroups: 0,
  pendingWork: 0,
  pending: 0,
  proofReady: 0,
};

function readIds() {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(READ_ACTIONS_KEY) || '[]') as unknown;
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return new Set<string>();
  }
}

function saveReadIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(READ_ACTIONS_KEY, JSON.stringify([...ids].slice(-300)));
}

function isUnread(id: string, read: Set<string>) {
  return !read.has(id);
}

function groupInvolvesAccount(proof: InvoiceNft, address: string) {
  return (
    proof.transfers.some((transfer) => addressesEqual(transfer.from, address) || addressesEqual(transfer.to, address)) ||
    proof.payouts.some((payout) => addressesEqual(payout.creditor, address))
  );
}

async function buildItems(account: WalletAccount, read: Set<string>) {
  const items: ActionItem[] = [];

  // These local lists are only a discovery index for records the app has seen.
  // Every visible action below is derived from fresh contract queries.
  const knownGroups = loadRecentGroups();
  await Promise.all(
    knownGroups.map(async (recent) => {
      try {
        const groupId = BigInt(recent.id);
        const [group, plan] = await Promise.all([
          getGroup(groupId),
          getSettlementPlan(groupId).catch(() => []),
        ]);

        let proof: InvoiceNft | null = null;
        try {
          proof = await getInvoice(groupId);
        } catch {
          proof = null;
        }

        const groupName = group.name || recent.name || `Group #${group.id.toString()}`;
        const userIsGroupMember = group.members.some((member) => addressesEqual(member, account.address));

        if (proof) {
          if (!userIsGroupMember && !groupInvolvesAccount(proof, account.address)) return;

          const claim = proof.payouts.find((payout) => addressesEqual(payout.creditor, account.address) && !payout.claimed);
          if (claim) {
            const claimId = `group_claim:${proof.tokenId.toString()}:${claim.amount.toString()}`;
            items.push({
              id: claimId,
              type: 'group_claim',
              group: 'Pending',
              title: 'Funds ready to claim',
              description: `You can claim ${formatTvara(claim.amount)} TVARA from ${groupName}.`,
              href: `/invoice/${proof.tokenId.toString()}`,
              createdAt: proof.settledAt,
              unread: isUnread(claimId, read),
              priority: 100,
            });
          }

          const proofId = `group_proof:${proof.tokenId.toString()}`;
          items.push({
            id: proofId,
            type: 'group_proof',
            group: 'Proof Ready',
            title: 'Proof Ready',
            description: `${groupName} is ready to share.`,
            href: `/invoice/${proof.tokenId.toString()}`,
            createdAt: proof.settledAt,
            unread: isUnread(proofId, read),
            priority: 50,
          });
          return;
        }

        const debtor = getDebtors(group, plan).find((entry) => addressesEqual(entry.address, account.address));
        if (debtor && debtor.remaining > BigInt(0)) {
          const id = `group_pay:${group.id.toString()}:${debtor.remaining.toString()}`;
          items.push({
            id,
            type: 'group_pay',
            group: 'Pending',
            title: 'Payment needed',
            description: `You still need to add ${formatTvara(debtor.remaining)} TVARA for ${groupName}.`,
            href: `/group/${group.id.toString()}`,
            createdAt: group.expenses.at(-1)?.createdAt ?? 0,
            unread: isUnread(id, read),
            priority: 90,
          });
          return;
        }

        const groupHasPaymentPlan = plan.length > 0;
        const groupLooksFunded = groupHasPaymentPlan && getDebtors(group, plan).every((entry) => entry.remaining <= BigInt(0));
        if (userIsGroupMember && groupLooksFunded) {
          const id = `group_finish:${group.id.toString()}`;
          items.push({
            id,
            type: 'group_proof',
            group: 'Pending',
            title: 'Finish record',
            description: `${groupName} is funded and waiting for completion.`,
            href: `/group/${group.id.toString()}`,
            createdAt: group.expenses.at(-1)?.createdAt ?? 0,
            unread: isUnread(id, read),
            priority: 86,
          });
          return;
        }

        if (userIsGroupMember && group.expenses.length > 0 && !group.settled) {
          const id = `group_waiting:${group.id.toString()}:${group.expenses.length}`;
          items.push({
            id,
            type: 'group_proof',
            group: 'Pending',
            title: 'Waiting for completion',
            description: `${groupName} has activity but no final proof yet.`,
            href: `/group/${group.id.toString()}`,
            createdAt: group.expenses.at(-1)?.createdAt ?? 0,
            unread: isUnread(id, read),
            priority: 60,
          });
        }
      } catch {
        return;
      }
    }),
  );

  const knownPayouts = loadRecentWorkPayouts();
  await Promise.all(
    knownPayouts.map(async (recent) => {
      try {
        const payoutId = BigInt(recent.id);
        const payout = await getPayout(payoutId);
        let proof: ProofInvoice | null = null;

        try {
          proof = await getProof(payoutId);
        } catch {
          proof = null;
        }
        const userIsPayer = addressesEqual(payout.payerWallet, account.address);
        const userIsRecipient = payout.recipients.some((recipient) => addressesEqual(recipient.wallet, account.address));
        if (!userIsPayer && !userIsRecipient) return;

        if (proof) {
          const claim = proof.payouts.find((record) => addressesEqual(record.recipient, account.address) && !record.claimed);
          if (claim) {
            const claimId = `payout_claim:${proof.tokenId.toString()}:${claim.amount.toString()}`;
            items.push({
              id: claimId,
              type: 'payout_claim',
              group: 'Pending',
              title: 'Funds ready to claim',
              description: `${formatTvara(claim.amount)} TVARA is ready from ${proof.title}.`,
              href: `/work-payouts/proof/${proof.tokenId.toString()}`,
              createdAt: proof.paidAt,
              unread: isUnread(claimId, read),
              priority: 98,
            });
          }

          const proofId = `payout_proof:${proof.tokenId.toString()}`;
          items.push({
            id: proofId,
            type: 'payout_proof',
            group: 'Proof Ready',
            title: 'Proof Ready',
            description: `${proof.title} is ready to share.`,
            href: `/work-payouts/proof/${proof.tokenId.toString()}`,
            createdAt: proof.paidAt,
            unread: isUnread(proofId, read),
            priority: 48,
          });
          return;
        }

        if (!payout.funded && !payout.completed) {
          const id = `payout_fund:${payout.id.toString()}:${payout.totalAmount.toString()}`;
          items.push({
            id,
            type: 'payout_fund',
            group: 'Pending',
            title: userIsPayer ? 'Fund this payout' : 'Waiting for funding',
            description: userIsPayer
              ? `${payout.title} needs ${formatTvara(payout.totalAmount)} TVARA.`
              : `${payout.title} is not funded yet.`,
            href: `/work-payouts/${payout.id.toString()}`,
            createdAt: payout.createdAt,
            unread: isUnread(id, read),
            priority: 88,
          });
        }

        if (payout.funded && !payout.completed) {
          const id = `payout_record:${payout.id.toString()}`;
          items.push({
            id,
            type: 'payout_record',
            group: 'Pending',
            title: userIsPayer ? 'Finish record' : 'Waiting for completion',
            description: userIsPayer
              ? `${payout.title} is funded and ready for proof.`
              : `${payout.title} is funded and waiting for proof.`,
            href: `/work-payouts/${payout.id.toString()}`,
            createdAt: payout.createdAt,
            unread: isUnread(id, read),
            priority: 82,
          });
        }
      } catch {
        return;
      }
    }),
  );

  return items.sort((a, b) => b.priority - a.priority || b.createdAt - a.createdAt).slice(0, 30);
}

function countsFor(items: ActionItem[]): ActionCounts {
  return items.reduce<ActionCounts>((acc, item) => {
    if (item.group === 'Pending') {
      acc.pending += 1;
      if (item.type.startsWith('group_')) acc.pendingGroups += 1;
      if (item.type.startsWith('payout_')) acc.pendingWork += 1;
    }
    if (item.group === 'Proof Ready') acc.proofReady += 1;
    return acc;
  }, { ...emptyCounts });
}

export function requestActionCenterRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(ACTION_CENTER_REFRESH_EVENT));
}

export function useActionCenter(accountOverride?: WalletAccount | null) {
  const wallet = useWallet();
  const pathname = usePathname();
  const account = accountOverride === undefined ? wallet.selectedAccount : accountOverride;
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    if (!account) {
      setItems([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextItems = await buildItems(account, readIds());
      if (requestId.current === currentRequest) {
        setItems(nextItems);
      }
    } catch (err) {
      if (requestId.current === currentRequest) {
        setError(err instanceof Error ? err.message : 'Unable to refresh actions.');
      }
    } finally {
      if (requestId.current === currentRequest) {
        setLoading(false);
      }
    }
  }, [account]);

  const markRead = useCallback((id: string) => {
    const read = readIds();
    read.add(id);
    saveReadIds(read);
    setItems((current) => current.map((item) => (item.id === id ? { ...item, unread: false } : item)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRefresh = () => {
      refresh().catch(() => null);
    };
    const handleFocus = () => {
      refresh().catch(() => null);
    };
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith('varasplit.')) {
        refresh().catch(() => null);
      }
    };

    window.addEventListener(ACTION_CENTER_REFRESH_EVENT, handleRefresh);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    const interval = window.setInterval(handleRefresh, POLL_MS);

    return () => {
      window.removeEventListener(ACTION_CENTER_REFRESH_EVENT, handleRefresh);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(interval);
    };
  }, [refresh]);

  const unreadCount = useMemo(() => items.filter((item) => item.unread).length, [items]);
  const counts = useMemo(() => countsFor(items), [items]);

  return {
    loading,
    error,
    unreadCount,
    items,
    counts,
    refresh,
    markRead,
  };
}
