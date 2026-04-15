#![no_std]

use sails_rs::{
    cell::RefCell,
    collections::BTreeMap,
    gstd::{exec, msg},
    prelude::*,
};

type GroupId = u64;
type TokenId = u64;

#[derive(Clone, Debug, Default)]
pub struct EscrowStorage {
    group_id_counter: GroupId,
    token_counter: TokenId,
    groups: BTreeMap<GroupId, Group>,
    invoice_nfts: BTreeMap<TokenId, InvoiceNFT>,
    invoice_by_group: BTreeMap<GroupId, TokenId>,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct Group {
    pub id: GroupId,
    pub name: String,
    pub members: Vec<ActorId>,
    pub balances: Vec<MemberBalance>,
    pub expenses: Vec<Expense>,
    pub escrow: BTreeMap<ActorId, u128>,
    pub settlement_plan: Vec<SettlementTransfer>,
    pub settled: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct MemberBalance {
    pub member: ActorId,
    pub balance: i128,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct Expense {
    pub payer: ActorId,
    pub amount: u128,
    pub share_per_member: u128,
    pub remainder: u128,
    pub description: String,
    pub created_at: u64,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct SettlementTransfer {
    pub from: ActorId,
    pub to: ActorId,
    pub amount: u128,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct InvoiceNFT {
    pub token_id: TokenId,
    pub group_id: GroupId,
    pub transfers: Vec<SettlementTransfer>,
    pub total_settled: u128,
    pub settled_at: u64,
    pub finalize_block: u32,
    pub finalize_extrinsic_index: u32,
    pub payouts: Vec<PayoutRecord>,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct PayoutRecord {
    pub creditor: ActorId,
    pub amount: u128,
    pub claimed: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum VaraSplitEscrowError {
    AlreadySettled,
    AlreadyDeposited,
    BalanceOverflow,
    DuplicateMember,
    GroupNotFound,
    InvalidAmount,
    InvalidDepositAmount,
    InvalidDescription,
    InvalidGroupName,
    InvalidMemberCount,
    MemberNotFound,
    NotFullyFunded,
    NotGroupMember,
    SettlementAlreadyComputed,
    SettlementIncomplete,
    TokenIdOverflow,
    TransferFailed,
    PayoutAlreadyClaimed,
    PayoutNotFound,
}

#[sails_rs::event]
#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum VaraSplitEscrowEvent {
    GroupCreated {
        group_id: GroupId,
        name: String,
        members: Vec<ActorId>,
    },
    ExpenseAdded {
        group_id: GroupId,
        payer: ActorId,
        amount: u128,
        description: String,
    },
    SettlementComputed {
        group_id: GroupId,
        transfers: Vec<SettlementTransfer>,
        total_settled: u128,
    },
    DepositReceived {
        group_id: GroupId,
        from: ActorId,
        amount: u128,
    },
    SettlementFinalized {
        group_id: GroupId,
        total_settled: u128,
        token_id: TokenId,
    },
    InvoiceMinted {
        token_id: TokenId,
        group_id: GroupId,
    },
    PayoutDispatched {
        token_id: TokenId,
        creditor: ActorId,
        amount: u128,
    },
    PayoutClaimed {
        token_id: TokenId,
        creditor: ActorId,
        amount: u128,
    },
}

pub struct VaraSplitEscrowService<'a> {
    storage: &'a RefCell<EscrowStorage>,
}

impl<'a> VaraSplitEscrowService<'a> {
    pub fn new(storage: &'a RefCell<EscrowStorage>) -> Self {
        Self { storage }
    }

    fn next_group_id(storage: &mut EscrowStorage) -> GroupId {
        storage.group_id_counter = storage.group_id_counter.saturating_add(1);
        storage.group_id_counter
    }

    fn next_token_id(storage: &mut EscrowStorage) -> Result<TokenId, VaraSplitEscrowError> {
        let next = storage
            .token_counter
            .checked_add(1)
            .ok_or(VaraSplitEscrowError::TokenIdOverflow)?;
        storage.token_counter = next;
        Ok(next)
    }

    fn ensure_unique_members(members: &[ActorId]) -> Result<(), VaraSplitEscrowError> {
        let mut seen = BTreeMap::<ActorId, ()>::new();

        for member in members {
            if seen.insert(*member, ()).is_some() {
                return Err(VaraSplitEscrowError::DuplicateMember);
            }
        }

        Ok(())
    }

    fn ensure_member(group: &Group, member: ActorId) -> Result<(), VaraSplitEscrowError> {
        if group.members.contains(&member) {
            Ok(())
        } else {
            Err(VaraSplitEscrowError::NotGroupMember)
        }
    }

    fn update_member_balance(
        group: &mut Group,
        member: ActorId,
        change: i128,
    ) -> Result<(), VaraSplitEscrowError> {
        for entry in &mut group.balances {
            if entry.member == member {
                entry.balance = entry
                    .balance
                    .checked_add(change)
                    .ok_or(VaraSplitEscrowError::BalanceOverflow)?;
                return Ok(());
            }
        }

        Err(VaraSplitEscrowError::MemberNotFound)
    }

    fn compute_transfers(group: &Group) -> Vec<SettlementTransfer> {
        let mut creditors: Vec<(ActorId, i128)> = group
            .balances
            .iter()
            .filter_map(|entry| (entry.balance > 0).then_some((entry.member, entry.balance)))
            .collect();

        let mut debtors: Vec<(ActorId, i128)> = group
            .balances
            .iter()
            .filter_map(|entry| (entry.balance < 0).then_some((entry.member, -entry.balance)))
            .collect();

        let mut transfers = Vec::new();
        let mut creditor_index = 0;
        let mut debtor_index = 0;

        while creditor_index < creditors.len() && debtor_index < debtors.len() {
            let (creditor, credit_amount) = creditors[creditor_index];
            let (debtor, debt_amount) = debtors[debtor_index];
            let amount = credit_amount.min(debt_amount) as u128;

            if amount > 0 {
                transfers.push(SettlementTransfer {
                    from: debtor,
                    to: creditor,
                    amount,
                });
            }

            if credit_amount > debt_amount {
                creditors[creditor_index].1 -= debt_amount;
                debtor_index += 1;
            } else if credit_amount < debt_amount {
                debtors[debtor_index].1 -= credit_amount;
                creditor_index += 1;
            } else {
                creditor_index += 1;
                debtor_index += 1;
            }
        }

        transfers
    }

    fn required_deposit_amount(group: &Group, member: ActorId) -> u128 {
        group
            .settlement_plan
            .iter()
            .filter(|transfer| transfer.from == member)
            .fold(0u128, |total, transfer| total.saturating_add(transfer.amount))
    }

    fn ensure_funded(group: &Group) -> Result<(), VaraSplitEscrowError> {
        for transfer in &group.settlement_plan {
            let available = group.escrow.get(&transfer.from).copied().unwrap_or(0);
            if available < transfer.amount {
                return Err(VaraSplitEscrowError::NotFullyFunded);
            }
        }

        Ok(())
    }
}

#[sails_rs::service(events = VaraSplitEscrowEvent)]
impl VaraSplitEscrowService<'_> {
    #[export]
    pub fn create_group(
        &mut self,
        name: String,
        mut members: Vec<ActorId>,
    ) -> Result<Group, VaraSplitEscrowError> {
        if name.trim().is_empty() {
            return Err(VaraSplitEscrowError::InvalidGroupName);
        }

        let caller = msg::source();
        if !members.contains(&caller) {
            members.push(caller);
        }

        if members.len() < 2 {
            return Err(VaraSplitEscrowError::InvalidMemberCount);
        }

        VaraSplitEscrowService::ensure_unique_members(&members)?;

        let mut storage = self.storage.borrow_mut();
        let group_id = VaraSplitEscrowService::next_group_id(&mut storage);
        let balances = members
            .iter()
            .map(|member| MemberBalance {
                member: *member,
                balance: 0,
            })
            .collect();

        let group = Group {
            id: group_id,
            name: name.clone(),
            members: members.clone(),
            balances,
            expenses: Vec::new(),
            escrow: BTreeMap::new(),
            settlement_plan: Vec::new(),
            settled: false,
        };

        storage.groups.insert(group_id, group.clone());
        self.emit_event(VaraSplitEscrowEvent::GroupCreated {
            group_id,
            name,
            members,
        })
        .map_err(|_| VaraSplitEscrowError::TransferFailed)?;

        Ok(group)
    }

    #[export]
    pub fn add_expense(
        &mut self,
        group_id: GroupId,
        payer: ActorId,
        amount: u128,
        description: String,
    ) -> Result<Group, VaraSplitEscrowError> {
        if amount == 0 {
            return Err(VaraSplitEscrowError::InvalidAmount);
        }

        if description.trim().is_empty() {
            return Err(VaraSplitEscrowError::InvalidDescription);
        }

        let mut storage = self.storage.borrow_mut();
        let group = storage
            .groups
            .get_mut(&group_id)
            .ok_or(VaraSplitEscrowError::GroupNotFound)?;

        if group.settled {
            return Err(VaraSplitEscrowError::AlreadySettled);
        }

        VaraSplitEscrowService::ensure_member(group, payer)?;

        let member_count = group.members.len() as u128;
        if member_count == 0 {
            return Err(VaraSplitEscrowError::InvalidMemberCount);
        }

        let share_per_member = amount / member_count;
        let remainder = amount % member_count;
        let members = group.members.clone();

        for member in members {
            let change = if member == payer {
                let paid_share = amount.saturating_sub(share_per_member * (member_count - 1));
                paid_share as i128
            } else {
                -(share_per_member as i128)
            };
            VaraSplitEscrowService::update_member_balance(group, member, change)?;
        }

        group.expenses.push(Expense {
            payer,
            amount,
            share_per_member,
            remainder,
            description: description.clone(),
            created_at: exec::block_timestamp(),
        });

        let updated = group.clone();
        self.emit_event(VaraSplitEscrowEvent::ExpenseAdded {
            group_id,
            payer,
            amount,
            description,
        })
        .map_err(|_| VaraSplitEscrowError::TransferFailed)?;

        Ok(updated)
    }

    #[export]
    pub fn compute_settlement(
        &mut self,
        group_id: GroupId,
    ) -> Result<Group, VaraSplitEscrowError> {
        let mut storage = self.storage.borrow_mut();
        let group = storage
            .groups
            .get_mut(&group_id)
            .ok_or(VaraSplitEscrowError::GroupNotFound)?;

        if group.settled {
            return Err(VaraSplitEscrowError::AlreadySettled);
        }

        if !group.settlement_plan.is_empty() {
            return Err(VaraSplitEscrowError::SettlementAlreadyComputed);
        }

        let transfers = VaraSplitEscrowService::compute_transfers(group);
        let total_settled = transfers
            .iter()
            .fold(0u128, |sum, transfer| sum.saturating_add(transfer.amount));
        group.settlement_plan = transfers.clone();

        let updated = group.clone();
        self.emit_event(VaraSplitEscrowEvent::SettlementComputed {
            group_id,
            transfers,
            total_settled,
        })
        .map_err(|_| VaraSplitEscrowError::TransferFailed)?;

        Ok(updated)
    }

    #[export]
    pub fn deposit(&mut self, group_id: GroupId) -> Result<Group, VaraSplitEscrowError> {
        let caller = msg::source();
        let amount = msg::value();

        let mut storage = self.storage.borrow_mut();
        let group = storage
            .groups
            .get_mut(&group_id)
            .ok_or(VaraSplitEscrowError::GroupNotFound)?;

        if group.settled {
            return Err(VaraSplitEscrowError::AlreadySettled);
        }

        VaraSplitEscrowService::ensure_member(group, caller)?;

        if group.settlement_plan.is_empty() {
            return Err(VaraSplitEscrowError::SettlementIncomplete);
        }

        let required = VaraSplitEscrowService::required_deposit_amount(group, caller);
        if required == 0 || amount != required {
            return Err(VaraSplitEscrowError::InvalidDepositAmount);
        }

        if group.escrow.get(&caller).copied().unwrap_or(0) > 0 {
            return Err(VaraSplitEscrowError::AlreadyDeposited);
        }

        group.escrow.insert(caller, amount);

        let updated = group.clone();
        self.emit_event(VaraSplitEscrowEvent::DepositReceived {
            group_id,
            from: caller,
            amount,
        })
        .map_err(|_| VaraSplitEscrowError::TransferFailed)?;

        Ok(updated)
    }

    #[export]
    pub fn finalize_settlement(
        &mut self,
        group_id: GroupId,
        finalize_block: u32,
        finalize_extrinsic_index: u32,
    ) -> Result<InvoiceNFT, VaraSplitEscrowError> {
        let mut storage = self.storage.borrow_mut();
        let (settlement_plan, payouts) = {
            let group = storage
                .groups
                .get_mut(&group_id)
                .ok_or(VaraSplitEscrowError::GroupNotFound)?;

            if group.settled {
                return Err(VaraSplitEscrowError::AlreadySettled);
            }

            if group.settlement_plan.is_empty() {
                return Err(VaraSplitEscrowError::SettlementIncomplete);
            }

            VaraSplitEscrowService::ensure_funded(group)?;
            let settlement_plan = group.settlement_plan.clone();
            let mut payouts = Vec::new();

            for transfer in &settlement_plan {
                let from_balance = group.escrow.get(&transfer.from).copied().unwrap_or(0);
                group.escrow.insert(transfer.from, from_balance - transfer.amount);
                payouts.push(PayoutRecord {
                    creditor: transfer.to,
                    amount: transfer.amount,
                    claimed: false,
                });
            }

            group.settled = true;
            group.settlement_plan.clear();
            group.escrow.clear();
            for balance in &mut group.balances {
                balance.balance = 0;
            }

            (settlement_plan, payouts)
        };

        let total_settled = settlement_plan
            .iter()
            .fold(0u128, |sum, transfer| sum.saturating_add(transfer.amount));
        let token_id = VaraSplitEscrowService::next_token_id(&mut storage)?;
        let invoice = InvoiceNFT {
            token_id,
            group_id,
            transfers: settlement_plan,
            total_settled,
            settled_at: exec::block_timestamp(),
            finalize_block,
            finalize_extrinsic_index,
            payouts: payouts.clone(),
        };

        storage.invoice_by_group.insert(group_id, token_id);
        storage.invoice_nfts.insert(token_id, invoice.clone());

        self.emit_event(VaraSplitEscrowEvent::SettlementFinalized {
            group_id,
            total_settled,
            token_id,
        })
        .map_err(|_| VaraSplitEscrowError::TransferFailed)?;
        self.emit_event(VaraSplitEscrowEvent::InvoiceMinted { token_id, group_id })
            .map_err(|_| VaraSplitEscrowError::TransferFailed)?;
        for payout in payouts {
            self.emit_event(VaraSplitEscrowEvent::PayoutDispatched {
                token_id,
                creditor: payout.creditor,
                amount: payout.amount,
            })
            .map_err(|_| VaraSplitEscrowError::TransferFailed)?;
        }

        Ok(invoice)
    }

    #[export]
    pub fn claim_payout(&mut self, token_id: TokenId) -> Result<InvoiceNFT, VaraSplitEscrowError> {
        let caller = msg::source();
        let mut storage = self.storage.borrow_mut();
        let invoice = storage
            .invoice_nfts
            .get_mut(&token_id)
            .ok_or(VaraSplitEscrowError::GroupNotFound)?;

        let payout = invoice
            .payouts
            .iter_mut()
            .find(|payout| payout.creditor == caller)
            .ok_or(VaraSplitEscrowError::PayoutNotFound)?;

        if payout.claimed {
            return Err(VaraSplitEscrowError::PayoutAlreadyClaimed);
        }

        payout.claimed = true;
        let amount = payout.amount;
        msg::send(caller, (), amount).map_err(|_| {
            payout.claimed = false;
            VaraSplitEscrowError::TransferFailed
        })?;

        let updated = invoice.clone();
        self.emit_event(VaraSplitEscrowEvent::PayoutClaimed {
            token_id,
            creditor: caller,
            amount,
        })
        .map_err(|_| VaraSplitEscrowError::TransferFailed)?;

        Ok(updated)
    }

    #[export]
    pub fn record_finalize_reference(
        &mut self,
        token_id: TokenId,
        finalize_block: u32,
        finalize_extrinsic_index: u32,
    ) -> Result<InvoiceNFT, VaraSplitEscrowError> {
        if finalize_block == 0 {
            return Err(VaraSplitEscrowError::InvalidAmount);
        }

        let mut storage = self.storage.borrow_mut();
        let invoice = storage
            .invoice_nfts
            .get_mut(&token_id)
            .ok_or(VaraSplitEscrowError::GroupNotFound)?;

        if invoice.finalize_block != 0 {
            if invoice.finalize_block == finalize_block
                && invoice.finalize_extrinsic_index == finalize_extrinsic_index
            {
                return Ok(invoice.clone());
            }

            return Err(VaraSplitEscrowError::AlreadySettled);
        }

        invoice.finalize_block = finalize_block;
        invoice.finalize_extrinsic_index = finalize_extrinsic_index;
        Ok(invoice.clone())
    }

    #[export]
    pub fn get_group(&self, group_id: GroupId) -> Result<Group, VaraSplitEscrowError> {
        let storage = self.storage.borrow();
        storage
            .groups
            .get(&group_id)
            .cloned()
            .ok_or(VaraSplitEscrowError::GroupNotFound)
    }

    #[export]
    pub fn get_settlement_plan(
        &self,
        group_id: GroupId,
    ) -> Result<Vec<SettlementTransfer>, VaraSplitEscrowError> {
        let storage = self.storage.borrow();
        let group = storage
            .groups
            .get(&group_id)
            .ok_or(VaraSplitEscrowError::GroupNotFound)?;

        Ok(group.settlement_plan.clone())
    }

    #[export]
    pub fn get_invoice(&self, group_id: GroupId) -> Result<InvoiceNFT, VaraSplitEscrowError> {
        let storage = self.storage.borrow();
        let token_id = storage
            .invoice_by_group
            .get(&group_id)
            .copied()
            .ok_or(VaraSplitEscrowError::GroupNotFound)?;

        storage
            .invoice_nfts
            .get(&token_id)
            .cloned()
            .ok_or(VaraSplitEscrowError::GroupNotFound)
    }

    #[export]
    pub fn get_invoice_by_token(
        &self,
        token_id: TokenId,
    ) -> Result<InvoiceNFT, VaraSplitEscrowError> {
        let storage = self.storage.borrow();
        storage
            .invoice_nfts
            .get(&token_id)
            .cloned()
            .ok_or(VaraSplitEscrowError::GroupNotFound)
    }
}

pub struct Program {
    storage: RefCell<EscrowStorage>,
}

#[sails_rs::program]
impl Program {
    pub fn create() -> Self {
        Self {
            storage: RefCell::new(EscrowStorage::default()),
        }
    }

    pub fn vara_split_escrow(&self) -> VaraSplitEscrowService<'_> {
        VaraSplitEscrowService::new(&self.storage)
    }
}
