from recovery_simulator import simulate_recovery


test_cases = [
    {
        "transaction_id": "SIM001",
        "amount": 2999,
        "failure_reason": "network_error",
    },
    {
        "transaction_id": "SIM002",
        "amount": 1499,
        "failure_reason": "insufficient_funds",
    },
    {
        "transaction_id": "SIM003",
        "amount": 9999,
        "failure_reason": "bank_declined",
    },
]


actions = [
    "RETRY",
    "REMINDER",
    "ESCALATE",
]


for transaction, action in zip(test_cases, actions):

    result = simulate_recovery(
        transaction,
        action,
    )

    print("=" * 50)
    print("Transaction:", transaction["transaction_id"])
    print("Action:", action)
    print("Outcome:", result["outcome"])
    print("Recovered:", result["recovered"])
    print("Amount recovered: ₹", result["amount_recovered"])