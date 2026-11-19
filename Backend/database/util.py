from datetime import datetime
from sqlalchemy.orm import aliased
from sqlalchemy import func
from werkzeug.security import generate_password_hash

from database.models import db, UserBasicDetails, TransactionLog, TransactionClassification


def get_user_by_username(username):
    return UserBasicDetails.query.filter_by(username=username).first()


def get_user_by_id(user_id):
    return UserBasicDetails.query.get(user_id)


def fetch_all_users():
    return UserBasicDetails.query.order_by(UserBasicDetails.id.asc()).all()


def create_user(username, password_hash, user_type="Personal", initial_balance=10000.0):
    user = UserBasicDetails(
        username=username,
        password_hash=password_hash,
        user_type=user_type,
        balance=initial_balance,
    )
    db.session.add(user)
    db.session.commit()
    return user


def deposit_to_user(user_id, amount):
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError("User not found.")
    if amount <= 0:
        raise ValueError("Deposit amount must be greater than zero.")
    user.balance += amount
    db.session.commit()
    return user


def execute_transfer(sender_id, receiver_id, amount, payment_method, location, category, confidence, class_id):
    sender = get_user_by_id(sender_id)
    receiver = get_user_by_id(receiver_id)

    if not sender or not receiver:
        raise ValueError("Invalid sender or receiver ID.")
    if sender_id == receiver_id:
        raise ValueError("Sender and receiver cannot be the same account.")
    if sender.balance < amount:
        raise ValueError(f"Insufficient balance. Available: INR {sender.balance:,.2f}, Requested: INR {amount:,.2f}")

    sender.balance -= amount
    receiver.balance += amount

    tx_log = TransactionLog(
        sender_id=sender_id,
        receiver_id=receiver_id,
        amount=amount,
        payment_method=payment_method,
        location=location,
        timestamp=datetime.utcnow(),
    )
    db.session.add(tx_log)
    db.session.flush()

    classification_log = TransactionClassification(
        transaction_id=tx_log.id,
        category=category,
        confidence=confidence,
        class_id=class_id,
        created_at=datetime.utcnow(),
    )
    db.session.add(classification_log)

    db.session.commit()
    return tx_log, classification_log


def fetch_transactions_with_classification(user_id=None, category=None, search=None, limit=None):
    sender_alias = aliased(UserBasicDetails)
    receiver_alias = aliased(UserBasicDetails)

    query = (
        db.session.query(
            TransactionLog,
            TransactionClassification,
            sender_alias.username.label("sender_username"),
            receiver_alias.username.label("receiver_username"),
        )
        .outerjoin(
            TransactionClassification,
            TransactionClassification.transaction_id == TransactionLog.id,
        )
        .outerjoin(sender_alias, sender_alias.id == TransactionLog.sender_id)
        .outerjoin(receiver_alias, receiver_alias.id == TransactionLog.receiver_id)
        .order_by(TransactionLog.timestamp.desc())
    )

    if user_id is not None:
        query = query.filter(
            (TransactionLog.sender_id == user_id) | (TransactionLog.receiver_id == user_id)
        )

    if category:
        query = query.filter(TransactionClassification.category.ilike(f"%{category}%"))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (sender_alias.username.ilike(search_term))
            | (receiver_alias.username.ilike(search_term))
            | (TransactionLog.location.ilike(search_term))
            | (TransactionClassification.category.ilike(search_term))
        )

    if limit:
        query = query.limit(limit)

    results = query.all()
    rows = []

    for tx, classification, sender_username, receiver_username in results:
        category_val = classification.category if classification else "Uncategorized"
        confidence_val = float(classification.confidence) if classification else 0.0
        class_id_val = classification.class_id if classification else None

        rows.append({
            "id": tx.id,
            "sender_id": tx.sender_id,
            "sender_username": sender_username or f"User #{tx.sender_id}",
            "receiver_id": tx.receiver_id,
            "receiver_username": receiver_username or f"User #{tx.receiver_id}",
            "amount": float(tx.amount),
            "payment_method": tx.payment_method,
            "location": tx.location,
            "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
            "category": category_val,
            "confidence": confidence_val,
            "class_id": class_id_val,
            "predicted_category": category_val,
            "predicted_confidence": confidence_val,
            "predicted_class_id": class_id_val,
            "classification": {
                "category": category_val,
                "confidence": confidence_val,
                "class_id": class_id_val,
            },
        })

    return rows


def fetch_user_transactions(user_id):
    return fetch_transactions_with_classification(user_id=user_id)


