from ai_agent import get_ai_recommendation
from decision_engine import decide_recovery_action


def run_recovery_agent(transaction):
    """
    Complete RecoverAI workflow.

    1. Ask the AI for a recommendation.
    2. Run the transaction through the safety/policy engine.
    3. Decide the final action.
    """

    ai_result = get_ai_recommendation(transaction)

    policy_result = decide_recovery_action(transaction)

    ai_action = ai_result["action"]
    policy_action = policy_result["action"]

    # The policy engine has final authority.
    if ai_action == policy_action:
        final_action = ai_action
        guardrail_result = "ALLOWED"

    else:
        final_action = policy_action
        guardrail_result = "OVERRIDDEN"

    return {
        "transaction_id": transaction["transaction_id"],
        "ai_recommendation": ai_action,
        "ai_reason": ai_result["reason"],
        "ai_confidence": ai_result["confidence"],
        "ai_source": ai_result["source"],
        "policy_action": policy_action,
        "policy_reason": policy_result["reason"],
        "guardrail_result": guardrail_result,
        "final_action": final_action,
    }