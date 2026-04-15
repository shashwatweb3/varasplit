'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { getGroup, getInvoice, getInvoiceByToken } from './adapter';
import { getDebtors } from './derived';
import { addressesEqual, formatTvara } from './format';
import { getKnownRecordCount, loadRecentGroups, loadRecentWorkPayouts, saveRecentGroup, saveRecentWorkPayout } from './storage';
import type { InvoiceNft, ProofInvoice, WalletAccount } from './types';
import { useWallet } from './wallet';
import { getPayout, getProof, getProofByToken } from './workPayoutAdapter';

export const ACTION_CENTER_REFRESH_EVENT = 'varasplit:action-center-refresh';

const READ_ACTIONS_KEY = 'varasplit.action-center.read';
const POLL_MS = 20_000;
const SESSION_CACHE_TTL_MS = 30_000;
const RECENT_RECORD_LIMIT = 20;
const FALLBACK_DISCOVERY_MAX_ID = 100;
const FALLBACK_DISCOVERY_LIMIT = 12;
const DISCOVERY_BATCH_SIZE = 6;

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

interface ActionSnapshot {
  items: ActionItem[];
  knownRecordCount: number;
  checkedRecordCount: number;
  scannedRecordCount: number;
  contractDiscoveryComplete: boolean;
}

interface WalletIndexedRecordIds {
  groupIds: number[];
  payoutIds: number[];
}

interface ActionCacheEntry {
  snapshot: ActionSnapshot;
  updatedAt: number;
}

interface InFlightRefresh {
  promise: Promise<ActionSnapshot>;
  listeners: Set<(snapshot: ActionSnapshot) => void>;
}

const emptyCounts: ActionCounts = {
  pendingGroups: 0,
  pendingWork: 0,
  pending: 0,
  proofReady: 0,
};

const actionCenterCache = new Map<string, ActionCacheEntry>();
const inFlightRefreshes = new Map<string, InFlightRefresh>();

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

function parseRouteId(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null;
  return BigInt(value);
}

function getActionCenterCacheKey(account: WalletAccount) {
  return account.address;
}

function getCachedSnapshot(account: WalletAccount) {
  return actionCenterCache.get(getActionCenterCacheKey(account)) ?? null;
}

function isFreshCache(entry: ActionCacheEntry) {
  return Date.now() - entry.updatedAt < SESSION_CACHE_TTL_MS;
}

async function getWalletIndexedRecordIds(_account: WalletAccount): Promise<WalletIndexedRecordIds | null> {
  void _account;
  return null;
}

function getContractDiscoveryIds(localIds: number[]) {
  const ids: number[] = [];
  const seen = new Set<number>();
  const addId = (id: number) => {
    if (!Number.isSafeInteger(id) || id <= 0 || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };

  for (const id of localIds.slice(0, RECENT_RECORD_LIMIT)) {
    addId(id);
  }

  for (let id = FALLBACK_DISCOVERY_MAX_ID; id > Math.max(0, FALLBACK_DISCOVERY_MAX_ID - FALLBACK_DISCOVERY_LIMIT); id -= 1) {
    addId(id);
  }

  return ids;
}

async function forEachInBatches<T>(
  items: T[],
  batchSize: number,
  handler: (item: T) => Promise<void>,
  afterBatch?: () => void,
) {
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    await Promise.all(batch.map(handler));
    afterBatch?.();
  }
}

async function primeKnownRecordsFromPathname(pathname: string | null) {
  if (!pathname) return false;

  const payoutProofMatch = pathname.match(/^\/work-payouts\/proof\/(\d+)$/);
  if (payoutProofMatch) {
    const tokenId = parseRouteId(payoutProofMatch[1]);
    if (!tokenId) return false;
    const proof = await getProofByToken(tokenId);
    saveRecentWorkPayout(Number(proof.payoutId), proof.title);
    return true;
  }

  const groupProofMatch = pathname.match(/^\/invoice\/(\d+)$/);
  if (groupProofMatch) {
    const tokenId = parseRouteId(groupProofMatch[1]);
    if (!tokenId) return false;
    const invoice = await getInvoiceByToken(tokenId);
    saveRecentGroup(Number(invoice.groupId), `Group #${invoice.groupId.toString()}`);
    return true;
  }

  const groupMatch = pathname.match(/^\/group\/(\d+)$/);
  if (groupMatch) {
    const groupId = Number(groupMatch[1]);
    saveRecentGroup(groupId);
    return true;
  }

  const payoutMatch = pathname.match(/^\/work-payouts\/(\d+)$/);
  if (payoutMatch) {
    const payoutId = Number(payoutMatch[1]);
    saveRecentWorkPayout(payoutId);
    return true;
  }

  return false;
}

