from decision_engine import decide_recovery_action


test_transactions = [
    {
        "transaction_id": "TEST001",
        "amount": 2999,
        "attempts": 1,
        "failure_reason": "network_error",
        "customer_type": "returning",
    },
    {
        "transaction_id": "TEST002",
        "amount": 2999,
        "attempts": 1,
        "failure_reason": "card_expired",
        "customer_type": "returning",
    },
    {
        "transaction_id": "TEST003",
        "amount": 1499,
        "attempts": 4,
        "failure_reason": "bank_timeout",
        "customer_type": "loyal",
    },
    {
        "transaction_id": "TEST004",
        "amount": 14999,
        "attempts": 1,
        "failure_reason": "bank_declined",
        "customer_type": "returning",
    },
]


for transaction in test_transactions:
    result = decide_recovery_action(transaction)

    print("=" * 50)
    print("Transaction:", transaction["transaction_id"])
    print("Amount: ₹", transaction["amount"])
    print("Failure:", transaction["failure_reason"])
    print("Attempts:", transaction["attempts"])
    print("ACTION:", result["action"])
    print("REASON:", result["reason"])