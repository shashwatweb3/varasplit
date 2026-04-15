'use client';

import type { InjectedExtension } from '@polkadot/extension-inject/types';
import { useEffect, useSyncExternalStore } from 'react';

import { APP_NAME } from './constants';
import type { WalletAccount, WalletState } from './types';
import { setGearSigner } from './gear';

const SELECTED_ACCOUNT_KEY = 'varasplit.selectedAccount';

const initialState: WalletState = {
  selectedAccount: null,
  injector: null,
  isConnected: false,
  availableAccounts: [],
  status: 'idle',
  error: null,
};

let walletState: WalletState = initialState;
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== 'undefined';
}

function emit(next: Partial<WalletState>) {
  walletState = { ...walletState, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot() {
  return walletState;
}

function serverSnapshot() {
  return initialState;
}

function readPersistedAddress() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(SELECTED_ACCOUNT_KEY);
}

function persistSelectedAccount(account: WalletAccount | null) {
  if (!isBrowser()) return;
  if (account) {
    window.localStorage.setItem(SELECTED_ACCOUNT_KEY, account.address);
  } else {
    window.localStorage.removeItem(SELECTED_ACCOUNT_KEY);
  }
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    if (/reject|denied|cancel/i.test(error.message)) return 'Wallet permission was rejected.';
    return error.message;
  }
  return fallback;
}

export function getWalletState() {
  return walletState;
}

export async function loadWalletAccounts() {
  if (!isBrowser()) {
    emit({ status: 'missing', error: 'Wallets are available only in the browser.' });
    return [];
  }

  emit({ status: 'connecting', error: null });

  try {
    const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
    const extensions = await web3Enable(APP_NAME);

    if (!extensions.length) {
      emit({
        status: 'missing',
        availableAccounts: [],
        selectedAccount: null,
        injector: null,
        isConnected: false,
        error: 'No wallet extension found. Install SubWallet, Polkadot.js, or Talisman.',
      });
      return [];
    }

    const accounts = await web3Accounts();
    if (!accounts.length) {
      emit({
        status: 'error',
        availableAccounts: [],
        selectedAccount: null,
        injector: null,
        isConnected: false,
        error: 'Wallet extension is connected, but no account is available.',
      });
      return [];
    }

    emit({ availableAccounts: accounts, status: 'idle', error: null });
    return accounts;
  } catch (error) {
    const message = toErrorMessage(error, 'Failed to connect wallet.');
    emit({
      status: /rejected/i.test(message) ? 'rejected' : 'error',
      availableAccounts: [],
      selectedAccount: null,
      injector: null,
      isConnected: false,
      error: message,
    });
    return [];
  }
}

export async function selectWalletAccount(account: WalletAccount) {
  try {
    const { web3FromSource } = await import('@polkadot/extension-dapp');
    const injector = await web3FromSource(account.meta.source);

    if (!injector?.signer) {
      throw new Error('Signer missing for selected account.');
    }

    await setGearSigner(injector.signer);
    persistSelectedAccount(account);
    emit({
      selectedAccount: account,
      injector: injector as InjectedExtension,
      isConnected: true,
      status: 'connected',
      error: null,
    });
  } catch (error) {
    emit({
      selectedAccount: null,
      injector: null,
      isConnected: false,
      status: 'error',
      error: toErrorMessage(error, 'Failed to select wallet account.'),
    });
  }
}

export async function selectAccount(address: string) {
  const account = walletState.availableAccounts.find((item) => item.address === address);
  if (!account) {
    throw new Error('Selected wallet account is not available.');
  }

  await selectWalletAccount(account);
}

export async function connectWallet(preferredAddress?: string | null) {
  const accounts = await loadWalletAccounts();
  if (!accounts.length) return;

  const targetAddress = preferredAddress ?? readPersistedAddress();
  const account = accounts.find((item) => item.address === targetAddress) ?? accounts[0];
  await selectWalletAccount(account);
}

export const connect = connectWallet;

export async function restoreWallet() {
  const persisted = readPersistedAddress();
  if (!persisted || walletState.isConnected || walletState.status === 'connecting') return;
  await connectWallet(persisted);
}

export function disconnectWallet() {
  persistSelectedAccount(null);
  emit({
    selectedAccount: null,
    injector: null,
    isConnected: false,
    status: 'idle',
    error: null,
  });
}

export const disconnect = disconnectWallet;

export function getSigner() {
  if (!walletState.injector?.signer) {
    throw new Error('Signer missing. Connect a wallet first.');
  }

  return walletState.injector.signer;
}

export function useWallet() {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  useEffect(() => {
    restoreWallet().catch(() => null);
  }, []);

  return state;
}
