import type { WalletAccount } from './types';
import { clearConnectedAccount, loadConnectedAccount, saveConnectedAccount } from './storage';

function isBrowser() {
  return typeof window !== 'undefined';
}

let extensionEnablePromise: Promise<boolean> | null = null;

async function ensureExtensionEnabled() {
  if (!isBrowser()) return false;

  if (!extensionEnablePromise) {
    extensionEnablePromise = (async () => {
      try {
        const { web3Enable } = await import('@polkadot/extension-dapp');
        const extensions = await web3Enable('VaraSplit');
        return extensions.length > 0;
      } catch {
        return false;
      }
    })();
  }

  return extensionEnablePromise;
}

export async function getWalletAccounts(): Promise<{
  accounts: WalletAccount[];
  status: 'missing' | 'disconnected' | 'ready';
}> {
  if (!isBrowser()) {
    return { accounts: [], status: 'missing' };
  }

  try {
    const enabled = await ensureExtensionEnabled();
    if (!enabled) {
      return { accounts: [], status: 'missing' };
    }

    const { web3Accounts } = await import('@polkadot/extension-dapp');
    const accounts = await web3Accounts();
    return {
      accounts: accounts as WalletAccount[],
      status: accounts.length ? 'ready' : 'disconnected',
    };
  } catch {
    return { accounts: [], status: 'missing' };
  }
}

export async function connectWalletAccount(): Promise<WalletAccount> {
  const { accounts, status } = await getWalletAccounts();

  if (status === 'missing') {
    throw new Error('No Vara-compatible wallet extension found.');
  }

  if (!accounts.length) {
    throw new Error('Wallet extension is installed, but no account is available.');
  }

  return accounts[0];
}

export function persistWalletAccount(account: WalletAccount) {
  saveConnectedAccount(account);
}

export function getPersistedWalletAccount(): WalletAccount | null {
  return loadConnectedAccount();
}

export function disconnectWalletAccount() {
  clearConnectedAccount();

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('wallet');
    window.localStorage.removeItem('account');
    window.localStorage.removeItem('userName');
  }
}
