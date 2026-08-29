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


def execute_transfer(sender_id, receiver_id, amount, payment_method, location, category, confidence, class_id):
    sender = get_user_by_id(sender_id)
    receiver = get_user_by_id(receiver_id)

    if not sender or not receiver:
        raise ValueError("Invalid sender or receiver ID.")
    if sender.balance < amount:
        raise ValueError("Insufficient balance.")

    sender.balance -= amount
    receiver.balance += amount

    tx_log = TransactionLog(
        sender_id=sender_id,
        receiver_id=receiver_id,
        amount=amount,
        payment_method=payment_method,
        location=location,
    )
    db.session.add(tx_log)
    db.session.flush()

    classification_log = TransactionClassification(
        transaction_id=tx_log.id,
        category=category,
        confidence=confidence,
        class_id=class_id,
    )
    db.session.add(classification_log)

    db.session.commit()
    return tx_log, classification_log


def fetch_user_transactions(user_id):
    return TransactionLog.query.filter(
        (TransactionLog.sender_id == user_id) | (TransactionLog.receiver_id == user_id)
    ).order_by(TransactionLog.timestamp.desc()).all()


def fetch_transaction_prediction_join_sql():
    return """
        SELECT
            tl.id,
            s.username AS sender_username,
            r.username AS receiver_username,
            tl.amount,
            tl.payment_method,
            tl.location,
            tl.timestamp,
            tc.category AS predicted_category,
            tc.confidence AS predicted_confidence,
            tc.class_id AS predicted_class_id
        FROM transaction_logs tl
        LEFT JOIN transaction_classifications tc
            ON tc.transaction_id = tl.id
        LEFT JOIN user_basic_details s
            ON s.id = tl.sender_id
        LEFT JOIN user_basic_details r
            ON r.id = tl.receiver_id
        ORDER BY tl.timestamp DESC
    """


def fetch_transactions_with_classification(user_id=None):
    query = (
        TransactionLog.query
        .outerjoin(
            TransactionClassification,
            TransactionClassification.transaction_id == TransactionLog.id,
        )
        .order_by(TransactionLog.timestamp.desc())
    )

    if user_id is not None:
        query = query.filter(
            (TransactionLog.sender_id == user_id) | (TransactionLog.receiver_id == user_id)
        )

    rows = []
    for tx in query.all():
        sender = get_user_by_id(tx.sender_id)
        receiver = get_user_by_id(tx.receiver_id)
        classification = tx.classification

        rows.append({
            "id": tx.id,
            "sender_id": tx.sender_id,
            "sender_username": sender.username if sender else None,
            "receiver_id": tx.receiver_id,
            "receiver_username": receiver.username if receiver else None,
            "amount": tx.amount,
            "payment_method": tx.payment_method,
            "location": tx.location,
            "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
            "category": classification.category if classification else None,
            "confidence": classification.confidence if classification else None,
            "class_id": classification.class_id if classification else None,
            "actual_amount": tx.amount,
            "actual_payment_method": tx.payment_method,
            "actual_location": tx.location,
            "predicted_category": classification.category if classification else None,
            "predicted_confidence": classification.confidence if classification else None,
            "predicted_class_id": classification.class_id if classification else None,
        })

    return rows