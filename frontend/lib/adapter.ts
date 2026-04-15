'use client';

import type { GearApi } from '@gear-js/api';

import { PROGRAM_ID } from './constants';
import { addressToActorId, normalizeActorId } from './format';
import { getGearApi } from './gear';
import { VARA_SPLIT_IDL } from './idl';
import { getWalletState } from './wallet';
import type { Expense, Group, InvoiceNft, MemberBalance, PayoutRecord, SettlementTransfer, WalletAccount } from './types';
import type { WalletState } from './types';

type UnknownRecord = Record<string, unknown>;

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

interface VaraSplitEscrowProgram {
  services: {
    VaraSplitEscrow: {
      functions: {
        CreateGroup: (name: string, members: Uint8Array[]) => SailsTransaction<unknown>;
        AddExpense: (groupId: bigint, payer: Uint8Array, amount: bigint, description: string) => SailsTransaction<unknown>;
        ComputeSettlement: (groupId: bigint) => SailsTransaction<unknown>;
        Deposit: (groupId: bigint) => SailsTransaction<unknown>;
        FinalizeSettlement: (groupId: bigint, finalizeBlock: number, finalizeExtrinsicIndex: number) => SailsTransaction<unknown>;
        RecordFinalizeReference: (tokenId: bigint, finalizeBlock: number, finalizeExtrinsicIndex: number) => SailsTransaction<unknown>;
        ClaimPayout: (tokenId: bigint) => SailsTransaction<unknown>;
      };
      queries: {
        GetGroup: (groupId: bigint) => SailsQuery<unknown>;
        GetInvoice: (groupId: bigint) => SailsQuery<unknown>;
        GetInvoiceByToken: (tokenId: bigint) => SailsQuery<unknown>;
        GetSettlementPlan: (groupId: bigint) => SailsQuery<unknown>;
      };
    };
  };
}

let programPromise: Promise<VaraSplitEscrowProgram> | null = null;

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);
  if (value && typeof value === 'object' && 'toString' in value) return BigInt(String(value));
  return BigInt(0);
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

function normalizeBalances(value: unknown): MemberBalance[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const entry = item as UnknownRecord;
    return {
      member: normalizeActorId(entry.member),
      balance: toBigInt(entry.balance),
    };
  });
}

function normalizeExpenses(value: unknown): Expense[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const entry = item as UnknownRecord;
    return {
      payer: normalizeActorId(entry.payer),
      amount: toBigInt(entry.amount),
      sharePerMember: toBigInt(entry.share_per_member ?? entry.sharePerMember),
      remainder: toBigInt(entry.remainder),
      description: String(entry.description ?? ''),
      createdAt: Number(entry.created_at ?? entry.createdAt ?? 0),
    };
  });
}

function normalizeTransfers(value: unknown): SettlementTransfer[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const entry = item as UnknownRecord;
    return {
      from: normalizeActorId(entry.from),
      to: normalizeActorId(entry.to),
      amount: toBigInt(entry.amount),
    };
  });
}

function normalizeEscrow(value: unknown): Record<string, bigint> {
  const escrow: Record<string, bigint> = {};
  if (!value) return escrow;

  if (value instanceof Map) {
    for (const [key, amount] of value.entries()) {
      escrow[normalizeActorId(key)] = toBigInt(amount);
    }
    return escrow;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (Array.isArray(item) && item.length === 2) {
        escrow[normalizeActorId(item[0])] = toBigInt(item[1]);
      }
    }
    return escrow;
  }

  if (typeof value === 'object') {
    for (const [key, amount] of Object.entries(value as Record<string, unknown>)) {
      escrow[normalizeActorId(key)] = toBigInt(amount);
    }
  }

  return escrow;
}

function normalizeGroup(value: unknown): Group {
  const entry = value as UnknownRecord;
  return {
    id: toBigInt(entry.id),
    name: String(entry.name ?? ''),
    members: Array.isArray(entry.members) ? entry.members.map(normalizeActorId) : [],
    balances: normalizeBalances(entry.balances),
    expenses: normalizeExpenses(entry.expenses),
    escrow: normalizeEscrow(entry.escrow),
    settlementPlan: normalizeTransfers(entry.settlement_plan ?? entry.settlementPlan),
    settled: Boolean(entry.settled),
  };
}

