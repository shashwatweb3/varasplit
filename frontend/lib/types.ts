export interface WalletAccount {
  address: string;
  meta: {
    name?: string;
    source: string;
  };
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

export interface GroupView {
  id: number;
  name: string;
  members: string[];
  balances: MemberBalance[];
  expenses: Expense[];
}

export interface SettlementTransfer {
  from: string;
  to: string;
  amount: bigint;
}

export interface GroupSettlement {
  groupId: number;
  transfers: SettlementTransfer[];
  totalSettled: bigint;
}

export interface GroupSummaryCard {
  title: string;
  body: string;
  tweetUrl: string;
}

export interface PaymentReceipt {
  blockHash: string;
}

export interface VaraSplitAdapter {
  createGroup: (name: string, members: string[], account: WalletAccount) => Promise<GroupView>;
  getGroup: (groupId: number, account?: WalletAccount | null) => Promise<GroupView>;
  addExpense: (
    groupId: number,
    payer: string,
    amount: bigint,
    description: string,
    account: WalletAccount,
  ) => Promise<GroupView>;
  getSettlementPlan: (groupId: number, account?: WalletAccount | null) => Promise<SettlementTransfer[]>;
  settleGroup: (groupId: number, account: WalletAccount) => Promise<GroupSettlement>;
  confirmPayment: (
    groupId: number,
    from: string,
    to: string,
    amount: bigint,
    account: WalletAccount,
  ) => Promise<unknown>;
  paySettlementTransfer: (to: string, amount: bigint, account: WalletAccount) => Promise<PaymentReceipt>;
}
