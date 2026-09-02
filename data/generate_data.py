import csv
import random
from datetime import datetime, timedelta


FAILURE_REASONS = [
    "insufficient_funds",
    "card_expired",
    "bank_timeout",
    "bank_declined",
    "network_error",
]

CUSTOMER_TYPES = [
    "new",
    "returning",
    "loyal",
]


def generate_transactions(number_of_transactions=1000):
    transactions = []

    for i in range(1, number_of_transactions + 1):

        customer_id = f"CUST{i:04d}"
        transaction_id = f"TXN{i:05d}"

        amount = random.choice([
            499,
            799,
            999,
            1499,
            1999,
            2999,
            4999,
            7999,
            9999,
            14999,
        ])

        customer_type = random.choice(CUSTOMER_TYPES)

        status = random.choices(
            ["success", "failed"],
            weights=[70, 30],
        )[0]

        if status == "success":
            failure_reason = ""
            attempts = 1

        else:
            failure_reason = random.choice(FAILURE_REASONS)
            attempts = random.randint(1, 4)

        transaction_date = (
            datetime.now() - timedelta(
                days=random.randint(0, 90)
            )
        ).strftime("%Y-%m-%d")

        transactions.append({
            "transaction_id": transaction_id,
            "customer_id": customer_id,
            "amount": amount,
            "status": status,
            "failure_reason": failure_reason,
            "attempts": attempts,
            "customer_type": customer_type,
            "transaction_date": transaction_date,
        })

    return transactions


def save_transactions(transactions):
    filename = "data/transactions.csv"

    fieldnames = [
        "transaction_id",
        "customer_id",
        "amount",
        "status",
        "failure_reason",
        "attempts",
        "customer_type",
        "transaction_date",
    ]

    with open(filename, "w", newline="") as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames,
        )

        writer.writeheader()
        writer.writerows(transactions)

    print(f"Created {len(transactions)} transactions.")
    print(f"Saved to {filename}")


if __name__ == "__main__":
    transactions = generate_transactions(1000)
    save_transactions(transactions)