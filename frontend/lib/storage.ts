import { normalizeActorId } from './format';

const RECENT_GROUPS_KEY = 'varasplit.recent-groups';
const RECENT_WORK_PAYOUTS_KEY = 'varasplit.recent-work-payouts';
const MEMBER_NAMES_KEY = 'varasplit.member-names';
const CONNECTED_ACCOUNT_KEY = 'varasplit.connected-account';
const ACTION_CENTER_REFRESH_EVENT = 'varasplit:action-center-refresh';

export interface RecentGroup {
  id: number;
  name: string;
}

export interface RecentWorkPayout {
  id: number;
  title: string;
}

interface StoredAccount {
  address: string;
  meta: {
    name?: string;
    source: string;
  };
}

export function saveRecentGroup(groupId: number, groupName?: string) {
  if (typeof window === 'undefined') return;

  const current = loadRecentGroups();
  const nextEntry: RecentGroup = {
    id: groupId,
    name: groupName?.trim() || current.find((item) => item.id === groupId)?.name || `Group #${groupId}`,
  };
  const next = [nextEntry, ...current.filter((item) => item.id !== groupId)].slice(0, 50);
  window.localStorage.setItem(RECENT_GROUPS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(ACTION_CENTER_REFRESH_EVENT));
}

export function loadRecentGroups(): RecentGroup[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(RECENT_GROUPS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      if (typeof item === 'number') {
        return [{ id: item, name: `Group #${item}` }];
      }

      if (
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        typeof item.id === 'number' &&
        'name' in item &&
        typeof item.name === 'string'
      ) {
        return [{ id: item.id, name: item.name }];
      }

      return [];
    });
  } catch {
    return [];
  }
}

export function saveRecentWorkPayout(payoutId: number, title?: string) {
  if (typeof window === 'undefined') return;

  const current = loadRecentWorkPayouts();
  const nextEntry: RecentWorkPayout = {
    id: payoutId,
    title: title?.trim() || current.find((item) => item.id === payoutId)?.title || `Payout #${payoutId}`,
  };
  const next = [nextEntry, ...current.filter((item) => item.id !== payoutId)].slice(0, 50);
  window.localStorage.setItem(RECENT_WORK_PAYOUTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(ACTION_CENTER_REFRESH_EVENT));
}

export function loadRecentWorkPayouts(): RecentWorkPayout[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(RECENT_WORK_PAYOUTS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      if (typeof item === 'number') {
        return [{ id: item, title: `Payout #${item}` }];
      }

      if (
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        typeof item.id === 'number' &&
        'title' in item &&
        typeof item.title === 'string'
      ) {
        return [{ id: item.id, title: item.title }];
      }

      return [];
    });
  } catch {
    return [];
  }
}

export function saveMemberName(address: string, name: string) {
  if (typeof window === 'undefined') return;

  const trimmedName = name.trim();
  if (!trimmedName) return;

  const current = loadMemberNames();
  current[memberNameKey(address)] = trimmedName;
  window.localStorage.setItem(MEMBER_NAMES_KEY, JSON.stringify(current));
}

export function loadMemberNames(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(MEMBER_NAMES_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return {};

    return Object.entries(parsed as Record<string, unknown>).reduce<Record<string, string>>((acc, [address, name]) => {
      if (typeof name !== 'string' || !name.trim()) return acc;
      acc[memberNameKey(address)] = name.trim();
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function getMemberName(address: string, names?: Record<string, string>) {
  const source = names ?? loadMemberNames();
  return source[memberNameKey(address)] ?? '';
}

export function saveConnectedAccount(account: StoredAccount) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(CONNECTED_ACCOUNT_KEY, JSON.stringify(account));
}

export function loadConnectedAccount(): StoredAccount | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CONNECTED_ACCOUNT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'address' in parsed &&
      typeof parsed.address === 'string' &&
      'meta' in parsed &&
      typeof parsed.meta === 'object' &&
      parsed.meta !== null &&
      'source' in parsed.meta &&
      typeof parsed.meta.source === 'string'
    ) {
      return parsed as StoredAccount;
    }

    return null;
  } catch {
    return null;
  }
}

export function clearConnectedAccount() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(CONNECTED_ACCOUNT_KEY);
}

export function clearMemberName(address: string) {
  if (typeof window === 'undefined') return;

  const current = loadMemberNames();
  const key = memberNameKey(address);
  if (!current[key]) return;

  delete current[key];
  window.localStorage.setItem(MEMBER_NAMES_KEY, JSON.stringify(current));
}

function memberNameKey(address: string) {
  try {
    return normalizeActorId(address);
  } catch {
    return address.trim();
  }
}
