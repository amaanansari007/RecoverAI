import random

random.seed(42)


def simulate_recovery(transaction, final_action):
    """
    Simulate the outcome of a recovery action.

    This is a synthetic simulation for the buildathon demo.
    It does NOT represent real payment data or real Razorpay outcomes.
    """

    amount = float(transaction["amount"])
    failure_reason = transaction["failure_reason"]

    # No automatic recovery for escalation.
    if final_action == "ESCALATE":
        return {
            "outcome": "ESCALATED",
            "recovered": False,
            "amount_recovered": 0.0,
        }

    # Reminders have a moderate chance of successful recovery.
    if final_action == "REMINDER":

        success_probability = 0.35

        # Customers with temporary funding problems
        # have a slightly higher chance in our simulation.
        if failure_reason == "insufficient_funds":
            success_probability = 0.45

        recovered = random.random() < success_probability

        return {
            "outcome": "RECOVERED" if recovered else "NOT_RECOVERED",
            "recovered": recovered,
            "amount_recovered": amount if recovered else 0.0,
        }

    # Retry has a higher chance for temporary technical failures.
    if final_action == "RETRY":

        if failure_reason in ["network_error", "bank_timeout"]:
            success_probability = 0.70
        elif failure_reason == "bank_declined":
            success_probability = 0.30
        elif failure_reason == "insufficient_funds":
            success_probability = 0.40
        else:
            success_probability = 0.25

        recovered = random.random() < success_probability

        return {
            "outcome": "RECOVERED" if recovered else "NOT_RECOVERED",
            "recovered": recovered,
            "amount_recovered": amount if recovered else 0.0,
        }

    # Safety fallback.
    return {
        "outcome": "NOT_RECOVERED",
        "recovered": False,
        "amount_recovered": 0.0,
    }
def estimate_recoverable(transaction):
    """
    Estimate whether a failed payment is realistically recoverable
    in our synthetic evaluation.

    This is a demo assumption, not real-world Razorpay data.
    """

    attempts = int(transaction["attempts"])
    failure_reason = transaction["failure_reason"]
    amount = float(transaction["amount"])

    if attempts >= 3:
        return False

    if failure_reason == "card_expired":
        return True

    if failure_reason in [
        "network_error",
        "bank_timeout",
        "insufficient_funds",
    ]:
        return True

    if failure_reason == "bank_declined":
        return amount < 5000

    return False