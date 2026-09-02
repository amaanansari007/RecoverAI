from agent import run_recovery_agent


test_cases = [
    {
        "transaction_id": "AGENT001",
        "amount": 2999,
        "failure_reason": "network_error",
        "attempts": 1,
        "customer_type": "returning",
    },
    {
        "transaction_id": "AGENT002",
        "amount": 2999,
        "failure_reason": "network_error",
        "attempts": 5,
        "customer_type": "returning",
    },
    {
        "transaction_id": "AGENT003",
        "amount": 14999,
        "failure_reason": "bank_declined",
        "attempts": 1,
        "customer_type": "returning",
    },
]


for transaction in test_cases:

    result = run_recovery_agent(transaction)

    print("=" * 60)
    print("Transaction:", result["transaction_id"])
    print("AI recommendation:", result["ai_recommendation"])
    print("AI confidence:", result["ai_confidence"])
    print("AI source:", result["ai_source"])
    print("Policy action:", result["policy_action"])
    print("Guardrail:", result["guardrail_result"])
    print("FINAL ACTION:", result["final_action"])
    print("Reason:", result["policy_reason"])