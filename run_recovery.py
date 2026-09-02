import csv
from datetime import datetime

from agent import run_recovery_agent
from recovery_simulator import (
    simulate_recovery,
    estimate_recoverable,
)


INPUT_FILE = "data/transactions.csv"
AUDIT_FILE = "data/audit_log.csv"


def run_recovery_pipeline():

    # -----------------------------------------
    # BASIC METRICS
    # -----------------------------------------

    total_transactions = 0
    failed_transactions = 0

    revenue_at_risk = 0.0
    estimated_recoverable_revenue = 0.0
    recovered_revenue = 0.0

    # -----------------------------------------
    # ACTION COUNTS
    # -----------------------------------------

    action_counts = {
        "RETRY": 0,
        "REMINDER": 0,
        "ESCALATE": 0,
    }

    # -----------------------------------------
    # OUTCOME COUNTS
    # -----------------------------------------

    outcome_counts = {
        "RECOVERED": 0,
        "NOT_RECOVERED": 0,
        "ESCALATED": 0,
    }

    guardrail_overrides = 0

    # Every failed transaction gets an audit row.
    audit_rows = []

    # -----------------------------------------
    # READ TRANSACTIONS
    # -----------------------------------------

    with open(INPUT_FILE, "r", newline="") as file:

        reader = csv.DictReader(file)

        for transaction in reader:

            total_transactions += 1

            # Successful payments do not need recovery.
            if transaction["status"] != "failed":
                continue

            failed_transactions += 1

            amount = float(transaction["amount"])

            # -----------------------------------------
            # REVENUE AT RISK
            # -----------------------------------------

            revenue_at_risk += amount

            # -----------------------------------------
            # ESTIMATED RECOVERABLE REVENUE
            # -----------------------------------------

            if estimate_recoverable(transaction):
                estimated_recoverable_revenue += amount

            # -----------------------------------------
            # AI + GUARDRAIL AGENT
            # -----------------------------------------

            agent_result = run_recovery_agent(transaction)

            final_action = agent_result["final_action"]

            action_counts[final_action] += 1

            # Count cases where the policy overrode AI.
            if agent_result["guardrail_result"] == "OVERRIDDEN":
                guardrail_overrides += 1

            # -----------------------------------------
            # RECOVERY SIMULATION
            # -----------------------------------------

            recovery_result = simulate_recovery(
                transaction,
                final_action,
            )

            outcome = recovery_result["outcome"]
            amount_recovered = recovery_result["amount_recovered"]

            outcome_counts[outcome] += 1

            recovered_revenue += amount_recovered

            # -----------------------------------------
            # AUDIT LOG
            # -----------------------------------------

            audit_rows.append({
                "timestamp": datetime.now().isoformat(),
                "transaction_id": transaction["transaction_id"],
                "amount": amount,
                "failure_reason": transaction["failure_reason"],
                "attempts": transaction["attempts"],
                "customer_type": transaction["customer_type"],
                "ai_recommendation": agent_result["ai_recommendation"],
                "ai_confidence": agent_result["ai_confidence"],
                "ai_source": agent_result["ai_source"],
                "policy_action": agent_result["policy_action"],
                "guardrail_result": agent_result["guardrail_result"],
                "policy_reason": agent_result["policy_reason"],
                "final_action": final_action,
                "outcome": outcome,
                "amount_recovered": amount_recovered,
            })

    # -----------------------------------------
    # RECOVERY RATE
    # -----------------------------------------

    if estimated_recoverable_revenue > 0:

        recovery_rate = (
            recovered_revenue
            / estimated_recoverable_revenue
        ) * 100

    else:

        recovery_rate = 0.0

    # -----------------------------------------
    # SAVE AUDIT LOG
    # -----------------------------------------

    fieldnames = [
        "timestamp",
        "transaction_id",
        "amount",
        "failure_reason",
        "attempts",
        "customer_type",
        "ai_recommendation",
        "ai_confidence",
        "ai_source",
        "policy_action",
        "guardrail_result",
        "policy_reason",
        "final_action",
        "outcome",
        "amount_recovered",
    ]

    with open(
        AUDIT_FILE,
        "w",
        newline="",
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames,
        )

        writer.writeheader()
        writer.writerows(audit_rows)

    # -----------------------------------------
    # PRINT FINAL REPORT
    # -----------------------------------------

    print("=" * 65)
    print("                 RECOVERAI BATCH RUN")
    print("=" * 65)

    print(
        f"Total transactions: "
        f"{total_transactions}"
    )

    print(
        f"Failed transactions: "
        f"{failed_transactions}"
    )

    print()

    print(
        f"Revenue at risk: "
        f"₹{revenue_at_risk:,.2f}"
    )

    print(
        f"Estimated recoverable revenue: "
        f"₹{estimated_recoverable_revenue:,.2f}"
    )

    print(
        f"Recovered revenue: "
        f"₹{recovered_revenue:,.2f}"
    )

    print(
        f"Recovery rate: "
        f"{recovery_rate:.2f}%"
    )

    print()

    print("Final actions:")

    print(
        f"RETRY:     "
        f"{action_counts['RETRY']}"
    )

    print(
        f"REMINDER:  "
        f"{action_counts['REMINDER']}"
    )

    print(
        f"ESCALATE:  "
        f"{action_counts['ESCALATE']}"
    )

    print()

    print("Outcomes:")

    print(
        f"RECOVERED:     "
        f"{outcome_counts['RECOVERED']}"
    )

    print(
        f"NOT_RECOVERED: "
        f"{outcome_counts['NOT_RECOVERED']}"
    )

    print(
        f"ESCALATED:     "
        f"{outcome_counts['ESCALATED']}"
    )

    print()

    print(
        f"Guardrail overrides: "
        f"{guardrail_overrides}"
    )

    print()

    print(
        f"Audit log saved to: "
        f"{AUDIT_FILE}"
    )

    print("=" * 65)


if __name__ == "__main__":
    run_recovery_pipeline()