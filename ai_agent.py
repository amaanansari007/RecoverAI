import json
import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=api_key) if api_key else None

# This starts as True.
# If the API is unavailable because of quota/billing,
# we immediately switch to the local fallback.
api_available = client is not None


def local_recommendation(transaction):
    """
    Local deterministic recovery advisor.

    This is used when the live AI API is unavailable.
    """

    attempts = int(transaction["attempts"])
    amount = float(transaction["amount"])
    failure_reason = transaction["failure_reason"]
    customer_type = transaction["customer_type"]

    if attempts >= 3:
        return {
            "action": "ESCALATE",
            "reason": "The payment has already been attempted multiple times.",
            "confidence": 0.98,
            "source": "local_fallback",
        }

    if failure_reason == "card_expired":
        return {
            "action": "REMINDER",
            "reason": "The customer should update their payment method.",
            "confidence": 0.97,
            "source": "local_fallback",
        }

    if failure_reason in ["network_error", "bank_timeout"]:
        return {
            "action": "RETRY",
            "reason": "The failure may be temporary and another attempt may succeed.",
            "confidence": 0.90,
            "source": "local_fallback",
        }

    if failure_reason == "insufficient_funds":
        if customer_type == "loyal":
            return {
                "action": "REMINDER",
                "reason": "A loyal customer may complete payment after funds become available.",
                "confidence": 0.88,
                "source": "local_fallback",
            }

        return {
            "action": "REMINDER",
            "reason": "The customer may need to add funds before retrying.",
            "confidence": 0.84,
            "source": "local_fallback",
        }

    if amount >= 10000:
        return {
            "action": "ESCALATE",
            "reason": "A high-value payment should receive additional review.",
            "confidence": 0.91,
            "source": "local_fallback",
        }

    return {
        "action": "RETRY",
        "reason": "The payment appears suitable for another attempt.",
        "confidence": 0.75,
        "source": "local_fallback",
    }


def get_ai_recommendation(transaction):
    """
    Get an AI recommendation.

    If the API is unavailable, permanently switch to
    the local fallback for the rest of this program run.
    """

    global api_available

    # Once the API has failed, don't keep trying it.
    if not api_available:
        return local_recommendation(transaction)

    try:
        prompt = f"""
You are a payment recovery assistant.

Analyze this failed payment:

Transaction ID: {transaction["transaction_id"]}
Amount: ₹{transaction["amount"]}
Failure reason: {transaction["failure_reason"]}
Attempts: {transaction["attempts"]}
Customer type: {transaction["customer_type"]}

Choose exactly one action:

RETRY
REMINDER
ESCALATE

Return only valid JSON:

{{
    "action": "RETRY",
    "reason": "brief explanation",
    "confidence": 0.85
}}
"""

        response = client.responses.create(
            model="gpt-4.1-mini",
            input=prompt,
        )

        text = response.output_text.strip()
        result = json.loads(text)

        result["source"] = "openai"

        return result

    except Exception as error:
        # The first API failure disables live API usage
        # for this program run.
        api_available = False

        print(
            "OpenAI API unavailable. "
            "Switching to local fallback for this run."
        )
        print("Reason:", error)

        return local_recommendation(transaction)