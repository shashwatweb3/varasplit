import type { GearApi } from '@gear-js/api';

import { normalizeChainAddress, toActorIdBytes } from './address';
import { RPC_ENDPOINT, PROGRAM_ID, VOUCHER_ID } from './config';
import { VARA_SPLIT_IDL } from './idl';
import type {
  GroupSettlement,
  PaymentReceipt,
  GroupView,
  MemberBalance,
  SettlementTransfer,
  VaraSplitAdapter,
  WalletAccount,
} from './types';

let apiInstance: GearApi | null = null;
let apiConnectPromise: Promise<GearApi> | null = null;
let sailsPromise: Promise<SailsProgram> | null = null;
let apiConnected = false;
let apiListenersAttached = false;

type UnknownRecord = Record<string, unknown>;

interface SailsTransaction<Output> {
  withAccount: (address: string, signerOptions: unknown) => void;
  calculateGas: () => Promise<void>;
  withVoucher: (voucherId: `0x${string}`) => void;
  signAndSend: () => Promise<{ response: () => Output }>;
  extrinsic: {
    hash: { toHex: () => string };
    signAndSend: (
      account: string,
      options: unknown,
      callback: (result: {
        status: {
          isInBlock: boolean;
          isFinalized: boolean;
          asInBlock: { toHex: () => string };
          asFinalized: { toHex: () => string };
        };
        events: Array<{
          event: {
            method: string;
            section: string;
            data: Record<string, { toHex?: () => string }>;
          };
        }>;
      }) => void,
    ) => Promise<() => void>;
  };
  programId: string;
  decodePayload: (payload: Uint8Array | `0x${string}`) => Output;
  throwOnErrorReply: (message: unknown) => void;
}

interface SailsQuery<Output> {
  withAddress: (address: string) => void;
  call: () => Promise<Output>;
}

interface SailsProgram {
  services: {
    VaraSplit: {
      functions: {
        CreateGroup: (name: string, members: Uint8Array[]) => SailsTransaction<unknown>;
        AddExpense: (
          groupId: number,
          payer: Uint8Array,
          amount: bigint,
          description: string,
        ) => SailsTransaction<unknown>;
        ConfirmPayment: (
          groupId: number,
          from: Uint8Array,
          to: Uint8Array,
          amount: bigint,
        ) => SailsTransaction<unknown>;
        SettleGroup: (groupId: number) => SailsTransaction<unknown>;
      };
      queries: {
        GetGroup: (groupId: number) => SailsQuery<unknown>;
        GetSettlementPlan: (groupId: number) => SailsQuery<unknown>;
      };
    };
  };
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function assertBrowser() {
  if (!isBrowser()) {
    throw new Error('Wallet adapter is only available in the browser.');
  }
}

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);
  if (value && typeof value === 'object' && 'toString' in value) {
    return BigInt(String(value));
  }
  return BigInt(0);
}

function normalizeBalance(balance: unknown): MemberBalance {
  const entry = balance as UnknownRecord;
  return {
    member: normalizeChainAddress(entry.member),
    balance: toBigInt(entry.balance),
  };
}

function normalizeGroup(group: unknown): GroupView {
  const entry = group as UnknownRecord;
  const members = Array.isArray(entry.members) ? entry.members : [];
  const balances = Array.isArray(entry.balances) ? entry.balances : [];
  const expenses = Array.isArray(entry.expenses) ? entry.expenses : [];

  return {
    id: Number(entry.id),
    name: String(entry.name),
    members: members.map((member) => normalizeChainAddress(member)),
    balances: balances.map(normalizeBalance),
    expenses: expenses.map((expense) => {
      const rawExpense = expense as UnknownRecord;

      return {
        payer: normalizeChainAddress(rawExpense.payer),
        amount: toBigInt(rawExpense.amount),
        sharePerMember: toBigInt(rawExpense.share_per_member ?? rawExpense.sharePerMember),
        remainder: toBigInt(rawExpense.remainder),
        description: String(rawExpense.description),
        createdAt: Number(rawExpense.created_at ?? rawExpense.createdAt),
      };
    }),
  };
}

function normalizeTransfers(transfers: unknown[]): SettlementTransfer[] {
  return transfers.map((transfer) => ({
    from: normalizeChainAddress((transfer as UnknownRecord).from),
    to: normalizeChainAddress((transfer as UnknownRecord).to),
    amount: toBigInt((transfer as UnknownRecord).amount),
  }));
}

function extractGroupId(result: unknown): number {
  const entry = result as UnknownRecord;
  const rawGroupId = entry.group_id ?? entry.groupId ?? entry.id;
  const groupId = Number(rawGroupId);

  if (!Number.isFinite(groupId)) {
    throw new Error('CreateGroup succeeded but no group_id was returned by the contract.');
  }

  return groupId;
}

function isWebSocketError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return [
    'WebSocket is not connected',
    'websocket not connected',
    'disconnected',
    'connection closed',
    'Socket is closed',
    'Transport error',
    'Disconnected',
  ].some((phrase) => error.message.includes(phrase));
}

