import type { CreditorStatus, DebtorStatus, Group, InvoiceNft, SettlementTransfer } from './types';
import { normalizeActorId } from './format';

export function getMemberOwedAmount(_group: Group, settlementPlan: SettlementTransfer[], address: string) {
  const key = normalizeActorId(address);
  return settlementPlan
    .filter((transfer) => normalizeActorId(transfer.from) === key)
    .reduce((total, transfer) => total + transfer.amount, BigInt(0));
}

export function getMemberDepositedAmount(group: Group, address: string) {
  const key = normalizeActorId(address);
  return group.escrow[key] ?? BigInt(0);
}

export function isMemberFullyPaid(group: Group, settlementPlan: SettlementTransfer[], address: string) {
  const owed = getMemberOwedAmount(group, settlementPlan, address);
  if (owed === BigInt(0)) return true;
  return getMemberDepositedAmount(group, address) >= owed;
}

export function getDebtors(group: Group, settlementPlan: SettlementTransfer[]): DebtorStatus[] {
  const required = settlementPlan.reduce<Record<string, DebtorStatus>>((acc, transfer) => {
    const key = normalizeActorId(transfer.from);
    const current = acc[key] ?? {
      address: key,
      required: BigInt(0),
      deposited: getMemberDepositedAmount(group, key),
      remaining: BigInt(0),
      paid: false,
    };
    current.required += transfer.amount;
    current.remaining = current.required > current.deposited ? current.required - current.deposited : BigInt(0);
    current.paid = current.required > BigInt(0) && current.deposited >= current.required;
    acc[key] = current;
    return acc;
  }, {});

  return Object.values(required);
}

export function getCreditors(settlementPlan: SettlementTransfer[]): CreditorStatus[] {
  const totals = settlementPlan.reduce<Record<string, CreditorStatus>>((acc, transfer) => {
    const key = normalizeActorId(transfer.to);
    const current = acc[key] ?? { address: key, amount: BigInt(0) };
    current.amount += transfer.amount;
    acc[key] = current;
    return acc;
  }, {});

  return Object.values(totals);
}

export function isGroupFullyFunded(group: Group, settlementPlan: SettlementTransfer[]) {
  const debtors = getDebtors(group, settlementPlan);
  return debtors.length > 0 && debtors.every((debtor) => debtor.paid);
}

export function isGroupFinalized(group: Group | null, invoice: InvoiceNft | null) {
  return Boolean(group?.settled || invoice);
}
