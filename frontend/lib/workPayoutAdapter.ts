'use client';

import type { GearApi } from '@gear-js/api';

import { WORK_PAYOUT_PROGRAM_ID, requiredWorkPayoutConfigError } from './constants';
import { addressToActorId, normalizeActorId } from './format';
import { getGearApi } from './gear';
import type { PayoutCategory, ProofInvoice, RecipientEntry, WalletAccount, WalletState, WorkPayout } from './types';
import { getWalletState } from './wallet';
import { WORK_PAYOUT_PROOF_IDL } from './workPayoutIdl';

type UnknownRecord = Record<string, unknown>;

type RecipientInput = {
  name: string;
  wallet: Uint8Array;
  amount: bigint;
};

interface SailsTransaction<Output> {
  withAccount: (address: string, signerOptions: unknown) => void;
  calculateGas: () => Promise<void>;
  withValue: (value: bigint) => void;
  signAndSend: () => Promise<{
    blockHash: `0x${string}`;
    txHash: `0x${string}`;
    response: () => Promise<Output>;
  }>;
}

interface SailsQuery<Output> {
  withAddress: (address: string) => void;
  call: () => Promise<Output>;
}

interface WorkPayoutProofProgram {
  services: {
    WorkPayoutProof: {
      functions: {
        CreatePayout: (
          payerName: string,
          recipients: RecipientInput[],
          title: string,
          reason: string,
          category: PayoutCategory,
        ) => SailsTransaction<unknown>;
        FundPayout: (payoutId: bigint) => SailsTransaction<unknown>;
        FinalizePayout: (payoutId: bigint, finalizeBlock: number, finalizeExtrinsicIndex: number) => SailsTransaction<unknown>;
        ClaimPayout: (tokenId: bigint) => SailsTransaction<unknown>;
      };
      queries: {
        GetPayout: (payoutId: bigint) => SailsQuery<unknown>;
        GetProof: (payoutId: bigint) => SailsQuery<unknown>;
        GetProofByToken: (tokenId: bigint) => SailsQuery<unknown>;
      };
    };
  };
}

let programPromise: Promise<WorkPayoutProofProgram> | null = null;

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);
  if (value && typeof value === 'object' && 'toString' in value) return BigInt(String(value));
  return BigInt(0);
}

function optionToBigInt(value: unknown): bigint | null {
  if (value == null) return null;
  if (typeof value === 'bigint' || typeof value === 'number' || typeof value === 'string') return toBigInt(value);
  if (value && typeof value === 'object') {
    const entry = value as UnknownRecord;
    if ('Some' in entry) return toBigInt(entry.Some);
    if ('some' in entry) return toBigInt(entry.some);
    if ('None' in entry || 'none' in entry) return null;
  }
  return null;
}

function optionToNumber(value: unknown): number | null {
  const parsed = optionToBigInt(value);
  return parsed == null ? null : Number(parsed);
}

function contractErrorToMessage(error: unknown) {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return String(error);
  return JSON.stringify(error);
}

function unwrapResult<T>(result: unknown): T {
  if (!result || typeof result !== 'object') return result as T;
  const entry = result as UnknownRecord;
  if ('Ok' in entry) return entry.Ok as T;
  if ('ok' in entry) return entry.ok as T;
  if ('Err' in entry) throw new Error(contractErrorToMessage(entry.Err));
  if ('err' in entry) throw new Error(contractErrorToMessage(entry.err));
  return result as T;
}

function normalizeCategory(value: unknown): PayoutCategory {
  if (typeof value === 'string') return value as PayoutCategory;
  if (value && typeof value === 'object') {
    const [key] = Object.keys(value as UnknownRecord);
    if (key) return key as PayoutCategory;
  }
  return 'Custom';
}

function normalizeRecipients(value: unknown): RecipientEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const entry = item as UnknownRecord;
    return {
      name: String(entry.name ?? ''),
      wallet: normalizeActorId(entry.wallet),
      amount: toBigInt(entry.amount),
    };
  });
}

function normalizeClaimRecords(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const entry = item as UnknownRecord;
    return {
      recipient: normalizeActorId(entry.recipient),
      amount: toBigInt(entry.amount),
      claimed: Boolean(entry.claimed),
    };
  });
}

function normalizePayout(value: unknown): WorkPayout {
  const entry = value as UnknownRecord;
  return {
    id: toBigInt(entry.id),
    payerName: String(entry.payer_name ?? entry.payerName ?? ''),
    payerWallet: normalizeActorId(entry.payer_wallet ?? entry.payerWallet),
    recipients: normalizeRecipients(entry.recipients),
    title: String(entry.title ?? ''),
    reason: String(entry.reason ?? ''),
    category: normalizeCategory(entry.category),
    totalAmount: toBigInt(entry.total_amount ?? entry.totalAmount),
    funded: Boolean(entry.funded),
    completed: Boolean(entry.completed),
    proofTokenId: optionToBigInt(entry.proof_token_id ?? entry.proofTokenId),
    createdAt: Number(entry.created_at ?? entry.createdAt ?? 0),
    paidAt: optionToNumber(entry.paid_at ?? entry.paidAt),
  };
}

