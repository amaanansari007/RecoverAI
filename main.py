import csv
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from recovery_simulator import estimate_recoverable
from run_recovery import run_recovery_pipeline

app = FastAPI(title="RecoverAI API")


# Allow our React frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


BASE_DIR = Path(__file__).resolve().parent

TRANSACTIONS_FILE = BASE_DIR / "data" / "transactions.csv"
AUDIT_FILE = BASE_DIR / "data" / "audit_log.csv"


@app.get("/")
def home():
    return {
        "message": "RecoverAI API is running!",
        "status": "success",
    }


@app.get("/api/metrics")
def get_metrics():
    """
    Return the latest RecoverAI evaluation metrics.
    """

    if not TRANSACTIONS_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="transactions.csv not found.",
        )

    if not AUDIT_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="audit_log.csv not found. Run run_recovery.py first.",
        )

    total_transactions = 0
    failed_transactions = 0

    revenue_at_risk = 0.0
    estimated_recoverable_revenue = 0.0

    action_counts = {
        "RETRY": 0,
        "REMINDER": 0,
        "ESCALATE": 0,
    }

    outcome_counts = {
        "RECOVERED": 0,
        "NOT_RECOVERED": 0,
        "ESCALATED": 0,
    }

    recovered_revenue = 0.0
    guardrail_overrides = 0

    # -----------------------------------------
    # READ TRANSACTIONS
    # -----------------------------------------

    with open(
        TRANSACTIONS_FILE,
        "r",
        newline="",
        encoding="utf-8",
    ) as file:

        reader = csv.DictReader(file)

        for transaction in reader:

            total_transactions += 1

            if transaction["status"] != "failed":
                continue

            failed_transactions += 1

            amount = float(transaction["amount"])

            revenue_at_risk += amount

            if estimate_recoverable(transaction):
                estimated_recoverable_revenue += amount

    # -----------------------------------------
    # READ AUDIT LOG
    # -----------------------------------------

    recent_decisions = []

    with open(
        AUDIT_FILE,
        "r",
        newline="",
        encoding="utf-8",
    ) as file:

        reader = csv.DictReader(file)

        rows = list(reader)

        for row in rows:

            final_action = row["final_action"]
            outcome = row["outcome"]

            if final_action in action_counts:
                action_counts[final_action] += 1

            if outcome in outcome_counts:
                outcome_counts[outcome] += 1

            recovered_revenue += float(
                row["amount_recovered"]
            )

            if row["guardrail_result"] == "OVERRIDDEN":
                guardrail_overrides += 1

        # Show the five most recent audit entries.
        for row in rows[-5:][::-1]:

            recent_decisions.append(
                {
                    "transaction_id": row["transaction_id"],
                    "amount": float(row["amount"]),
                    "action": row["final_action"],
                    "outcome": row["outcome"],
                    "ai_recommendation": row["ai_recommendation"],
                    "ai_confidence": float(
                        row["ai_confidence"]
                    ),
                    "ai_source": row["ai_source"],
                    "policy_action": row["policy_action"],
                    "guardrail_result": row["guardrail_result"],
                    "reason": row.get(
                        "policy_reason",
                        "Policy decision recorded in audit log."
                    ),
                    "amount_recovered": float(
                        row["amount_recovered"]
                    ),
                }
            )

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

    return {
        "total_transactions": total_transactions,
        "failed_transactions": failed_transactions,
        "revenue_at_risk": revenue_at_risk,
        "estimated_recoverable_revenue": (
            estimated_recoverable_revenue
        ),
        "recovered_revenue": recovered_revenue,
        "recovery_rate": recovery_rate,
        "retry": action_counts["RETRY"],
        "reminder": action_counts["REMINDER"],
        "escalate": action_counts["ESCALATE"],
        "recovered": outcome_counts["RECOVERED"],
        "not_recovered": outcome_counts["NOT_RECOVERED"],
        "escalated": outcome_counts["ESCALATED"],
        "guardrail_overrides": guardrail_overrides,
        "recent_decisions": recent_decisions,
    }
