#![no_std]

use sails_rs::{
    cell::RefCell,
    collections::BTreeMap,
    gstd::{exec, msg},
    prelude::*,
};

type GroupId = u64;

#[derive(Clone, Debug, Default)]
pub struct VaraSplitState {
    group_id_counter: GroupId,
    groups: BTreeMap<GroupId, Group>,
}

#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct Group {
    pub name: String,
    pub members: Vec<ActorId>,
    pub balances: BTreeMap<ActorId, i128>,
    pub expenses: Vec<Expense>,
}

#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
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
pub struct MemberBalance {
    pub member: ActorId,
    pub balance: i128,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct SettlementTransfer {
    pub from: ActorId,
    pub to: ActorId,
    pub amount: u128,
}

#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct GroupView {
    pub id: GroupId,
    pub name: String,
    pub members: Vec<ActorId>,
    pub balances: Vec<MemberBalance>,
    pub expenses: Vec<Expense>,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct GroupSettlement {
    pub group_id: GroupId,
    pub transfers: Vec<SettlementTransfer>,
    pub total_settled: u128,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
#[sails_rs::event]
pub enum VaraSplitEvent {
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
    GroupSettled {
        group_id: GroupId,
        transfers: Vec<SettlementTransfer>,
        total_settled: u128,
    },
    PaymentConfirmed {
        group_id: GroupId,
        from: ActorId,
        to: ActorId,
        amount: u128,
    },
}

pub struct VaraSplitService<'a> {
    state: &'a RefCell<VaraSplitState>,
}

impl<'a> VaraSplitService<'a> {
    pub fn new(state: &'a RefCell<VaraSplitState>) -> Self {
        Self { state }
    }

    fn ensure_unique_members(&self, members: Vec<ActorId>) -> Vec<ActorId> {
        let mut seen = BTreeMap::<ActorId, ()>::new();
        let mut unique = Vec::new();

        for member in members {
            if seen.insert(member, ()).is_none() {
                unique.push(member);
            }
        }

        assert!(unique.len() >= 2, "A group must have at least two unique members");
        unique
    }

    fn group_view(id: GroupId, group: &Group) -> GroupView {
        let balances = group
            .members
            .iter()
            .map(|member| MemberBalance {
                member: *member,
                balance: *group.balances.get(member).unwrap_or(&0),
            })
            .collect();

        GroupView {
            id,
            name: group.name.clone(),
            members: group.members.clone(),
            balances,
            expenses: group.expenses.clone(),
        }
    }

    fn amount_to_i128(amount: u128) -> i128 {
        i128::try_from(amount).expect("Amount is too large")
    }

    fn assert_member(group: &Group, member: ActorId, reason: &str) {
        assert!(group.members.contains(&member), "{reason}");
    }

    fn compute_settlement_transfers(group: &Group) -> Vec<SettlementTransfer> {
        let mut debtors = Vec::<(ActorId, u128)>::new();
        let mut creditors = Vec::<(ActorId, u128)>::new();

        for member in &group.members {
            let balance = *group.balances.get(member).unwrap_or(&0);
            if balance < 0 {
                debtors.push((*member, balance.unsigned_abs()));
            } else if balance > 0 {
                creditors.push((*member, balance as u128));
            }
        }

        let mut transfers = Vec::new();
        let mut debtor_index = 0usize;
        let mut creditor_index = 0usize;

        while debtor_index < debtors.len() && creditor_index < creditors.len() {
            let (from, debt) = debtors[debtor_index];
            let (to, credit) = creditors[creditor_index];
            let amount = debt.min(credit);

            if amount > 0 {
                transfers.push(SettlementTransfer { from, to, amount });
            }

            debtors[debtor_index].1 -= amount;
            creditors[creditor_index].1 -= amount;

            if debtors[debtor_index].1 == 0 {
                debtor_index += 1;
            }

            if creditors[creditor_index].1 == 0 {
                creditor_index += 1;
            }
        }

        transfers
    }

    fn matching_transfer_amount(group: &Group, from: ActorId, to: ActorId) -> u128 {
        VaraSplitService::compute_settlement_transfers(group)
            .into_iter()
            .find(|transfer| transfer.from == from && transfer.to == to)
            .map(|transfer| transfer.amount)
            .unwrap_or(0)
    }
}

#[sails_rs::service(events = VaraSplitEvent)]
impl VaraSplitService<'_> {
    #[export]
    pub fn create_group(&mut self, name: String, members: Vec<ActorId>) -> GroupView {
        assert!(!name.trim().is_empty(), "Group name cannot be empty");

        let members = self.ensure_unique_members(members);
        let mut balances = BTreeMap::new();

        for member in &members {
            balances.insert(*member, 0);
        }

        let mut state = self.state.borrow_mut();
        let group_id = state.group_id_counter;
        state.group_id_counter = state
            .group_id_counter
            .checked_add(1)
            .expect("Group id overflow");

        let group = Group {
            name: name.clone(),
            members: members.clone(),
            balances,
            expenses: Vec::new(),
        };

        state.groups.insert(group_id, group.clone());

        self.emit_event(VaraSplitEvent::GroupCreated {
            group_id,
            name,
            members,
        })
        .expect("Failed to emit GroupCreated event");

        VaraSplitService::group_view(group_id, &group)
    }

