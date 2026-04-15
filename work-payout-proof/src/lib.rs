#![no_std]

use sails_rs::{
    cell::RefCell,
    collections::BTreeMap,
    gstd::{exec, msg},
    prelude::*,
};

type PayoutId = u64;
type TokenId = u64;
const MAX_PAYER_NAME_LEN: usize = 128;
const MAX_RECIPIENT_NAME_LEN: usize = 128;
const MAX_TITLE_LEN: usize = 160;
const MAX_REASON_LEN: usize = 1_024;
const MAX_RECIPIENTS: usize = 64;

#[derive(Clone, Debug, Default)]
pub struct WorkPayoutStorage {
    payout_counter: PayoutId,
    token_counter: TokenId,
    payouts: BTreeMap<PayoutId, WorkPayout>,
    proofs: BTreeMap<TokenId, ProofInvoice>,
    proof_by_payout: BTreeMap<PayoutId, TokenId>,
    escrow: BTreeMap<PayoutId, u128>,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum PayoutCategory {
    Freelance,
    Bounty,
    Salary,
    Custom,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct RecipientEntry {
    pub name: String,
    pub wallet: ActorId,
    pub amount: u128,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct WorkPayout {
    pub id: PayoutId,
    pub payer_name: String,
    pub payer_wallet: ActorId,
    pub recipients: Vec<RecipientEntry>,
    pub title: String,
    pub reason: String,
    pub category: PayoutCategory,
    pub total_amount: u128,
    pub funded: bool,
    pub completed: bool,
    pub proof_token_id: Option<TokenId>,
    pub created_at: u64,
    pub paid_at: Option<u64>,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct ProofInvoice {
    pub token_id: TokenId,
    pub payout_id: PayoutId,
    pub payer_name: String,
    pub payer_wallet: ActorId,
    pub recipients: Vec<RecipientEntry>,
    pub title: String,
    pub reason: String,
    pub category: PayoutCategory,
    pub total_amount: u128,
    pub created_at: u64,
    pub paid_at: u64,
    pub finalize_block: u32,
    pub finalize_extrinsic_index: u32,
    pub payouts: Vec<PayoutRecord>,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct PayoutRecord {
    pub recipient: ActorId,
    pub amount: u128,
    pub claimed: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum WorkPayoutProofError {
    AlreadyCompleted,
    AlreadyFunded,
    InvalidAmount,
    InvalidCategory,
    InvalidDescription,
    InvalidPayerName,
    InvalidRecipient,
    InvalidRecipientCount,
    InvalidTitle,
    NotFunded,
    NotPayer,
    PayoutNotFound,
    ProofNotFound,
    TokenIdOverflow,
    TransferFailed,
    PayoutAlreadyClaimed,
    PayoutNotFoundForRecipient,
}

#[sails_rs::event]
#[derive(Clone, Debug, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum WorkPayoutProofEvent {
    PayoutCreated {
        payout_id: PayoutId,
        payer_wallet: ActorId,
        total_amount: u128,
    },
    PayoutFunded {
        payout_id: PayoutId,
        payer_wallet: ActorId,
        amount: u128,
    },
    PayoutFinalized {
        payout_id: PayoutId,
        token_id: TokenId,
        total_amount: u128,
    },
    ProofMinted {
        token_id: TokenId,
        payout_id: PayoutId,
    },
    RecipientPaid {
        token_id: TokenId,
        recipient: ActorId,
        amount: u128,
    },
    PayoutClaimed {
        token_id: TokenId,
        recipient: ActorId,
        amount: u128,
    },
}

pub struct WorkPayoutProofService<'a> {
    storage: &'a RefCell<WorkPayoutStorage>,
}

impl<'a> WorkPayoutProofService<'a> {
    pub fn new(storage: &'a RefCell<WorkPayoutStorage>) -> Self {
        Self { storage }
    }

    fn next_payout_id(storage: &mut WorkPayoutStorage) -> PayoutId {
        storage.payout_counter = storage.payout_counter.saturating_add(1);
        storage.payout_counter
    }

    fn next_token_id(storage: &mut WorkPayoutStorage) -> Result<TokenId, WorkPayoutProofError> {
        let next = storage
            .token_counter
            .checked_add(1)
            .ok_or(WorkPayoutProofError::TokenIdOverflow)?;
        storage.token_counter = next;
        Ok(next)
    }

    fn validate_payer_name(value: &str) -> Result<(), WorkPayoutProofError> {
        let trimmed = value.trim();
        if trimmed.is_empty() || trimmed.len() > MAX_PAYER_NAME_LEN {
            return Err(WorkPayoutProofError::InvalidPayerName);
        }

        Ok(())
    }

    fn validate_title(value: &str) -> Result<(), WorkPayoutProofError> {
        let trimmed = value.trim();
        if trimmed.is_empty() || trimmed.len() > MAX_TITLE_LEN {
            return Err(WorkPayoutProofError::InvalidTitle);
        }

        Ok(())
    }

    fn validate_reason(value: &str) -> Result<(), WorkPayoutProofError> {
        let trimmed = value.trim();
        if trimmed.is_empty() || trimmed.len() > MAX_REASON_LEN {
            return Err(WorkPayoutProofError::InvalidDescription);
        }

        Ok(())
    }

    fn validate_category(category: &PayoutCategory) -> Result<(), WorkPayoutProofError> {
        match category {
            PayoutCategory::Freelance
            | PayoutCategory::Bounty
            | PayoutCategory::Salary
            | PayoutCategory::Custom => Ok(()),
        }
    }

    fn validate_recipients(recipients: &[RecipientEntry]) -> Result<u128, WorkPayoutProofError> {
        if recipients.is_empty() || recipients.len() > MAX_RECIPIENTS {
            return Err(WorkPayoutProofError::InvalidRecipientCount);
        }

        let mut seen = BTreeMap::<ActorId, ()>::new();
        let mut total = 0u128;

        for recipient in recipients {
            let recipient_name = recipient.name.trim();
            if recipient_name.is_empty()
                || recipient_name.len() > MAX_RECIPIENT_NAME_LEN
                || recipient.amount == 0
            {
                return Err(WorkPayoutProofError::InvalidRecipient);
            }

            if seen.insert(recipient.wallet, ()).is_some() {
                return Err(WorkPayoutProofError::InvalidRecipient);
            }

            total = total
                .checked_add(recipient.amount)
                .ok_or(WorkPayoutProofError::InvalidAmount)?;
        }

        if total == 0 {
            return Err(WorkPayoutProofError::InvalidAmount);
        }

        Ok(total)
    }
}

#[sails_rs::service(events = WorkPayoutProofEvent)]
impl WorkPayoutProofService<'_> {
    #[export]
    pub fn create_payout(
        &mut self,
        payer_name: String,
        recipients: Vec<RecipientEntry>,
        title: String,
        reason: String,
        category: PayoutCategory,
    ) -> Result<WorkPayout, WorkPayoutProofError> {
        WorkPayoutProofService::validate_payer_name(&payer_name)?;
        WorkPayoutProofService::validate_title(&title)?;
        WorkPayoutProofService::validate_reason(&reason)?;
        WorkPayoutProofService::validate_category(&category)?;

        let total_amount = WorkPayoutProofService::validate_recipients(&recipients)?;
        let payer_wallet = msg::source();

        let mut storage = self.storage.borrow_mut();
        let payout_id = WorkPayoutProofService::next_payout_id(&mut storage);
        let payout = WorkPayout {
            id: payout_id,
            payer_name,
            payer_wallet,
            recipients,
            title,
            reason,
            category,
            total_amount,
            funded: false,
            completed: false,
            proof_token_id: None,
            created_at: exec::block_timestamp(),
            paid_at: None,
        };

        storage.payouts.insert(payout_id, payout.clone());
        self.emit_event(WorkPayoutProofEvent::PayoutCreated {
            payout_id,
            payer_wallet,
            total_amount,
        })
        .map_err(|_| WorkPayoutProofError::TransferFailed)?;

        Ok(payout)
    }

    #[export]
    pub fn fund_payout(&mut self, payout_id: PayoutId) -> Result<WorkPayout, WorkPayoutProofError> {
        let caller = msg::source();
        let amount = msg::value();
        let mut storage = self.storage.borrow_mut();
        let updated = {
            let payout = storage
                .payouts
                .get_mut(&payout_id)
                .ok_or(WorkPayoutProofError::PayoutNotFound)?;

            if caller != payout.payer_wallet {
                return Err(WorkPayoutProofError::NotPayer);
            }
            if payout.completed {
                return Err(WorkPayoutProofError::AlreadyCompleted);
            }
            if payout.funded {
                return Err(WorkPayoutProofError::AlreadyFunded);
            }
            if amount != payout.total_amount {
                return Err(WorkPayoutProofError::InvalidAmount);
            }

            payout.funded = true;
            payout.clone()
        };

        storage.escrow.insert(payout_id, amount);
        self.emit_event(WorkPayoutProofEvent::PayoutFunded {
            payout_id,
            payer_wallet: caller,
            amount,
        })
        .map_err(|_| WorkPayoutProofError::TransferFailed)?;

        Ok(updated)
    }

    #[export]
    pub fn finalize_payout(
        &mut self,
        payout_id: PayoutId,
        finalize_block: u32,
        finalize_extrinsic_index: u32,
    ) -> Result<ProofInvoice, WorkPayoutProofError> {
        let caller = msg::source();
        let mut storage = self.storage.borrow_mut();
        let payout_snapshot = {
            let payout = storage
                .payouts
                .get(&payout_id)
                .ok_or(WorkPayoutProofError::PayoutNotFound)?;

            if caller != payout.payer_wallet {
                return Err(WorkPayoutProofError::NotPayer);
            }
            if payout.completed {
                return Err(WorkPayoutProofError::AlreadyCompleted);
            }
            if !payout.funded {
                return Err(WorkPayoutProofError::NotFunded);
            }

            payout.clone()
        };

        let paid_at = exec::block_timestamp();
        let token_id = WorkPayoutProofService::next_token_id(&mut storage)?;
        let payouts = payout_snapshot
            .recipients
            .iter()
            .map(|recipient| PayoutRecord {
                recipient: recipient.wallet,
                amount: recipient.amount,
                claimed: false,
            })
            .collect::<Vec<_>>();

        let invoice = ProofInvoice {
            token_id,
            payout_id,
            payer_name: payout_snapshot.payer_name.clone(),
            payer_wallet: payout_snapshot.payer_wallet,
            recipients: payout_snapshot.recipients.clone(),
            title: payout_snapshot.title.clone(),
            reason: payout_snapshot.reason.clone(),
            category: payout_snapshot.category.clone(),
            total_amount: payout_snapshot.total_amount,
            created_at: payout_snapshot.created_at,
            paid_at,
            finalize_block,
            finalize_extrinsic_index,
            payouts,
        };

        let payout = storage
            .payouts
            .get_mut(&payout_id)
            .ok_or(WorkPayoutProofError::PayoutNotFound)?;
        payout.completed = true;
        payout.proof_token_id = Some(token_id);
        payout.paid_at = Some(paid_at);

        storage.proof_by_payout.insert(payout_id, token_id);
        storage.proofs.insert(token_id, invoice.clone());

        self.emit_event(WorkPayoutProofEvent::PayoutFinalized {
            payout_id,
            token_id,
            total_amount: invoice.total_amount,
        })
        .map_err(|_| WorkPayoutProofError::TransferFailed)?;
        self.emit_event(WorkPayoutProofEvent::ProofMinted { token_id, payout_id })
            .map_err(|_| WorkPayoutProofError::TransferFailed)?;

        Ok(invoice)
    }

    #[export]
    pub fn claim_payout(&mut self, token_id: TokenId) -> Result<ProofInvoice, WorkPayoutProofError> {
        let caller = msg::source();
        let mut storage = self.storage.borrow_mut();

        let (payout_id, amount) = {
            let invoice = storage
                .proofs
                .get_mut(&token_id)
                .ok_or(WorkPayoutProofError::ProofNotFound)?;

            let payout = invoice
                .payouts
                .iter_mut()
                .find(|payout| payout.recipient == caller)
                .ok_or(WorkPayoutProofError::PayoutNotFoundForRecipient)?;

            if payout.claimed {
                return Err(WorkPayoutProofError::PayoutAlreadyClaimed);
            }

            payout.claimed = true;
            (invoice.payout_id, payout.amount)
        };

        let escrowed = storage.escrow.get(&payout_id).copied().unwrap_or(0);
        if escrowed < amount {
            if let Some(invoice) = storage.proofs.get_mut(&token_id) {
                if let Some(payout) = invoice
                    .payouts
                    .iter_mut()
                    .find(|payout| payout.recipient == caller)
                {
                    payout.claimed = false;
                }
            }
            return Err(WorkPayoutProofError::TransferFailed);
        }

        let remaining = escrowed - amount;
        if remaining == 0 {
            storage.escrow.remove(&payout_id);
        } else {
            storage.escrow.insert(payout_id, remaining);
        }

        if msg::send(caller, (), amount).is_err() {
            if let Some(invoice) = storage.proofs.get_mut(&token_id) {
                if let Some(payout) = invoice
                    .payouts
                    .iter_mut()
                    .find(|payout| payout.recipient == caller)
                {
                    payout.claimed = false;
                }
            }
            storage.escrow.insert(payout_id, escrowed);
            return Err(WorkPayoutProofError::TransferFailed);
        }

        let updated = storage
            .proofs
            .get(&token_id)
            .cloned()
            .ok_or(WorkPayoutProofError::ProofNotFound)?;

        self.emit_event(WorkPayoutProofEvent::RecipientPaid {
            token_id,
            recipient: caller,
            amount,
        })
        .map_err(|_| WorkPayoutProofError::TransferFailed)?;
        self.emit_event(WorkPayoutProofEvent::PayoutClaimed {
            token_id,
            recipient: caller,
            amount,
        })
        .map_err(|_| WorkPayoutProofError::TransferFailed)?;

        Ok(updated)
    }

    #[export]
    pub fn get_payout(&self, payout_id: PayoutId) -> Result<WorkPayout, WorkPayoutProofError> {
        let storage = self.storage.borrow();
        storage
            .payouts
            .get(&payout_id)
            .cloned()
            .ok_or(WorkPayoutProofError::PayoutNotFound)
    }

    #[export]
    pub fn get_proof(&self, payout_id: PayoutId) -> Result<ProofInvoice, WorkPayoutProofError> {
        let storage = self.storage.borrow();
        let token_id = storage
            .proof_by_payout
            .get(&payout_id)
            .copied()
            .ok_or(WorkPayoutProofError::ProofNotFound)?;

        storage
            .proofs
            .get(&token_id)
            .cloned()
            .ok_or(WorkPayoutProofError::ProofNotFound)
    }

    #[export]
    pub fn get_proof_by_token(
        &self,
        token_id: TokenId,
    ) -> Result<ProofInvoice, WorkPayoutProofError> {
        let storage = self.storage.borrow();
        storage
            .proofs
            .get(&token_id)
            .cloned()
            .ok_or(WorkPayoutProofError::ProofNotFound)
    }
}

pub struct Program {
    storage: RefCell<WorkPayoutStorage>,
}

#[sails_rs::program]
impl Program {
    pub fn create() -> Self {
        Self {
            storage: RefCell::new(WorkPayoutStorage::default()),
        }
    }

    pub fn work_payout_proof(&self) -> WorkPayoutProofService<'_> {
        WorkPayoutProofService::new(&self.storage)
    }
}