function normalizeInvoice(value: unknown): InvoiceNft {
  const entry = value as UnknownRecord;
  return {
    tokenId: toBigInt(entry.token_id ?? entry.tokenId),
    groupId: toBigInt(entry.group_id ?? entry.groupId),
    transfers: normalizeTransfers(entry.transfers),
    totalSettled: toBigInt(entry.total_settled ?? entry.totalSettled),
    settledAt: Number(entry.settled_at ?? entry.settledAt ?? 0),
    finalizeBlock: Number(entry.finalize_block ?? entry.finalizeBlock ?? 0),
    finalizeExtrinsicIndex: Number(entry.finalize_extrinsic_index ?? entry.finalizeExtrinsicIndex ?? 0),
    payouts: normalizePayouts(entry.payouts),
  };
}

function normalizePayouts(value: unknown): PayoutRecord[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const entry = item as UnknownRecord;
    return {
      creditor: normalizeActorId(entry.creditor),
      amount: toBigInt(entry.amount),
      claimed: Boolean(entry.claimed),
    };
  });
}

function requireWallet(): WalletState & { selectedAccount: WalletAccount; injector: NonNullable<WalletState['injector']> } {
  const wallet = getWalletState();
  if (!wallet.selectedAccount || !wallet.injector?.signer) {
    throw new Error('Connect a wallet before sending a transaction.');
  }
  return wallet as WalletState & { selectedAccount: WalletAccount; injector: NonNullable<WalletState['injector']> };
}

async function signAndSend<T>(tx: SailsTransaction<T>) {
  const result = await signAndSendRaw<T>(tx);
  return unwrapResult<T>(result);
}

async function signAndSendRaw<T>(tx: SailsTransaction<T>) {
  const result = await signAndSendDetailed<T>(tx);
  return result.response;
}