function attachApiListeners(api: GearApi) {
  if (apiListenersAttached) {
    return;
  }

  api.on('disconnected', () => {
    console.warn('Vara API disconnected');
    apiConnected = false;
  });

  api.on('connected', () => {
    console.info('Vara API connected');
    apiConnected = true;
  });

  api.on('error', (error: unknown) => {
    console.error('Vara API error event:', error);
    apiConnected = false;
  });

  apiListenersAttached = true;
}

async function waitForApiConnection(api: GearApi) {
  if ((api as any).isConnected) {
    apiConnected = true;
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Vara API connection timed out after 10 seconds.`));
    }, 10000);

    function cleanup() {
      window.clearTimeout(timeout);
      api.off('connected', onConnected);
      api.off('error', onError);
    }

    function onConnected() {
      apiConnected = true;
      cleanup();
      resolve();
    }

    function onError(error: unknown) {
      apiConnected = false;
      cleanup();
      reject(error instanceof Error ? error : new Error(String(error)));
    }

    api.on('connected', onConnected);
    api.on('error', onError);
  });
}

async function connectApi() {
  assertBrowser();

  if (apiConnectPromise) {
    return apiConnectPromise;
  }

  apiConnectPromise = (async () => {
    try {
      const { GearApi } = await import('@gear-js/api');
      console.log('Initializing GearApi with RPC:', RPC_ENDPOINT);
      const api = await GearApi.create({ providerAddress: RPC_ENDPOINT });
      apiInstance = api;
      attachApiListeners(api);
      apiConnected = Boolean((api as any).isConnected ?? false);

      if (!apiConnected) {
        await waitForApiConnection(api);
      }

      return api;
    } catch (error) {
      apiInstance = null;
      apiConnected = false;
      console.error('Failed to initialize GearApi:', error);
      throw new Error(`Failed to connect to Vara RPC (${RPC_ENDPOINT}): ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      apiConnectPromise = null;
    }
  })();

  return apiConnectPromise;
}

async function reconnectApi() {
  if (apiInstance) {
    try {
      apiInstance.disconnect();
    } catch {
      // best effort cleanup
    }
  }

  apiInstance = null;
  apiConnected = false;
  sailsPromise = null;
  return connectApi();
}

async function ensureApiConnected() {
  if (apiInstance && apiConnected && (apiInstance as any).isConnected) {
    return;
  }

  await connectApi();
}

async function getApi() {
  assertBrowser();
  await ensureApiConnected();

  if (!apiInstance) {
    throw new Error(`Failed to establish Vara API connection to ${RPC_ENDPOINT}.`);
  }

  return apiInstance;
}

