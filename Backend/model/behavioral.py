from datetime import datetime
from collections import defaultdict
from typing import Dict, Any, List
import pandas as pd
import numpy as np

from database.models import db, TransactionLog, TransactionClassification, UserBasicDetails


def analyze_behavioral_recurrence(user_id: int = None) -> Dict[str, Any]:
    """
    Infers recurrence patterns, periodic subscriptions, and behavioral spend intent
    from raw ledger logs and ML categories.
    """
    query = (
        db.session.query(
            TransactionLog.id,
            TransactionLog.sender_id,
            TransactionLog.receiver_id,
            TransactionLog.amount,
            TransactionLog.payment_method,
            TransactionLog.location,
            TransactionLog.timestamp,
            TransactionClassification.category,
            TransactionClassification.confidence,
        )
        .outerjoin(TransactionClassification, TransactionClassification.transaction_id == TransactionLog.id)
    )

    if user_id:
        query = query.filter((TransactionLog.sender_id == user_id) | (TransactionLog.receiver_id == user_id))

    rows = query.order_by(TransactionLog.timestamp.asc()).all()
    if not rows:
        return {
            "recurring_count": 0,
            "estimated_monthly_burn": 0.0,
            "patterns": [],
            "intent_distribution": {},
        }

    # Group by (sender_id, receiver_id) or location descriptor
    groups = defaultdict(list)
    intent_counts = defaultdict(float)

    for r in rows:
        key = (r.sender_id, r.receiver_id, (r.location or "General").split(",")[0].strip())
        groups[key].append(r)

        # Categorize intent
        cat = (r.category or "General").lower()
        amt = float(r.amount)
        if cat in ("utilities", "healthcare") or "power" in (r.location or "").lower():
            intent = "Fixed Overhead & Utilities"
        elif cat in ("restaurants", "entertainment"):
            intent = "Discretionary & Lifestyle"
        elif cat in ("groceries", "shopping"):
            intent = "Essential Retail & Living"
        else:
            intent = "Capital & Peer Transfer"
        intent_counts[intent] += amt

    recurring_patterns = []
    total_monthly_burn = 0.0

    for (s_id, r_id, loc_descriptor), tx_list in groups.items():
        if len(tx_list) >= 1:
            amounts = [float(t.amount) for t in tx_list]
            avg_amount = round(float(np.mean(amounts)), 2)
            categories = [t.category for t in tx_list if t.category]
            primary_cat = categories[0] if categories else "General"

            # Determine frequency heuristic
            freq = "Monthly Subscription" if primary_cat in ("Utilities", "Healthcare") else "Periodic Transfer"
            if len(tx_list) >= 2:
                # Interval calculation
                timestamps = [t.timestamp for t in tx_list if t.timestamp]
                diffs_days = [(timestamps[i] - timestamps[i-1]).total_seconds() / 86400 for i in range(1, len(timestamps))]
                avg_diff = float(np.mean(diffs_days)) if diffs_days else 30
                if avg_diff <= 8:
                    freq = "Weekly"
                elif 20 <= avg_diff <= 40:
                    freq = "Monthly Bill"
                else:
                    freq = "Periodic Recurring"

            monthly_cost = avg_amount * (4 if freq == "Weekly" else 1)
            total_monthly_burn += monthly_cost

            # Fetch counterparty usernames
            sender_user = UserBasicDetails.query.get(s_id)
            receiver_user = UserBasicDetails.query.get(r_id)

            recurring_patterns.append({
                "counterparty": receiver_user.username if receiver_user else f"Account #{r_id}",
                "sender": sender_user.username if sender_user else f"Account #{s_id}",
                "location": loc_descriptor,
                "category": primary_cat,
                "frequency": freq,
                "avg_amount": avg_amount,
                "estimated_monthly_burn": round(monthly_cost, 2),
                "occurrences": len(tx_list),
            })

    recurring_patterns.sort(key=lambda x: x["estimated_monthly_burn"], reverse=True)

    return {
        "recurring_count": len(recurring_patterns),
        "estimated_monthly_burn": round(total_monthly_burn, 2),
        "patterns": recurring_patterns[:10],
        "intent_distribution": [
            {"intent": k, "total_spend": round(v, 2)} for k, v in intent_counts.items()
        ],
    }
