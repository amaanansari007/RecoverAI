from ai_agent import get_ai_recommendation


transaction = {
    "transaction_id": "AI_TEST_001",
    "amount": 2999,
    "failure_reason": "network_error",
    "attempts": 1,
    "customer_type": "returning",
}


result = get_ai_recommendation(transaction)

print("=" * 50)
print("RECOVERY ADVISOR")
print("=" * 50)

print("Action:", result["action"])
print("Reason:", result["reason"])
print("Confidence:", result["confidence"])
print("Source:", result["source"])