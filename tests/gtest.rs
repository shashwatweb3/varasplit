use sails_rs::{client::*, gtest::*};
use vara_split_client::{
    GroupSettlement, MemberBalance, SettlementTransfer, VaraSplitClient, VaraSplitClientCtors,
    VaraSplitClientProgram, vara_split::VaraSplit,
};

const ALICE: u64 = 42;
const BOB: u64 = 43;
const CHARLIE: u64 = 44;
const EVE: u64 = 45;

async fn deploy_program(actor_id: u64) -> (Actor<VaraSplitClientProgram, GtestEnv>, GtestEnv) {
    let system = System::new();
    system.init_logger_with_default_filter("gwasm=debug,gtest=info,sails_rs=debug");

    for account in [ALICE, BOB, CHARLIE, EVE] {
        system.mint_to(account, 100_000_000_000_000);
    }

    let program_code_id = system.submit_code(vara_split::WASM_BINARY);
    let env = GtestEnv::new(system, actor_id.into());
    let program = env
        .deploy::<vara_split_client::VaraSplitClientProgram>(program_code_id, b"salt".to_vec())
        .create()
        .await
        .unwrap();

    (program, env)
}

fn balance_of(balances: &[MemberBalance], member: u64) -> i128 {
    balances
        .iter()
        .find(|entry| entry.member == member.into())
        .map(|entry| entry.balance)
        .expect("Missing member balance")
}

#[tokio::test]
async fn create_add_and_settle_group_flow_works() {
    let (program, _) = deploy_program(ALICE).await;
    let mut service = program.vara_split();

    let group = service
        .create_group("Goa Trip".into(), vec![ALICE.into(), BOB.into(), CHARLIE.into()])
        .await
        .unwrap();

    assert_eq!(group.id, 0);
    assert_eq!(group.members.len(), 3);
    assert_eq!(balance_of(&group.balances, ALICE), 0);

    let updated = service
        .add_expense(group.id, ALICE.into(), 300, "Hotel".into())
        .await
        .unwrap();

    assert_eq!(updated.expenses.len(), 1);
    assert_eq!(balance_of(&updated.balances, ALICE), 200);
    assert_eq!(balance_of(&updated.balances, BOB), -100);
    assert_eq!(balance_of(&updated.balances, CHARLIE), -100);

    let plan = service.get_settlement_plan(group.id).await.unwrap();
    assert_eq!(
        plan,
        vec![
            SettlementTransfer {
                from: BOB.into(),
                to: ALICE.into(),
                amount: 100,
            },
            SettlementTransfer {
                from: CHARLIE.into(),
                to: ALICE.into(),
                amount: 100,
            },
        ]
    );

    let settlement = service.settle_group(group.id).await.unwrap();
    assert_eq!(
        settlement,
        GroupSettlement {
            group_id: group.id,
            transfers: plan,
            total_settled: 200,
        }
    );

    let after = service.get_balances(group.id).await.unwrap();
    assert_eq!(balance_of(&after, ALICE), 0);
    assert_eq!(balance_of(&after, BOB), 0);
    assert_eq!(balance_of(&after, CHARLIE), 0);
}

#[tokio::test]
async fn remainder_is_split_deterministically() {
    let (program, _) = deploy_program(ALICE).await;
    let mut service = program.vara_split();

    let group = service
        .create_group(
            "Dinner".into(),
            vec![ALICE.into(), BOB.into(), CHARLIE.into()],
        )
        .await
        .unwrap();

    let updated = service
        .add_expense(group.id, ALICE.into(), 100, "Tapas".into())
        .await
        .unwrap();

    assert_eq!(updated.expenses[0].share_per_member, 33);
    assert_eq!(updated.expenses[0].remainder, 1);
    assert_eq!(balance_of(&updated.balances, ALICE), 66);
    assert_eq!(balance_of(&updated.balances, BOB), -33);
    assert_eq!(balance_of(&updated.balances, CHARLIE), -33);
}

#[tokio::test]
async fn non_member_payer_is_rejected() {
    let (program, _) = deploy_program(ALICE).await;

    let mut alice_service = program.vara_split();
    let group = alice_service
        .create_group(
            "Flatmates".into(),
            vec![ALICE.into(), BOB.into(), CHARLIE.into()],
        )
        .await
        .unwrap();

    let error = alice_service
        .add_expense(group.id, EVE.into(), 50, "Snacks".into())
        .await
        .unwrap_err();

    assert!(
        error.to_string().contains("execution error"),
        "unexpected error: {error}"
    );
}

#[tokio::test]
async fn confirm_payment_reduces_matching_debt_without_touching_other_logic() {
    let (program, env) = deploy_program(ALICE).await;

    let mut alice_service = program.vara_split();
    let group = alice_service
        .create_group(
            "Road Trip".into(),
            vec![ALICE.into(), BOB.into(), CHARLIE.into()],
        )
        .await
        .unwrap();

    alice_service
        .add_expense(group.id, ALICE.into(), 300, "Villa".into())
        .await
        .unwrap();

    let bob_env = env.clone().with_actor_id(BOB.into());
    let mut bob_service = program.with_env(&bob_env).vara_split();
    let updated = bob_service
        .confirm_payment(group.id, BOB.into(), ALICE.into(), 40)
        .await
        .unwrap();

    assert_eq!(balance_of(&updated.balances, ALICE), 160);
    assert_eq!(balance_of(&updated.balances, BOB), -60);
    assert_eq!(balance_of(&updated.balances, CHARLIE), -100);

    let plan = alice_service.get_settlement_plan(group.id).await.unwrap();
    assert_eq!(
        plan,
        vec![
            SettlementTransfer {
                from: BOB.into(),
                to: ALICE.into(),
                amount: 60,
            },
            SettlementTransfer {
                from: CHARLIE.into(),
                to: ALICE.into(),
                amount: 100,
            },
        ]
    );
}

#[tokio::test]
async fn confirm_payment_rejects_amounts_above_outstanding_debt() {
    let (program, env) = deploy_program(ALICE).await;

    let mut alice_service = program.vara_split();
    let group = alice_service
        .create_group("Team Lunch".into(), vec![ALICE.into(), BOB.into()])
        .await
        .unwrap();

    alice_service
        .add_expense(group.id, ALICE.into(), 100, "Lunch".into())
        .await
        .unwrap();

    let bob_env = env.clone().with_actor_id(BOB.into());
    let mut bob_service = program.with_env(&bob_env).vara_split();
    let error = bob_service
        .confirm_payment(group.id, BOB.into(), ALICE.into(), 60)
        .await
        .unwrap_err();

    assert!(
        error.to_string().contains("execution error"),
        "unexpected error: {error}"
    );
}
