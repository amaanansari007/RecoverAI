import csv
from decision_engine import decide_recovery_action


CSV_FILE = "data/transactions.csv"


def analyze_transactions():
    total_transactions = 0
    failed_transactions = 0
    total_failed_amount = 0

    action_counts = {
        "RETRY": 0,
        "REMINDER": 0,
        "ESCALATE": 0,
    }

    with open(CSV_FILE, "r", newline="") as file:
        reader = csv.DictReader(file)

        for transaction in reader:
            total_transactions += 1

            # We only need to recover failed payments.
            if transaction["status"] != "failed":
                continue

            failed_transactions += 1

            amount = float(transaction["amount"])
            total_failed_amount += amount

            result = decide_recovery_action(transaction)

            action = result["action"]
            action_counts[action] += 1

    print("=" * 60)
    print("RECOVERAI TRANSACTION ANALYSIS")
    print("=" * 60)

    print(f"Total transactions: {total_transactions}")
    print(f"Failed transactions: {failed_transactions}")
    print(f"Revenue at risk: ₹{total_failed_amount:,.2f}")

    print("\nRecommended actions:")
    print(f"RETRY:     {action_counts['RETRY']}")
    print(f"REMINDER:  {action_counts['REMINDER']}")
    print(f"ESCALATE:  {action_counts['ESCALATE']}")

    print("=" * 60)


if __name__ == "__main__":
    analyze_transactions()