def get_ledger_stats():
    total_tx = TransactionLog.query.count()
    total_volume = db.session.query(func.coalesce(func.sum(TransactionLog.amount), 0.0)).scalar() or 0.0
    avg_amount = (total_volume / total_tx) if total_tx > 0 else 0.0

    total_users = UserBasicDetails.query.count()
    total_liquidity = db.session.query(func.coalesce(func.sum(UserBasicDetails.balance), 0.0)).scalar() or 0.0

    # Category breakdown
    cat_rows = (
        db.session.query(
            TransactionClassification.category,
            func.count(TransactionLog.id).label("count"),
            func.coalesce(func.sum(TransactionLog.amount), 0.0).label("total_amount"),
        )
        .join(TransactionLog, TransactionLog.id == TransactionClassification.transaction_id)
        .group_by(TransactionClassification.category)
        .order_by(func.sum(TransactionLog.amount).desc())
        .all()
    )

    categories = []
    for cat, count, amount in cat_rows:
        pct = (float(amount) / float(total_volume) * 100) if total_volume > 0 else 0.0
        categories.append({
            "category": cat,
            "count": count,
            "total_amount": round(float(amount), 2),
            "percentage": round(pct, 1),
        })

    # Payment methods breakdown
    pm_rows = (
        db.session.query(
            TransactionLog.payment_method,
            func.count(TransactionLog.id).label("count"),
            func.coalesce(func.sum(TransactionLog.amount), 0.0).label("total_amount"),
        )
        .group_by(TransactionLog.payment_method)
        .order_by(func.count(TransactionLog.id).desc())
        .all()
    )

    payment_methods = [
        {"method": pm, "count": count, "total_amount": round(float(amount), 2)}
        for pm, count, amount in pm_rows
    ]

    # Top Inflow Merchants
    merchant_rows = (
        db.session.query(
            UserBasicDetails.username,
            func.count(TransactionLog.id).label("count"),
            func.coalesce(func.sum(TransactionLog.amount), 0.0).label("total_amount"),
        )
        .join(UserBasicDetails, UserBasicDetails.id == TransactionLog.receiver_id)
        .filter(UserBasicDetails.user_type == "Business")
        .group_by(UserBasicDetails.username)
        .order_by(func.sum(TransactionLog.amount).desc())
        .limit(5)
        .all()
    )
    top_merchants = [
        {"name": name, "count": count, "total_amount": round(float(amount), 2)}
        for name, count, amount in merchant_rows
    ]

    # Monthly Trends (aggregated over all tx logs)
    all_txs = TransactionLog.query.order_by(TransactionLog.timestamp.asc()).all()
    monthly_map = {}
    for tx in all_txs:
        if tx.timestamp:
            m_key = tx.timestamp.strftime("%Y-%m")
            m_label = tx.timestamp.strftime("%b %Y")
            if m_key not in monthly_map:
                monthly_map[m_key] = {"month": m_key, "label": m_label, "total_amount": 0.0, "count": 0}
            monthly_map[m_key]["total_amount"] += float(tx.amount)
            monthly_map[m_key]["count"] += 1

    monthly_trends = sorted(list(monthly_map.values()), key=lambda x: x["month"])
    for m in monthly_trends:
        m["total_amount"] = round(m["total_amount"], 2)

    # Recent transactions
    recent = fetch_transactions_with_classification(limit=6)

    return {
        "total_transactions": total_tx,
        "total_volume": round(float(total_volume), 2),
        "avg_amount": round(float(avg_amount), 2),
        "total_users": total_users,
        "total_liquidity": round(float(total_liquidity), 2),
        "categories": categories,
        "payment_methods": payment_methods,
        "top_merchants": top_merchants,
        "monthly_trends": monthly_trends,
        "recent_transactions": recent,
    }


def seed_demo_data_if_empty():
    """Seeds rich demo users and transactions if database is empty."""
    user_count = UserBasicDetails.query.count()
    if user_count > 0:
        return

    print("[SEED] Seeding initial users and ledger records...")
    demo_users_data = [
        ("Alice_Dev", "Password123!", "Personal", 25000.0),
        ("Bob_Trader", "Password123!", "Personal", 18500.0),
        ("Charlie_Student", "Password123!", "Personal", 6500.0),
        ("Apollo_Hospital_Pvt", "Password123!", "Business", 450000.0),
        ("City_Supermart_Ltd", "Password123!", "Business", 320000.0),
        ("Starbucks_Coffee", "Password123!", "Business", 85000.0),
        ("PVR_Cinemas_Pvt", "Password123!", "Business", 120000.0),
        ("State_Power_Corp", "Password123!", "Business", 900000.0),
    ]

    created_users = {}
    for uname, pwd, utype, bal in demo_users_data:
        h = generate_password_hash(pwd)
        u = create_user(uname, h, utype, bal)
        created_users[uname] = u

    # Seed sample transactions
    sample_transfers = [
        ("Alice_Dev", "Apollo_Hospital_Pvt", 2450.00, "Credit_Card", "Apollo Hospital Emergency Kolkata", "Healthcare", 0.998, 2),
        ("Bob_Trader", "City_Supermart_Ltd", 1320.50, "UPI", "City Supermart South City Mall", "Groceries", 0.994, 1),
        ("Charlie_Student", "Starbucks_Coffee", 450.00, "UPI", "Starbucks Cafe Park Street", "Restaurants", 0.923, 4),
        ("Alice_Dev", "PVR_Cinemas_Pvt", 780.00, "Debit_Card", "PVR Cinemas IMAX Forum Mall", "Entertainment", 0.985, 0),
        ("Bob_Trader", "State_Power_Corp", 3120.00, "NetBanking", "CESC State Power Board Online Portal", "Utilities", 0.999, 7),
        ("Alice_Dev", "City_Supermart_Ltd", 640.00, "UPI", "City Supermart Groceries Counter", "Groceries", 0.991, 1),
        ("Charlie_Student", "Apollo_Hospital_Pvt", 850.00, "UPI", "Apollo Pharmacy Medicine Store", "Healthcare", 0.995, 2),
    ]

    for sender_name, receiver_name, amt, pm, loc, cat, conf, cid in sample_transfers:
        s = created_users.get(sender_name)
        r = created_users.get(receiver_name)
        if s and r and s.balance >= amt:
            s.balance -= amt
            r.balance += amt
            tx = TransactionLog(
                sender_id=s.id,
                receiver_id=r.id,
                amount=amt,
                payment_method=pm,
                location=loc,
                timestamp=datetime.utcnow(),
            )
            db.session.add(tx)
            db.session.flush()
            classification = TransactionClassification(
                transaction_id=tx.id,
                category=cat,
                confidence=conf,
                class_id=cid,
                created_at=datetime.utcnow(),
            )
            db.session.add(classification)

    db.session.commit()
    print("[SEED] Seeding completed successfully.")