@app.get("/api/failure-intelligence")
def get_failure_intelligence():
    """
    Analyze failed transactions by failure reason.
    Returns counts, revenue at risk, estimated recoverable revenue,
    and recovered revenue attribution.
    """

    if not TRANSACTIONS_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail="transactions.csv not found.",
        )

    failure_data = {}

    # ---------------------------------------------------------
    # READ TRANSACTIONS
    # ---------------------------------------------------------
    with open(
        TRANSACTIONS_FILE,
        "r",
        newline="",
        encoding="utf-8",
    ) as file:
        reader = csv.DictReader(file)

        for transaction in reader:
            if transaction["status"] != "failed":
                continue

            reason = transaction.get(
                "failure_reason",
                "unknown",
            )

            amount = float(
                transaction.get("amount", 0)
            )

            if reason not in failure_data:
                failure_data[reason] = {
                    "failure_reason": reason,
                    "count": 0,
                    "revenue_at_risk": 0.0,
                    "estimated_recoverable": 0.0,
                    "recovered_revenue": 0.0,
                }

            failure_data[reason]["count"] += 1
            failure_data[reason]["revenue_at_risk"] += amount

            if estimate_recoverable(transaction):
                failure_data[reason][
                    "estimated_recoverable"
                ] += amount

    # ---------------------------------------------------------
    # READ AUDIT LOG FOR RECOVERY ATTRIBUTION
    # ---------------------------------------------------------
    if AUDIT_FILE.exists():
        with open(
            AUDIT_FILE,
            "r",
            newline="",
            encoding="utf-8",
        ) as file:
            reader = csv.DictReader(file)

            for row in reader:
                reason = row.get(
                    "failure_reason",
                    "unknown",
                )

                if reason not in failure_data:
                    continue

                recovered = float(
                    row.get("amount_recovered", 0)
                    or 0
                )

                failure_data[reason][
                    "recovered_revenue"
                ] += recovered

    # ---------------------------------------------------------
    # CALCULATE OPPORTUNITY
    # ---------------------------------------------------------
    breakdown = list(failure_data.values())

    for item in breakdown:
        recoverable = item["estimated_recoverable"]

        if recoverable > 0:
            item["benchmark_attainment_pct"] = min(
                round(
                    (
                    item["recovered_revenue"]
                    / recoverable
                )
                * 100,
                2,
            ),
            100.0,
        )
        else:
            item["benchmark_attainment_pct"] = 0.0

    # Highest revenue opportunity first
    breakdown.sort(
        key=lambda item: item["estimated_recoverable"],
        reverse=True,
    )

    total_failed = sum(
        item["count"]
        for item in breakdown
    )

    total_at_risk = sum(
        item["revenue_at_risk"]
        for item in breakdown
    )

    total_recoverable = sum(
        item["estimated_recoverable"]
        for item in breakdown
    )

    total_recovered = sum(
        item["recovered_revenue"]
        for item in breakdown
    )

    top_opportunity = (
        breakdown[0]
        if breakdown
        else None
    )

    return {
        "total_failed": total_failed,
        "total_revenue_at_risk": round(
            total_at_risk,
            2,
        ),
        "total_estimated_recoverable": round(
            total_recoverable,
            2,
        ),
        "total_recovered": round(
            total_recovered,
            2,
        ),
        "missed_opportunity": round(
            max(
                total_recoverable - total_recovered,
                0,
            ),
            2,
        ),
        "top_opportunity": top_opportunity,
        "breakdown": breakdown,
    }
