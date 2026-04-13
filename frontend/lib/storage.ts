const RECENT_GROUPS_KEY = 'varasplit.recent-groups';
const MEMBER_NAMES_KEY = 'varasplit.member-names';
const CONNECTED_ACCOUNT_KEY = 'varasplit.connected-account';

export interface RecentGroup {
  id: number;
  name: string;
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
  const next = [nextEntry, ...current.filter((item) => item.id !== groupId)].slice(0, 5);
  window.localStorage.setItem(RECENT_GROUPS_KEY, JSON.stringify(next));
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

export function saveMemberName(address: string, name: string) {
  if (typeof window === 'undefined') return;

  const current = loadMemberNames();
  current[address] = name;
  window.localStorage.setItem(MEMBER_NAMES_KEY, JSON.stringify(current));
}

export function loadMemberNames(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(MEMBER_NAMES_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, string> : {};
  } catch {
    return {};
  }
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
  if (!current[address]) return;

  delete current[address];
  window.localStorage.setItem(MEMBER_NAMES_KEY, JSON.stringify(current));
}
