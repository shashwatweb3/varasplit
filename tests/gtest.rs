use sails_rs::{client::*, gtest::*, prelude::ActorId};
use vara_split_client::{
    Deposit, InvoiceNft, MemberBalance, SettlementTransfer, VaraSplitClient, VaraSplitClientCtors,
    VaraSplitClientProgram, VaraSplitError, vara_split::VaraSplit,
};

const ALICE: u64 = 42;
const BOB: u64 = 43;
const CHARLIE: u64 = 44;
const EVE: u64 = 45;
const STARTING_BALANCE: u128 = 100_000_000_000_000;

async fn deploy_program(actor_id: u64) -> (Actor<VaraSplitClientProgram, GtestEnv>, GtestEnv) {
    let system = System::new();
    system.init_logger_with_default_filter("gwasm=debug,gtest=info,sails_rs=debug");

    for account in [ALICE, BOB, CHARLIE, EVE] {
        system.mint_to(account, STARTING_BALANCE);
    }

    let program_code_id = system.submit_code(vara_split::WASM_BINARY);
    let env = GtestEnv::new(system, actor(actor_id));
    let program = env
        .deploy::<vara_split_client::VaraSplitClientProgram>(program_code_id, b"salt".to_vec())
        .create()
        .await
        .unwrap();

    (program, env)
}

fn actor(actor_id: u64) -> ActorId {
    ActorId::from(actor_id)
}

fn balance_of(balances: &[MemberBalance], member: u64) -> i128 {
    balances
        .iter()
        .find(|entry| entry.member == actor(member))
        .map(|entry| entry.balance)
        .expect("missing member balance")
}

fn deposit_for(deposits: &[Deposit], member: u64) -> &Deposit {
    deposits
        .iter()
        .find(|deposit| deposit.from == actor(member))
        .expect("missing deposit")
}

fn assert_error(error: VaraSplitError, expected: &str) {
    assert!(
        format!("{error:?}").contains(expected),
        "unexpected error: {error:?}"
    );
}

#[tokio::test]
async fn escrow_full_flow_transfers_funds_and_mints_verified_invoice() {
    let (program, env) = deploy_program(ALICE).await;
    let program_id = program.id();
    let program_starting_balance = env.system().balance_of(program_id);
    let mut service = program.vara_split();

    let group = service
        .create_group(
            "Goa Trip".into(),
            vec![actor(ALICE), actor(BOB), actor(CHARLIE)],
        )
        .await
        .unwrap()
        .unwrap();

    let updated = service
        .add_expense(group.id, actor(ALICE), 300, "Hotel".into())
        .await
        .unwrap()
        .unwrap();

    assert_eq!(balance_of(&updated.balances, ALICE), 200);
    assert_eq!(balance_of(&updated.balances, BOB), -100);
    assert_eq!(balance_of(&updated.balances, CHARLIE), -100);

    let computed = service.compute_settlement(group.id).await.unwrap().unwrap();
    let plan = vec![
        SettlementTransfer {
            from: actor(BOB),
            to: actor(ALICE),
            amount: 100,
        },
        SettlementTransfer {
            from: actor(CHARLIE),
            to: actor(ALICE),
            amount: 100,
        },
    ];
    assert_eq!(computed.settlement_plan, plan);
    assert_eq!(
        computed.deposits,
        vec![
            Deposit {
                from: actor(BOB),
                amount: 100,
                paid: false,
            },
            Deposit {
                from: actor(CHARLIE),
                amount: 100,
                paid: false,
            },
        ]
    );

    drop(service);
    let bob_env = env.clone().with_actor_id(actor(BOB));
    let program = program.with_env(&bob_env);
    let mut bob_service = program.vara_split();
    let after_bob = bob_service
        .deposit_payment(group.id)
        .with_value(100)
        .await
        .unwrap()
        .unwrap();

    assert!(!after_bob.settled);
    assert!(deposit_for(&after_bob.deposits, BOB).paid);
    assert!(!deposit_for(&after_bob.deposits, CHARLIE).paid);
    assert_eq!(
        env.system().balance_of(program_id),
        program_starting_balance + 100
    );
    let alice_balance_before_finalization = env.system().balance_of(actor(ALICE));

    drop(bob_service);
    let charlie_env = env.clone().with_actor_id(actor(CHARLIE));
    let program = program.with_env(&charlie_env);
    let mut charlie_service = program.vara_split();
    let settled = charlie_service
        .deposit_payment(group.id)
        .with_value(100)
        .await
        .unwrap()
        .unwrap();

    assert!(settled.settled);
    assert_eq!(balance_of(&settled.balances, ALICE), 0);
    assert_eq!(balance_of(&settled.balances, BOB), 0);
    assert_eq!(balance_of(&settled.balances, CHARLIE), 0);
    assert_eq!(
        env.system().balance_of(program_id),
        program_starting_balance
    );
    let alice_mailbox = env.system().get_mailbox(actor(ALICE));
    alice_mailbox
        .claim_value(Log::builder().source(program_id))
        .expect("first settlement payout should be claimable");
    alice_mailbox
        .claim_value(Log::builder().source(program_id))
        .expect("second settlement payout should be claimable");
    assert_eq!(
        env.system().balance_of(actor(ALICE)),
        alice_balance_before_finalization + 200
    );

    let invoice = charlie_service
        .get_invoice(group.id)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(
        invoice,
        InvoiceNft {
            token_id: 0,
            group_id: group.id,
            payments: plan,
            total_settled: 200,
            settled_at: invoice.settled_at,
            verified: true,
        }
    );
}