@app.get("/api/strategy-simulation")
def strategy_simulation(strategy: str = "BALANCED"):
    """
    Simulate the impact of different recovery strategies.

    This is a bounded policy simulation for the demo.
    It does not change the real recovery pipeline or audit log.
    """

    strategy = strategy.upper().strip()

    if strategy not in {
        "CONSERVATIVE",
        "BALANCED",
        "AGGRESSIVE",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "strategy must be CONSERVATIVE, "
                "BALANCED, or AGGRESSIVE"
            ),
        )

    # Get the current real metrics from the existing endpoint.
    current = get_metrics()

    current_recovery_rate = float(
        current["recovery_rate"]
    )

    current_recovered = float(
        current["recovered_revenue"]
    )

    recoverable = float(
        current["estimated_recoverable_revenue"]
    )

    current_retry = int(current["retry"])
    current_reminder = int(current["reminder"])
    current_escalate = int(current["escalate"])

    # ---------------------------------------------------------
    # BOUNDED POLICY ASSUMPTIONS
    # ---------------------------------------------------------
    #
    # Conservative:
    # Lower intervention intensity, lower projected recovery,
    # lower operational risk.
    #
    # Balanced:
    # Moderate increase in recovery efficiency.
    #
    # Aggressive:
    # Higher intervention intensity and recovery,
    # but more retries / lower selectivity.
    #
    # These are simulation coefficients, not ML predictions.
    # ---------------------------------------------------------

    profiles = {
        "CONSERVATIVE": {
            "recovery_multiplier": 0.94,
            "retry_multiplier": 0.80,
            "reminder_multiplier": 1.10,
            "escalate_multiplier": 1.12,
            "risk_score": 18,
        },
        "BALANCED": {
            "recovery_multiplier": 1.05,
            "retry_multiplier": 0.92,
            "reminder_multiplier": 1.00,
            "escalate_multiplier": 0.93,
            "risk_score": 11,
        },
        "AGGRESSIVE": {
            "recovery_multiplier": 1.10,
            "retry_multiplier": 1.18,
            "reminder_multiplier": 0.88,
            "escalate_multiplier": 0.78,
            "risk_score": 24,
        },
    }

    profile = profiles[strategy]

    projected_recovered = min(
        current_recovered
        * profile["recovery_multiplier"],
        recoverable,
    )

    projected_recovery_rate = (
        (
            projected_recovered
            / recoverable
        )
        * 100
        if recoverable > 0
        else 0
    )

    projected_retry = round(
        current_retry
        * profile["retry_multiplier"]
    )

    projected_reminder = round(
        current_reminder
        * profile["reminder_multiplier"]
    )

    projected_escalate = round(
        current_escalate
        * profile["escalate_multiplier"]
    )

    projected_missed = max(
        recoverable - projected_recovered,
        0,
    )

    return {
        "strategy": strategy,

        "current": {
            "recovery_rate": round(
                current_recovery_rate,
                2,
            ),
            "recovered_revenue": round(
                current_recovered,
                2,
            ),
            "retry": current_retry,
            "reminder": current_reminder,
            "escalate": current_escalate,
        },

        "projected": {
            "recovery_rate": round(
                projected_recovery_rate,
                2,
            ),
            "recovered_revenue": round(
                projected_recovered,
                2,
            ),
            "retry": projected_retry,
            "reminder": projected_reminder,
            "escalate": projected_escalate,
            "missed_opportunity": round(
                projected_missed,
                2,
            ),
            "risk_score": profile["risk_score"],
        },

        "delta": {
            "recovery_rate": round(
                projected_recovery_rate
                - current_recovery_rate,
                2,
            ),
            "recovered_revenue": round(
                projected_recovered
                - current_recovered,
                2,
            ),
        },
    }
# =========================================================
# DECISION SIMULATOR
# =========================================================

