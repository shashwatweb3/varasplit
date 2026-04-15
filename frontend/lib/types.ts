import type { InjectedAccountWithMeta, InjectedExtension } from '@polkadot/extension-inject/types';

export type WalletAccount = InjectedAccountWithMeta;

export type WalletStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'missing'
  | 'rejected'
  | 'error';

export interface WalletState {
  selectedAccount: WalletAccount | null;
  injector: InjectedExtension | null;
  isConnected: boolean;
  availableAccounts: WalletAccount[];
  status: WalletStatus;
  error: string | null;
}

export interface MemberBalance {
  member: string;
  balance: bigint;
}

export interface Expense {
  payer: string;
  amount: bigint;
  sharePerMember: bigint;
  remainder: bigint;
  description: string;
  createdAt: number;
}

export interface SettlementTransfer {
  from: string;
  to: string;
  amount: bigint;
}

export interface Group {
  id: bigint;
  name: string;
  members: string[];
  balances: MemberBalance[];
  expenses: Expense[];
  escrow: Record<string, bigint>;
  settlementPlan: SettlementTransfer[];
  settled: boolean;
}

export interface InvoiceNft {
  tokenId: bigint;
  groupId: bigint;
  transfers: SettlementTransfer[];
  totalSettled: bigint;
  settledAt: number;
  finalizeBlock: number;
  finalizeExtrinsicIndex: number;
  payouts: PayoutRecord[];
}

export interface PayoutRecord {
  creditor: string;
  amount: bigint;
  claimed: boolean;
}

export interface DebtorStatus {
  address: string;
  required: bigint;
  deposited: bigint;
  remaining: bigint;
  paid: boolean;
}

export interface CreditorStatus {
  address: string;
  amount: bigint;
}

export type PayoutCategory = 'Freelance' | 'Bounty' | 'Salary' | 'Custom';

export interface RecipientEntry {
  name: string;
  wallet: string;
  amount: bigint;
}

export interface WorkPayout {
  id: bigint;
  payerName: string;
  payerWallet: string;
  recipients: RecipientEntry[];
  title: string;
  reason: string;
  category: PayoutCategory;
  totalAmount: bigint;
  funded: boolean;
  completed: boolean;
  proofTokenId: bigint | null;
  createdAt: number;
  paidAt: number | null;
}

export interface ProofInvoice {
  tokenId: bigint;
  payoutId: bigint;
  payerName: string;
  payerWallet: string;
  recipients: RecipientEntry[];
  title: string;
  reason: string;
  category: PayoutCategory;
  totalAmount: bigint;
  createdAt: number;
  paidAt: number;
  finalizeBlock: number;
  finalizeExtrinsicIndex: number;
  payouts: WorkPayoutClaimRecord[];
}

export interface WorkPayoutClaimRecord {
  recipient: string;
  amount: bigint;
  claimed: boolean;
}