function normalizeProof(value: unknown): ProofInvoice {
  const entry = value as UnknownRecord;
  return {
    tokenId: toBigInt(entry.token_id ?? entry.tokenId),
    payoutId: toBigInt(entry.payout_id ?? entry.payoutId),
    payerName: String(entry.payer_name ?? entry.payerName ?? ''),
    payerWallet: normalizeActorId(entry.payer_wallet ?? entry.payerWallet),
    recipients: normalizeRecipients(entry.recipients),
    title: String(entry.title ?? ''),
    reason: String(entry.reason ?? ''),
    category: normalizeCategory(entry.category),
    totalAmount: toBigInt(entry.total_amount ?? entry.totalAmount),
    createdAt: Number(entry.created_at ?? entry.createdAt ?? 0),
    paidAt: Number(entry.paid_at ?? entry.paidAt ?? 0),
    finalizeBlock: Number(entry.finalize_block ?? entry.finalizeBlock ?? 0),
    finalizeExtrinsicIndex: Number(entry.finalize_extrinsic_index ?? entry.finalizeExtrinsicIndex ?? 0),
    payouts: normalizeClaimRecords(entry.payouts),
  };
}

function requireWallet(): WalletState & { selectedAccount: WalletAccount; injector: NonNullable<WalletState['injector']> } {
  const wallet = getWalletState();
  if (!wallet.selectedAccount || !wallet.injector?.signer) {
    throw new Error('Connect a wallet before sending a transaction.');
  }
  return wallet as WalletState & { selectedAccount: WalletAccount; injector: NonNullable<WalletState['injector']> };
}

async function getProgram() {
  const configError = requiredWorkPayoutConfigError();
  if (configError) throw new Error(configError);

  if (!programPromise) {
    programPromise = (async () => {
      try {
        const api = await getGearApi();
        const { Sails } = await import('sails-js');
        const { SailsIdlParser } = await import('sails-js-parser');
        const parser = await SailsIdlParser.new();
        const sails = new Sails(parser) as unknown as WorkPayoutProofProgram & {
          parseIdl: (idl: string) => void;
          setApi: (api: GearApi) => { setProgramId: (programId: `0x${string}`) => unknown };
        };

        sails.parseIdl(WORK_PAYOUT_PROOF_IDL);
        sails.setApi(api).setProgramId(WORK_PAYOUT_PROGRAM_ID as `0x${string}`);
        return sails;
      } catch (error) {
        programPromise = null;
        throw new Error(`Failed to initialize WorkPayoutProof: ${error instanceof Error ? error.message : String(error)}`);
      }
    })();
  }

  return programPromise;
}

async function signAndSendRaw<T>(tx: SailsTransaction<T>) {
  const wallet = requireWallet();
  tx.withAccount(wallet.selectedAccount.address, { signer: wallet.injector.signer });
  await tx.calculateGas();

  try {
    const result = await tx.signAndSend();
    const response = await result.response();
    return {
      blockHash: result.blockHash,
      txHash: result.txHash,
      response,
    };
  } catch (error) {
    if (error instanceof Error && /cancel|reject/i.test(error.message)) {
      throw new Error('Transaction was rejected by the user.');
    }
    throw new Error(error instanceof Error ? error.message : 'Transaction failed on chain.');
  }
}

async function signAndSend<T>(tx: SailsTransaction<T>) {
  const result = await signAndSendRaw<T>(tx);
  return unwrapResult<T>(result.response);
}

async function callQuery<T>(query: SailsQuery<unknown>, normalize: (value: unknown) => T) {
  const wallet = getWalletState();
  if (wallet.selectedAccount?.address) query.withAddress(wallet.selectedAccount.address);
  const result = await query.call();
  return normalize(unwrapResult(result));
}

export async function createPayout(
  payerName: string,
  recipients: Array<{ name: string; wallet: string; amount: bigint }>,
  title: string,
  reason: string,
  category: PayoutCategory,
) {
  const program = await getProgram();
  const tx = program.services.WorkPayoutProof.functions.CreatePayout(
    payerName,
    recipients.map((recipient) => ({
      name: recipient.name,
      wallet: addressToActorId(recipient.wallet),
      amount: recipient.amount,
    })),
    title,
    reason,
    category,
  );
  return normalizePayout(await signAndSend(tx));
}

export async function fundPayout(payoutId: bigint, value: bigint) {
  if (value <= BigInt(0)) throw new Error('Funding amount must be greater than zero.');
  const program = await getProgram();
  const wallet = requireWallet();
  const tx = program.services.WorkPayoutProof.functions.FundPayout(payoutId);
  tx.withAccount(wallet.selectedAccount.address, { signer: wallet.injector.signer });
  tx.withValue(value);
  await tx.calculateGas();

  try {
    const result = await tx.signAndSend();
    const response = await result.response();
    return normalizePayout(unwrapResult(response));
  } catch (error) {
    if (error instanceof Error && /cancel|reject/i.test(error.message)) {
      throw new Error('Transaction was rejected by the user.');
    }
    throw new Error(error instanceof Error ? error.message : 'Funding failed on chain.');
  }
}

export async function finalizePayout(payoutId: bigint, finalizeBlock = 0, finalizeExtrinsicIndex = 0) {
  const program = await getProgram();
  const tx = program.services.WorkPayoutProof.functions.FinalizePayout(payoutId, finalizeBlock, finalizeExtrinsicIndex);
  return normalizeProof(await signAndSend(tx));
}

export async function claimPayout(tokenId: bigint) {
  const program = await getProgram();
  const tx = program.services.WorkPayoutProof.functions.ClaimPayout(tokenId);
  return normalizeProof(await signAndSend(tx));
}

export async function getPayout(payoutId: bigint) {
  const program = await getProgram();
  return callQuery(program.services.WorkPayoutProof.queries.GetPayout(payoutId), normalizePayout);
}

export async function getProof(payoutId: bigint) {
  const program = await getProgram();
  return callQuery(program.services.WorkPayoutProof.queries.GetProof(payoutId), normalizeProof);
}

export async function getProofByToken(tokenId: bigint) {
  const program = await getProgram();
  return callQuery(program.services.WorkPayoutProof.queries.GetProofByToken(tokenId), normalizeProof);
}