function createSnapshot(
  items: ActionItem[],
  knownRecordCount: number,
  checkedRecordCount: number,
  scannedRecordCount: number,
  contractDiscoveryComplete: boolean,
): ActionSnapshot {
  return {
    items: [...items].sort((a, b) => b.priority - a.priority || b.createdAt - a.createdAt).slice(0, 30),
    knownRecordCount,
    checkedRecordCount,
    scannedRecordCount,
    contractDiscoveryComplete,
  };
}

async function buildItems(
  account: WalletAccount,
  read: Set<string>,
  onProgress?: (snapshot: ActionSnapshot) => void,
): Promise<ActionSnapshot> {
  const items: ActionItem[] = [];
  let checkedRecordCount = 0;
  let knownRecordCount = 0;

  const recentGroups = loadRecentGroups();
  const recentPayouts = loadRecentWorkPayouts();
  const recentGroupById = new Map(recentGroups.map((recent) => [recent.id, recent]));
  const recentPayoutById = new Map(recentPayouts.map((recent) => [recent.id, recent]));
  const walletIndexedIds = await getWalletIndexedRecordIds(account).catch(() => null);
  const groupIds = walletIndexedIds?.groupIds.slice(0, RECENT_RECORD_LIMIT) ?? getContractDiscoveryIds(recentGroups.map((recent) => recent.id));
  const payoutIds = walletIndexedIds?.payoutIds.slice(0, RECENT_RECORD_LIMIT) ?? getContractDiscoveryIds(recentPayouts.map((recent) => recent.id));
  const scannedRecordCount = groupIds.length + payoutIds.length;

  const publishProgress = () => {
    onProgress?.(createSnapshot(items, knownRecordCount, checkedRecordCount, scannedRecordCount, false));
  };

  await Promise.all([
    forEachInBatches(
    groupIds,
    DISCOVERY_BATCH_SIZE,
    async (id) => {
      try {
        const groupId = BigInt(id);
        const group = await getGroup(groupId);
        checkedRecordCount += 1;

        const userIsGroupMember = group.members.some((member) => addressesEqual(member, account.address));
        if (!userIsGroupMember) return;

        knownRecordCount += 1;

        const recent = recentGroupById.get(id);
        const groupName = group.name || recent?.name || `Group #${group.id.toString()}`;
        saveRecentGroup(Number(group.id), groupName, { silent: true });

        let proof: InvoiceNft | null = null;
        if (group.settled) {
          try {
            proof = await getInvoice(groupId);
          } catch {
            proof = null;
          }
        }

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

        const plan = group.settlementPlan;
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
    },
    publishProgress,
    ),

    forEachInBatches(
    payoutIds,
    DISCOVERY_BATCH_SIZE,
    async (id) => {
      try {
        const payoutId = BigInt(id);
        const payout = await getPayout(payoutId);
        checkedRecordCount += 1;

        const userIsPayer = addressesEqual(payout.payerWallet, account.address);
        const userIsRecipient = payout.recipients.some((recipient) => addressesEqual(recipient.wallet, account.address));
        if (!userIsPayer && !userIsRecipient) return;

        knownRecordCount += 1;
        const recent = recentPayoutById.get(id);
        saveRecentWorkPayout(Number(payout.id), payout.title || recent?.title, { silent: true });

        let proof: ProofInvoice | null = null;
        if (payout.completed && payout.proofTokenId != null) {
          try {
            proof = await getProof(payoutId);
          } catch {
            proof = null;
          }
        }

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
    },
    publishProgress,
    ),
  ]);

  return createSnapshot(items, knownRecordCount, checkedRecordCount, scannedRecordCount, true);
}

async function loadActionSnapshot(
  account: WalletAccount,
  read: Set<string>,
  onProgress?: (snapshot: ActionSnapshot) => void,
) {
  const cacheKey = getActionCenterCacheKey(account);
  const existing = inFlightRefreshes.get(cacheKey);
  if (existing) {
    if (onProgress) existing.listeners.add(onProgress);
    try {
      return await existing.promise;
    } finally {
      if (onProgress) existing.listeners.delete(onProgress);
    }
  }

  const listeners = new Set<(snapshot: ActionSnapshot) => void>();
  if (onProgress) listeners.add(onProgress);

  const promise = buildItems(account, read, (snapshot) => {
    for (const listener of listeners) {
      listener(snapshot);
    }
  }).then((snapshot) => {
    actionCenterCache.set(cacheKey, { snapshot, updatedAt: Date.now() });
    return snapshot;
  }).finally(() => {
    inFlightRefreshes.delete(cacheKey);
  });

  inFlightRefreshes.set(cacheKey, { promise, listeners });
  return promise;
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
  const [knownRecordCount, setKnownRecordCount] = useState(0);
  const [checkedRecordCount, setCheckedRecordCount] = useState(0);
  const [scannedRecordCount, setScannedRecordCount] = useState(0);
  const [contractDiscoveryComplete, setContractDiscoveryComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const activeAccountKey = useRef<string | null>(null);

  const applySnapshot = useCallback((snapshot: ActionSnapshot) => {
    setItems(snapshot.items);
    setKnownRecordCount(snapshot.knownRecordCount);
    setCheckedRecordCount(snapshot.checkedRecordCount);
    setScannedRecordCount(snapshot.scannedRecordCount);
    setContractDiscoveryComplete(snapshot.contractDiscoveryComplete);
  }, []);

  const runRefresh = useCallback(async (options?: { force?: boolean; background?: boolean }) => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    if (!account) {
      setItems([]);
      setKnownRecordCount(getKnownRecordCount());
      setCheckedRecordCount(0);
      setScannedRecordCount(0);
      setContractDiscoveryComplete(false);
      setError(null);
      setLoading(false);
      return;
    }

    const accountKey = getActionCenterCacheKey(account);
    const cached = getCachedSnapshot(account);
    const hasUsableCache = cached && (options?.force ? true : isFreshCache(cached));
    const accountChanged = activeAccountKey.current !== accountKey;

    if (cached) {
      activeAccountKey.current = accountKey;
      applySnapshot(cached.snapshot);
    } else if (accountChanged) {
      activeAccountKey.current = accountKey;
      setItems([]);
      setKnownRecordCount(getKnownRecordCount());
      setCheckedRecordCount(0);
      setScannedRecordCount(0);
      setContractDiscoveryComplete(false);
    }

    if (hasUsableCache && !options?.force) {
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(!cached || !options?.background);
    setError(null);
    try {
      const snapshot = await loadActionSnapshot(account, readIds(), (progressSnapshot) => {
        if (requestId.current === currentRequest) {
          applySnapshot(progressSnapshot);
        }
      });
      if (requestId.current === currentRequest) {
        applySnapshot(snapshot);
      }
    } catch (err) {
      if (requestId.current === currentRequest) {
        setError(err instanceof Error ? err.message : 'Unable to refresh actions.');
        setContractDiscoveryComplete(false);
      }
    } finally {
      if (requestId.current === currentRequest) {
        setLoading(false);
      }
    }
  }, [account, applySnapshot]);

  const refresh = useCallback(() => runRefresh({ force: true }), [runRefresh]);

  const markRead = useCallback((id: string) => {
    const read = readIds();
    read.add(id);
    saveReadIds(read);
    setItems((current) => current.map((item) => (item.id === id ? { ...item, unread: false } : item)));
  }, []);

  useEffect(() => {
    let cancelled = false;

    primeKnownRecordsFromPathname(pathname)
      .catch(() => false)
      .finally(() => {
        if (!cancelled) runRefresh({ force: true, background: true });
      });

    return () => {
      cancelled = true;
    };
  }, [runRefresh, pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRefresh = () => {
      runRefresh({ force: true, background: true }).catch(() => null);
    };
    const handleFocus = () => {
      runRefresh({ background: true }).catch(() => null);
    };
    const handlePoll = () => {
      runRefresh({ background: true }).catch(() => null);
    };
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith('varasplit.')) {
        runRefresh({ force: true, background: true }).catch(() => null);
      }
    };

    window.addEventListener(ACTION_CENTER_REFRESH_EVENT, handleRefresh);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    const interval = window.setInterval(handlePoll, POLL_MS);

    return () => {
      window.removeEventListener(ACTION_CENTER_REFRESH_EVENT, handleRefresh);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(interval);
    };
  }, [runRefresh]);

  const unreadCount = useMemo(() => items.filter((item) => item.unread).length, [items]);
  const counts = useMemo(() => countsFor(items), [items]);
  const hasKnownRecords = knownRecordCount > 0;
  const hasCheckedKnownRecords = contractDiscoveryComplete;

  return {
    loading,
    error,
    unreadCount,
    items,
    counts,
    knownRecordCount,
    checkedRecordCount,
    scannedRecordCount,
    contractDiscoveryComplete,
    hasKnownRecords,
    hasCheckedKnownRecords,
    refresh,
    markRead,
  };
}