#[tokio::test]
async fn deposit_rejects_wrong_amount() {
    let (program, env) = deploy_program(ALICE).await;
    let program_id = program.id();
    let mut service = program.vara_split();

    let group = service
        .create_group("Team Lunch".into(), vec![actor(ALICE), actor(BOB)])
        .await
        .unwrap()
        .unwrap();
    service
        .add_expense(group.id, actor(ALICE), 100, "Lunch".into())
        .await
        .unwrap()
        .unwrap();
    service.compute_settlement(group.id).await.unwrap().unwrap();
    let program_balance_before_deposit = env.system().balance_of(program_id);

    drop(service);
    let bob_env = env.clone().with_actor_id(actor(BOB));
    let program = program.with_env(&bob_env);
    let mut bob_service = program.vara_split();
    let error = bob_service
        .deposit_payment(group.id)
        .with_value(49)
        .await
        .unwrap()
        .unwrap_err();

    assert_error(error, "InvalidPaymentValue");
    assert_eq!(
        env.system().balance_of(program_id),
        program_balance_before_deposit
    );
    let bob_balance_before_refund_claim = env.system().balance_of(actor(BOB));
    env.system()
        .get_mailbox(actor(BOB))
        .claim_value(Log::builder().source(program_id))
        .expect("invalid deposit should be refundable");
    assert!(env.system().balance_of(actor(BOB)) > bob_balance_before_refund_claim);
}

#[tokio::test]
async fn deposit_rejects_double_payment() {
    let (program, env) = deploy_program(ALICE).await;
    let mut service = program.vara_split();

    let group = service
        .create_group(
            "Duplicate Pay".into(),
            vec![actor(ALICE), actor(BOB), actor(CHARLIE)],
        )
        .await
        .unwrap()
        .unwrap();
    service
        .add_expense(group.id, actor(ALICE), 300, "Dinner".into())
        .await
        .unwrap()
        .unwrap();
    service.compute_settlement(group.id).await.unwrap().unwrap();

    drop(service);
    let bob_env = env.clone().with_actor_id(actor(BOB));
    let program = program.with_env(&bob_env);
    let mut bob_service = program.vara_split();
    bob_service
        .deposit_payment(group.id)
        .with_value(100)
        .await
        .unwrap()
        .unwrap();

    let error = bob_service
        .deposit_payment(group.id)
        .with_value(100)
        .await
        .unwrap()
        .unwrap_err();

    assert_error(error, "DepositAlreadyPaid");
}

#[tokio::test]
async fn deposit_rejects_non_member() {
    let (program, env) = deploy_program(ALICE).await;
    let mut service = program.vara_split();

    let group = service
        .create_group("Flatmates".into(), vec![actor(ALICE), actor(BOB)])
        .await
        .unwrap()
        .unwrap();
    service
        .add_expense(group.id, actor(ALICE), 100, "Snacks".into())
        .await
        .unwrap()
        .unwrap();
    service.compute_settlement(group.id).await.unwrap().unwrap();

    drop(service);
    let eve_env = env.clone().with_actor_id(actor(EVE));
    let program = program.with_env(&eve_env);
    let mut eve_service = program.vara_split();
    let error = eve_service
        .deposit_payment(group.id)
        .with_value(50)
        .await
        .unwrap()
        .unwrap_err();

    assert_error(error, "NonMember");
}

#[tokio::test]
async fn auto_finalize_rejects_partial_settlement() {
    let (program, env) = deploy_program(ALICE).await;
    let mut service = program.vara_split();

    let group = service
        .create_group(
            "Incomplete".into(),
            vec![actor(ALICE), actor(BOB), actor(CHARLIE)],
        )
        .await
        .unwrap()
        .unwrap();
    service
        .add_expense(group.id, actor(ALICE), 300, "Stay".into())
        .await
        .unwrap()
        .unwrap();
    service.compute_settlement(group.id).await.unwrap().unwrap();

    drop(service);
    let bob_env = env.clone().with_actor_id(actor(BOB));
    let program = program.with_env(&bob_env);
    let mut bob_service = program.vara_split();
    bob_service
        .deposit_payment(group.id)
        .with_value(100)
        .await
        .unwrap()
        .unwrap();

    let error = bob_service
        .auto_finalize_settlement(group.id)
        .await
        .unwrap()
        .unwrap_err();

    assert_error(error, "SettlementIncomplete");
}

#[tokio::test]
async fn remainder_is_split_deterministically() {
    let (program, _) = deploy_program(ALICE).await;
    let mut service = program.vara_split();

    let group = service
        .create_group(
            "Dinner".into(),
            vec![actor(ALICE), actor(BOB), actor(CHARLIE)],
        )
        .await
        .unwrap()
        .unwrap();

    let updated = service
        .add_expense(group.id, actor(ALICE), 100, "Tapas".into())
        .await
        .unwrap()
        .unwrap();

    let expense = updated.expenses.first().expect("missing expense");
    assert_eq!(expense.share_per_member, 33);
    assert_eq!(expense.remainder, 1);
    assert_eq!(balance_of(&updated.balances, ALICE), 66);
    assert_eq!(balance_of(&updated.balances, BOB), -33);
    assert_eq!(balance_of(&updated.balances, CHARLIE), -33);
}

#[tokio::test]
async fn duplicate_members_are_rejected_without_trapping() {
    let (program, _) = deploy_program(ALICE).await;
    let mut service = program.vara_split();

    let error = service
        .create_group("Duplicates".into(), vec![actor(ALICE), actor(ALICE)])
        .await
        .unwrap()
        .unwrap_err();

    assert_error(error, "DuplicateMember");
}