async function signAndSendDetailed<T>(tx: SailsTransaction<T>) {
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

async function getExtrinsicReference(blockHash: `0x${string}`, txHash: `0x${string}`) {
  const api = await getGearApi();
  const [header, signedBlock] = await Promise.all([
    api.rpc.chain.getHeader(blockHash),
    api.rpc.chain.getBlock(blockHash),
  ]);
  const extrinsicIndex = signedBlock.block.extrinsics.findIndex(
    (extrinsic) => extrinsic.hash.toHex() === txHash,
  );

  if (extrinsicIndex < 0) {
    throw new Error('Unable to locate finalized extrinsic index for explorer link.');
  }

  return {
    block: header.number.toNumber(),
    index: extrinsicIndex,
  };
}

async function getProgram() {
  if (!programPromise) {
    programPromise = (async () => {
      try {
        const api = await getGearApi();
        const { Sails } = await import('sails-js');
        const { SailsIdlParser } = await import('sails-js-parser');
        const parser = await SailsIdlParser.new();
        const sails = new Sails(parser) as unknown as VaraSplitEscrowProgram & {
          parseIdl: (idl: string) => void;
          setApi: (api: GearApi) => { setProgramId: (programId: `0x${string}`) => unknown };
        };

        sails.parseIdl(VARA_SPLIT_IDL);
        sails.setApi(api).setProgramId(PROGRAM_ID as `0x${string}`);
        return sails;
      } catch (error) {
        programPromise = null;
        throw new Error(`Failed to initialize VaraSplitEscrow: ${error instanceof Error ? error.message : String(error)}`);
      }
    })();
  }

  return programPromise;
}

async function callQuery<T>(query: SailsQuery<unknown>, normalize: (value: unknown) => T) {
  const wallet = getWalletState();
  if (wallet.selectedAccount?.address) query.withAddress(wallet.selectedAccount.address);
  const result = await query.call();
  return normalize(unwrapResult(result));
}

export async function createGroup(name: string, members: string[]) {
  const program = await getProgram();
  const tx = program.services.VaraSplitEscrow.functions.CreateGroup(
    name,
    members.map(addressToActorId),
  );
  const res = await signAndSendRaw<unknown>(tx);

  if (res && typeof res === 'object' && 'Ok' in (res as UnknownRecord)) {
    const group = (res as UnknownRecord).Ok;
    const normalizedGroup = normalizeGroup(group);
    const groupId = Number(normalizedGroup.id);
    console.log('Created group:', groupId);
    return groupId;
  }

  if (res && typeof res === 'object' && 'Err' in (res as UnknownRecord)) {
    throw new Error(JSON.stringify((res as UnknownRecord).Err));
  }

  if (res && typeof res === 'object' && 'ok' in (res as UnknownRecord)) {
    const group = (res as UnknownRecord).ok;
    const normalizedGroup = normalizeGroup(group);
    const groupId = Number(normalizedGroup.id);
    console.log('Created group:', groupId);
    return groupId;
  }

  if (res && typeof res === 'object' && 'err' in (res as UnknownRecord)) {
    throw new Error(JSON.stringify((res as UnknownRecord).err));
  }

  const normalizedGroup = normalizeGroup(res);
  const groupId = Number(normalizedGroup.id);
  console.log('Created group:', groupId);
  return groupId;
}

export async function addExpense(groupId: bigint, payer: string, amount: bigint, description: string) {
  const program = await getProgram();
  const tx = program.services.VaraSplitEscrow.functions.AddExpense(groupId, addressToActorId(payer), amount, description);
  return normalizeGroup(await signAndSend(tx));
}

export async function computeSettlement(groupId: bigint) {
  const program = await getProgram();
  const tx = program.services.VaraSplitEscrow.functions.ComputeSettlement(groupId);
  return normalizeGroup(await signAndSend(tx));
}

export async function deposit(groupId: bigint, amount: bigint) {
  if (amount <= BigInt(0)) throw new Error('Deposit value must be greater than zero.');
  const program = await getProgram();
  const wallet = requireWallet();
  const tx = program.services.VaraSplitEscrow.functions.Deposit(groupId);
  tx.withAccount(wallet.selectedAccount.address, {
    signer: wallet.injector.signer,
  });
  tx.withValue(amount);
  await tx.calculateGas();

  try {
    const result = await tx.signAndSend();
    console.log('Deposit success');
    const response = await result.response();
    return normalizeGroup(unwrapResult(response));
  } catch (error) {
    if (error instanceof Error && /cancel|reject/i.test(error.message)) {
      throw new Error('Transaction was rejected by the user.');
    }
    throw new Error(error instanceof Error ? error.message : 'Deposit failed on chain.');
  }
}

export async function finalizeSettlement(groupId: bigint, finalizeBlock = 0, finalizeExtrinsicIndex = 0) {
  const program = await getProgram();
  const tx = program.services.VaraSplitEscrow.functions.FinalizeSettlement(groupId, finalizeBlock, finalizeExtrinsicIndex);
  const finalized = await signAndSendDetailed<unknown>(tx);
  const invoice = normalizeInvoice(unwrapResult(finalized.response));
  const reference = await getExtrinsicReference(finalized.blockHash, finalized.txHash);
  const recordTx = program.services.VaraSplitEscrow.functions.RecordFinalizeReference(
    invoice.tokenId,
    reference.block,
    reference.index,
  );
  const recorded = await signAndSend(recordTx);
  return normalizeInvoice(recorded);
}

export async function getGroup(groupId: bigint) {
  const program = await getProgram();
  const query = program.services.VaraSplitEscrow.queries.GetGroup(groupId);
  const wallet = getWalletState();
  if (wallet.selectedAccount?.address) query.withAddress(wallet.selectedAccount.address);
  const res = await query.call();
  console.log('Group fetch result:', res);

  if (res && typeof res === 'object' && 'Ok' in (res as UnknownRecord)) {
    return normalizeGroup((res as UnknownRecord).Ok);
  }

  if (res && typeof res === 'object' && 'Err' in (res as UnknownRecord)) {
    throw new Error(JSON.stringify((res as UnknownRecord).Err));
  }

  return normalizeGroup(unwrapResult(res));
}

export async function getSettlementPlan(groupId: bigint) {
  const program = await getProgram();
  return callQuery(program.services.VaraSplitEscrow.queries.GetSettlementPlan(groupId), normalizeTransfers);
}

export async function getInvoice(groupId: bigint) {
  const program = await getProgram();
  return callQuery(program.services.VaraSplitEscrow.queries.GetInvoice(groupId), normalizeInvoice);
}

export async function getInvoiceByToken(tokenId: bigint) {
  const program = await getProgram();
  return callQuery(program.services.VaraSplitEscrow.queries.GetInvoiceByToken(tokenId), normalizeInvoice);
}

export async function claimPayout(tokenId: bigint) {
  const program = await getProgram();
  const tx = program.services.VaraSplitEscrow.functions.ClaimPayout(tokenId);
  return normalizeInvoice(await signAndSend(tx));
}