@app.get("/api/decision-simulator")
def decision_simulator(
    amount: float = 4999,
    failure_reason: str = "network_error",
    attempts: int = 1,
    customer_type: str = "returning",
):
    """
    Simulate a recovery decision without modifying
    the real transaction dataset.

    This endpoint intentionally separates:
    AI recommendation
    -> risk evaluation
    -> guardrail
    -> final action
    """

    amount = max(float(amount), 0)
    attempts = max(int(attempts), 0)

    # -----------------------------------------------------
    # AI RECOMMENDATION
    # -----------------------------------------------------

    recommendation = "RETRY"
    risk_score = 20

    if failure_reason == "network_error":
        recommendation = "RETRY"
        risk_score = 15

    elif failure_reason == "bank_timeout":
        recommendation = "RETRY"
        risk_score = 25

    elif failure_reason == "card_expired":
        recommendation = "REMINDER"
        risk_score = 40

    elif failure_reason == "insufficient_funds":
        recommendation = "REMINDER"
        risk_score = 55

    elif failure_reason == "bank_declined":
        recommendation = "ESCALATE"
        risk_score = 65

    # -----------------------------------------------------
    # RISK ADJUSTMENTS
    # -----------------------------------------------------

    risk_adjustments = []

    if amount >= 5000:
        risk_score += 15
        risk_adjustments.append(
            "High-value transaction"
        )

    if amount >= 10000:
        risk_score += 10
        risk_adjustments.append(
            "Very high transaction value"
        )

    if attempts >= 2:
        risk_score += 10
        risk_adjustments.append(
            "Multiple previous attempts"
        )

    if attempts >= 3:
        risk_score += 15
        risk_adjustments.append(
            "Retry threshold approaching"
        )

    if customer_type == "new":
        risk_score += 5
        risk_adjustments.append(
            "New customer"
        )

    risk_score = min(risk_score, 100)

    # -----------------------------------------------------
    # GUARDRAIL EVALUATION
    # -----------------------------------------------------

    guardrail = "ALLOWED"
    final_action = recommendation

    guardrail_checks = []

    if attempts >= 3:
        guardrail = "BLOCKED"
        final_action = "ESCALATE"

        guardrail_checks.append(
            {
                "rule": "Retry limit",
                "status": "BLOCKED",
                "reason": "Maximum automated retry attempts reached.",
            }
        )
    else:
        guardrail_checks.append(
            {
                "rule": "Retry limit",
                "status": "PASSED",
                "reason": "Retry count within allowed limit.",
            }
        )

    if amount >= 10000 and risk_score >= 60:
        guardrail = "BLOCKED"
        final_action = "ESCALATE"

        guardrail_checks.append(
            {
                "rule": "High-value risk protection",
                "status": "BLOCKED",
                "reason": (
                    "High-value transaction combined "
                    "with elevated risk."
                ),
            }
        )
    else:
        guardrail_checks.append(
            {
                "rule": "High-value risk protection",
                "status": "PASSED",
                "reason": (
                    "Transaction does not require "
                    "high-value escalation."
                ),
            }
        )

    if risk_score >= 75:
        guardrail = "BLOCKED"
        final_action = "ESCALATE"

        guardrail_checks.append(
            {
                "rule": "Risk threshold",
                "status": "BLOCKED",
                "reason": "Risk score exceeded automated action threshold.",
            }
        )
    else:
        guardrail_checks.append(
            {
                "rule": "Risk threshold",
                "status": "PASSED",
                "reason": "Risk score remains below escalation threshold.",
            }
        )

    # -----------------------------------------------------
    # RECOVERY PROBABILITY
    # -----------------------------------------------------

    recovery_probability = 0.65

    if failure_reason == "network_error":
        recovery_probability = 0.82

    elif failure_reason == "bank_timeout":
        recovery_probability = 0.74

    elif failure_reason == "card_expired":
        recovery_probability = 0.58

    elif failure_reason == "insufficient_funds":
        recovery_probability = 0.44

    elif failure_reason == "bank_declined":
        recovery_probability = 0.31

    recovery_probability -= attempts * 0.05

    if final_action == "ESCALATE":
        recovery_probability += 0.04

    recovery_probability = max(
        0.05,
        min(recovery_probability, 0.95),
    )

    estimated_recovery = amount * recovery_probability

    # -----------------------------------------------------
    # HUMAN-READABLE EXPLANATION
    # -----------------------------------------------------

    explanation = (
        "Payment is suitable for another automated recovery attempt."
    )

    if failure_reason == "card_expired":
        explanation = (
            "The payment method requires customer action, "
            "so a reminder is preferred."
        )

    elif failure_reason == "insufficient_funds":
        explanation = (
            "Immediate recovery probability is lower, "
            "so a reminder is safer than repeated retries."
        )

    elif failure_reason == "bank_declined":
        explanation = (
            "The issuer declined the payment, so escalation "
            "reduces the risk of repeated unsuccessful attempts."
        )

    if attempts >= 3:
        explanation = (
            "The retry limit has been reached. "
            "The guardrail blocks another automated retry."
        )

    elif amount >= 10000 and risk_score >= 60:
        explanation = (
            "The transaction is high-value and carries elevated "
            "risk, so controlled escalation is required."
        )

    return {
        "input": {
            "amount": amount,
            "failure_reason": failure_reason,
            "attempts": attempts,
            "customer_type": customer_type,
        },
        "ai_recommendation": recommendation,
        "risk_score": risk_score,
        "risk_adjustments": risk_adjustments,
        "guardrail": guardrail,
        "final_action": final_action,
        "recovery_probability": round(
            recovery_probability,
            4,
        ),
        "estimated_recovery": round(
            estimated_recovery,
            2,
        ),
        "explanation": explanation,
        "guardrail_checks": guardrail_checks,
    }


@app.post("/api/run-recovery")
@app.post("/api/run-recovery")
def run_recovery():
    """
    Run the complete RecoverAI recovery pipeline.
    """

    try:
        run_recovery_pipeline()

        return {
            "status": "success",
            "message": "Recovery pipeline completed.",
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
        