async function getSails() {
  assertBrowser();
  await ensureApiConnected();

  if (!sailsPromise) {
    sailsPromise = (async () => {
      try {
        console.log('Connecting to contract at:', PROGRAM_ID);
        const api = await getApi();
        const { Sails } = await import('sails-js');
        const { SailsIdlParser } = await import('sails-js-parser');
        const parser = await SailsIdlParser.new();
        const sails = new Sails(parser) as unknown as SailsProgram & {
          parseIdl: (idl: string) => void;
          setApi: (api: GearApi) => { setProgramId: (programId: `0x${string}`) => unknown };
        };
        console.log('Parsing VaraSplit IDL...');
        if (!PROGRAM_ID) {
          throw new Error('VaraSplit program ID is not configured. Cannot connect to contract.');
        }
        sails.parseIdl(VARA_SPLIT_IDL);
        console.log('Setting Sails API and program ID...');
        sails.setApi(api).setProgramId(PROGRAM_ID as `0x${string}`);
        console.log('Sails initialized successfully');
        return sails;
      } catch (error) {
        console.error('Failed to initialize Sails:', error);
        throw new Error(`Contract initialization failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    })();
  }

  try {
    return await sailsPromise;
  } catch (error) {
    sailsPromise = null;
    console.error('Sails connection error:', error);
    throw new Error(`Cannot connect to contract at ${PROGRAM_ID}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    await ensureApiConnected();
    return await fn();
  } catch (error) {
    if (isWebSocketError(error)) {
      console.warn('WebSocket error detected, reconnecting and retrying contract call...', error);
      await reconnectApi();
      return await fn();
    }

    throw error;
  }
}

async function signAndSend<T>(tx: SailsTransaction<T>, account: WalletAccount): Promise<T> {
  assertBrowser();

  const { web3FromAddress } = await import('@polkadot/extension-dapp');
  const injected = await web3FromAddress(account.address);

  // REQUIRED: Set account with signer on the transaction
  tx.withAccount(account.address, {
    signer: injected.signer,
  });

  await tx.calculateGas();
  if (VOUCHER_ID) {
    tx.withVoucher(VOUCHER_ID as `0x${string}`);
  }

  console.log('Sending transaction for account:', account.address);
  
  // Now signAndSend works - account is already attached
  const result = await tx.signAndSend();
  console.log('Transaction response:', result);
  
  // Get the decoded response from the transaction
  return result.response();
}

async function sendNativeTransfer(to: string, amount: bigint, account: WalletAccount): Promise<PaymentReceipt> {
  assertBrowser();

  if (amount <= BigInt(0)) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const api = await getApi();
  const { web3FromAddress } = await import('@polkadot/extension-dapp');
  const injected = await web3FromAddress(account.address);

  return new Promise((resolve, reject) => {
    let settled = false;

    const finalize = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      callback();
    };

    api.tx.balances
      .transferKeepAlive(to, amount)
      .signAndSend(account.address, { signer: injected.signer }, (result: unknown) => {
        const txResult = result as {
          status: {
            isInBlock?: boolean;
            isFinalized?: boolean;
            asInBlock?: { toHex: () => string };
            asFinalized?: { toHex: () => string };
          };
          dispatchError?: {
            isModule?: boolean;
            asModule?: unknown;
            toString: () => string;
          };
          };

        const dispatchError = txResult.dispatchError;

        if (dispatchError) {
          if (dispatchError.isModule) {
            const metaError = api.registry.findMetaError(dispatchError.asModule as Parameters<typeof api.registry.findMetaError>[0]);
            finalize(() => reject(new Error(metaError.docs.join(' ') || `${metaError.section}.${metaError.name}`)));
            return;
          }

          finalize(() => reject(new Error(dispatchError.toString())));
          return;
        }

        if (txResult.status.isFinalized) {
          finalize(() =>
            resolve({
              blockHash: txResult.status.asFinalized?.toHex() ?? '',
            }),
          );
          return;
        }

        if (txResult.status.isInBlock) {
          finalize(() =>
            resolve({
              blockHash: txResult.status.asInBlock?.toHex() ?? '',
            }),
          );
        }
      })
      .catch((error: unknown) => {
        finalize(() =>
          reject(new Error(error instanceof Error ? error.message : 'Failed to send TVARA payment.')),
        );
      });
  });
}

const chainAdapter: VaraSplitAdapter = {
  async createGroup(name, members, account) {
    return withRetry(async () => {
      const sails = await getSails();
      const normalizedMembers = Array.from(
        new Set([account.address, ...members.map((member) => member.trim()).filter(Boolean)]),
      );
      const actorMembers = normalizedMembers.map((member) => toActorIdBytes(member));
      const tx = sails.services.VaraSplit.functions.CreateGroup(name, actorMembers);
      const result = await signAndSend(tx, account);
      console.log('CreateGroup response:', result);
      const groupId = extractGroupId(result);
      return this.getGroup(groupId, account);
    });
  },
  async getGroup(groupId, account) {
    return withRetry(async () => {
      const sails = await getSails();
      const query = sails.services.VaraSplit.queries.GetGroup(groupId);

      if (account?.address) {
        query.withAddress(account.address);
      }

      const result = await query.call();
      return normalizeGroup(result);
    });
  },
  async addExpense(groupId, payer, amount, description, account) {
    return withRetry(async () => {
      const sails = await getSails();
      const actorPayer = toActorIdBytes(payer);
      const tx = sails.services.VaraSplit.functions.AddExpense(groupId, actorPayer, amount, description);
      await signAndSend(tx, account);
      return this.getGroup(groupId, account);
    });
  },
  async getSettlementPlan(groupId, account) {
    return withRetry(async () => {
      const sails = await getSails();
      const query = sails.services.VaraSplit.queries.GetSettlementPlan(groupId);

      if (account?.address) {
        query.withAddress(account.address);
      }

      const result = await query.call();
      return normalizeTransfers(result as unknown[]);
    });
  },
  async settleGroup(groupId, account) {
    return withRetry(async () => {
      const sails = await getSails();
      const tx = sails.services.VaraSplit.functions.SettleGroup(groupId);
      const result = await signAndSend(tx, account);
      console.log('SettleGroup response:', result);
      const entry = result as UnknownRecord;

      const settlement: GroupSettlement = {
        groupId: Number(entry.group_id ?? entry.groupId),
        transfers: normalizeTransfers((entry.transfers as unknown[]) ?? []),
        totalSettled: toBigInt(entry.total_settled ?? entry.totalSettled),
      };

      return settlement;
    });
  },
  async confirmPayment(groupId, from, to, amount, account) {
    return withRetry(async () => {
      const sails = await getSails();
      const actorFrom = toActorIdBytes(from);
      const actorTo = toActorIdBytes(to);
      const tx = sails.services.VaraSplit.functions.ConfirmPayment(groupId, actorFrom, actorTo, amount);
      const result = await signAndSend(tx, account);
      console.log('ConfirmPayment response:', result);
      return result;
    });
  },
  async paySettlementTransfer(to, amount, account) {
    return withRetry(async () => sendNativeTransfer(to, amount, account));
  },
};

export function getAdapter(): VaraSplitAdapter {
  return chainAdapter;
}
