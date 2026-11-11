from datetime import datetime
from database.util import (
    execute_transfer,
    fetch_user_transactions,
    get_user_by_id,
    fetch_transactions_with_classification,
    get_ledger_stats,
)
from model.predict import predict_transaction_category, get_prediction_details
from security.encrypt_message import encode, decode


def process_transaction_service(data):
    try:
        sender_id = int(data.get("sender_id"))
        receiver_id = int(data.get("receiver_id"))
        amount = float(data.get("amount", 0))
    except (ValueError, TypeError):
        return {"error": "Invalid transaction parameters: sender, receiver, and amount are required numbers."}, 400

    payment_method = data.get("payment_method", "UPI")
    location = (data.get("location") or "Unknown").strip()

    if amount <= 0:
        return {"error": "Transaction amount must be strictly greater than zero."}, 400

    if sender_id == receiver_id:
        return {"error": "Sender and receiver cannot be the same account."}, 400

    sender = get_user_by_id(sender_id)
    receiver = get_user_by_id(receiver_id)

    if not sender:
        return {"error": f"Sender account #{sender_id} does not exist."}, 404
    if not receiver:
        return {"error": f"Receiver account #{receiver_id} does not exist."}, 404

    if sender.balance < amount:
        return {
            "error": f"Insufficient funds: Sender #{sender_id} ({sender.username}) only has INR {sender.balance:,.2f}."
        }, 400

    raw_tx = {
        "amount": amount,
        "payment_method": payment_method,
        "timestamp": datetime.utcnow().isoformat(),
        "location": location,
        "sender": sender.username,
        "receiver": receiver.username,
    }

    category, confidence, class_id = predict_transaction_category(raw_tx)

    try:
        tx, classification = execute_transfer(
            sender_id,
            receiver_id,
            amount,
            payment_method,
            location,
            category,
            confidence,
            class_id,
        )
        payload = f"tx_id:{tx.id}|amount:{tx.amount:.2f}|sender:{sender.username}|receiver:{receiver.username}|cat:{category}|ts:{tx.timestamp.isoformat()}"
        encrypted_receipt = encode(payload)

        return {
            "message": "Transaction executed successfully",
            "transaction_id": tx.id,
            "sender": {
                "id": sender.id,
                "username": sender.username,
                "new_balance": round(float(sender.balance), 2),
            },
            "receiver": {
                "id": receiver.id,
                "username": receiver.username,
                "new_balance": round(float(receiver.balance), 2),
            },
            "amount": round(float(tx.amount), 2),
            "payment_method": tx.payment_method,
            "location": tx.location,
            "timestamp": tx.timestamp.isoformat(),
            "classification": {
                "category": classification.category,
                "confidence": round(float(classification.confidence), 4),
                "class_id": classification.class_id,
            },
            "signature": encrypted_receipt,
        }, 200
    except ValueError as e:
        return {"error": str(e)}, 400


def predict_transaction_preview_service(data):
    """Provides real-time interactive preview of AI category classification."""
    try:
        amount = float(data.get("amount", 0.0) or 0.0)
    except (ValueError, TypeError):
        amount = 0.0

    raw_tx = {
        "amount": amount,
        "payment_method": data.get("payment_method", "UPI"),
        "location": data.get("location", ""),
        "receiver": data.get("receiver", ""),
        "sender": data.get("sender", ""),
    }

    prediction = get_prediction_details(raw_tx)
    return {"prediction": prediction}, 200


def get_history_service(user_id):
    logs = fetch_user_transactions(user_id)
    return {"transactions": logs}, 200


def get_all_history_service(category=None, search=None, limit=None):
    history = fetch_transactions_with_classification(category=category, search=search, limit=limit)
    return {"transactions": history, "total": len(history)}, 200


def get_ledger_stats_service():
    stats = get_ledger_stats()
    return {"stats": stats}, 200


def verify_receipt_service(data):
    sig = data.get("signature", "").strip()
    if not sig:
        return {"error": "Signature string is required for verification."}, 400

    try:
        decoded = decode(sig)
        return {
            "valid": True,
            "raw_payload": decoded,
            "signature": sig,
        }, 200
    except Exception as e:
        return {"valid": False, "error": f"Invalid signature format: {e}"}, 400