    #[export]
    pub fn add_expense(
        &mut self,
        group_id: GroupId,
        payer: ActorId,
        amount: u128,
        description: String,
    ) -> GroupView {
        assert!(amount > 0, "Amount must be greater than zero");
        assert!(!description.trim().is_empty(), "Description cannot be empty");

        let caller = msg::source();
        let amount_i128 = VaraSplitService::amount_to_i128(amount);

        let mut state = self.state.borrow_mut();
        let group = state.groups.get_mut(&group_id).expect("Group not found");
        VaraSplitService::assert_member(group, caller, "Only group members can add expenses");
        VaraSplitService::assert_member(group, payer, "Payer must be a group member");

        let member_count = u128::try_from(group.members.len()).expect("Too many members");
        let share_per_member = amount / member_count;
        let remainder = amount % member_count;

        for (index, member) in group.members.iter().enumerate() {
            let extra = if u128::try_from(index).expect("Index overflow") < remainder {
                1
            } else {
                0
            };

            let owed_share = share_per_member
                .checked_add(extra)
                .expect("Share overflow");
            let owed_share_i128 = VaraSplitService::amount_to_i128(owed_share);
            let balance = group
                .balances
                .get_mut(member)
                .expect("Missing member balance entry");

            *balance = balance
                .checked_sub(owed_share_i128)
                .expect("Balance underflow while splitting expense");
        }

        let payer_balance = group
            .balances
            .get_mut(&payer)
            .expect("Missing payer balance entry");
        *payer_balance = payer_balance
            .checked_add(amount_i128)
            .expect("Balance overflow while crediting payer");

        group.expenses.push(Expense {
            payer,
            amount,
            share_per_member,
            remainder,
            description: description.clone(),
            created_at: exec::block_timestamp(),
        });

        let view = VaraSplitService::group_view(group_id, group);

        self.emit_event(VaraSplitEvent::ExpenseAdded {
            group_id,
            payer,
            amount,
            description,
        })
        .expect("Failed to emit ExpenseAdded event");

        view
    }

    #[export]
    pub fn get_group(&self, group_id: GroupId) -> GroupView {
        let state = self.state.borrow();
        let group = state.groups.get(&group_id).expect("Group not found");
        VaraSplitService::group_view(group_id, group)
    }

    #[export]
    pub fn get_balances(&self, group_id: GroupId) -> Vec<MemberBalance> {
        self.get_group(group_id).balances
    }

    #[export]
    pub fn get_settlement_plan(&self, group_id: GroupId) -> Vec<SettlementTransfer> {
        let state = self.state.borrow();
        let group = state.groups.get(&group_id).expect("Group not found");
        VaraSplitService::compute_settlement_transfers(group)
    }

    #[export]
    pub fn settle_group(&mut self, group_id: GroupId) -> GroupSettlement {
        let caller = msg::source();
        let mut state = self.state.borrow_mut();
        let group = state.groups.get_mut(&group_id).expect("Group not found");
        VaraSplitService::assert_member(group, caller, "Only group members can settle the group");

        let transfers = VaraSplitService::compute_settlement_transfers(group);
        let total_settled = transfers.iter().fold(0u128, |acc: u128, transfer| {
            acc.checked_add(transfer.amount).expect("Settlement overflow")
        });

        for member in &group.members {
            let balance = group
                .balances
                .get_mut(member)
                .expect("Missing member balance entry");
            *balance = 0;
        }

        let settlement = GroupSettlement {
            group_id,
            transfers: transfers.clone(),
            total_settled,
        };

        self.emit_event(VaraSplitEvent::GroupSettled {
            group_id,
            transfers,
            total_settled,
        })
        .expect("Failed to emit GroupSettled event");

        settlement
    }

    #[export]
    pub fn confirm_payment(
        &mut self,
        group_id: GroupId,
        from: ActorId,
        to: ActorId,
        amount: u128,
    ) -> GroupView {
        assert!(amount > 0, "Amount must be greater than zero");

        let caller = msg::source();
        let amount_i128 = VaraSplitService::amount_to_i128(amount);

        let mut state = self.state.borrow_mut();
        let group = state.groups.get_mut(&group_id).expect("Group not found");

        VaraSplitService::assert_member(group, from, "Sender must be a group member");
        VaraSplitService::assert_member(group, to, "Recipient must be a group member");
        assert_eq!(caller, from, "Only the sender can confirm payment");

        let outstanding_amount = VaraSplitService::matching_transfer_amount(group, from, to);
        assert!(outstanding_amount > 0, "No matching debt from sender to recipient");
        assert!(
            amount <= outstanding_amount,
            "Confirmed amount exceeds outstanding debt"
        );

        let sender_balance = group
            .balances
            .get_mut(&from)
            .expect("Missing sender balance entry");
        *sender_balance = sender_balance
            .checked_add(amount_i128)
            .expect("Balance overflow while reducing sender debt");

        let recipient_balance = group
            .balances
            .get_mut(&to)
            .expect("Missing recipient balance entry");
        *recipient_balance = recipient_balance
            .checked_sub(amount_i128)
            .expect("Balance underflow while reducing recipient credit");

        let view = VaraSplitService::group_view(group_id, group);

        self.emit_event(VaraSplitEvent::PaymentConfirmed {
            group_id,
            from,
            to,
            amount,
        })
        .expect("Failed to emit PaymentConfirmed event");

        view
    }
}

pub struct Program {
    state: RefCell<VaraSplitState>,
}

#[sails_rs::program]
impl Program {
    pub fn create() -> Self {
        Self {
            state: RefCell::new(VaraSplitState::default()),
        }
    }

    pub fn vara_split(&self) -> VaraSplitService<'_> {
        VaraSplitService::new(&self.state)
    }
}
