def decide_recovery_action(transaction):
    """
    Decide the safest recovery action for a failed payment.
    """

    attempts = int(transaction["attempts"])
    amount = float(transaction["amount"])
    failure_reason = transaction["failure_reason"]
    customer_type = transaction["customer_type"]

    # SAFETY RULE 1:
    # Never retry a payment 3 or more times.
    if attempts >= 3:
        return {
            "action": "ESCALATE",
            "reason": "Maximum retry attempts reached.",
        }

    # RULE 2:
    # Expired card -> ask customer to update payment method.
    if failure_reason == "card_expired":
        return {
            "action": "REMINDER",
            "reason": "Customer needs to update their payment method.",
        }

    # RULE 3:
    # Temporary infrastructure issues may be retried.
    if failure_reason in ["bank_timeout", "network_error"]:
        return {
            "action": "RETRY",
            "reason": "The payment failure may be temporary.",
        }

    # RULE 4:
    # Loyal customers with insufficient funds get a reminder first.
    if (
        failure_reason == "insufficient_funds"
        and customer_type == "loyal"
    ):
        return {
            "action": "REMINDER",
            "reason": "Loyal customer may retry after funds are available.",
        }

    # SAFETY RULE 5:
    # High-value payments should not be automatically retried.
    if amount >= 10000:
        return {
            "action": "ESCALATE",
            "reason": "High-value transaction requires review.",
        }

    # DEFAULT:
    # Suitable low-risk failed payment.
    return {
        "action": "RETRY",
        "reason": "Payment appears suitable for another attempt.",
    }