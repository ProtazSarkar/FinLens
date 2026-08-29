from database.util import execute_transfer, fetch_user_transactions, get_user_by_id, fetch_transactions_with_classification
from model.predict import predict_transaction_category
from security.encrypt_message import encode
from datetime import datetime


def process_transaction_service(data):
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    amount = float(data.get("amount", 0))
    payment_method = data.get("payment_method", "UPI")
    location = data.get("location", "Unknown")

    if not sender_id or not receiver_id or amount <= 0:
        return {"error": "Invalid transaction parameters"}, 400

    sender = get_user_by_id(sender_id)
    receiver = get_user_by_id(receiver_id)

    raw_tx = {
        "amount": amount,
        "payment_method": payment_method,
        "timestamp": datetime.utcnow().isoformat(),
        "location": location,
        "sender": sender.username if sender else str(sender_id),
        "receiver": receiver.username if receiver else str(receiver_id),
    }

    category, confidence, class_id = predict_transaction_category(raw_tx)

    try:
        tx, classification = execute_transfer(
            sender_id, receiver_id, amount, payment_method, location,
            category, confidence, class_id,
        )
        payload = f"tx_id:{tx.id}|amount:{tx.amount}"
        encrypted_receipt = encode(payload)

        return {
            "message": "Transaction executed successfully",
            "transaction_id": tx.id,
            "classification": {
                "category": classification.category,
                "confidence": classification.confidence,
                "class_id": classification.class_id,
            },
            "signature": encrypted_receipt,
        }, 200
    except ValueError as e:
        return {"error": str(e)}, 400


def get_history_service(user_id):
    logs = fetch_user_transactions(user_id)
    history = []
    for log in logs:
        classification_data = None
        if log.classification:
            classification_data = {
                "category": log.classification.category,
                "confidence": log.classification.confidence,
                "class_id": log.classification.class_id,
            }

        history.append({
            "id": log.id,
            "sender_id": log.sender_id,
            "receiver_id": log.receiver_id,
            "amount": log.amount,
            "payment_method": log.payment_method,
            "location": log.location,
            "timestamp": log.timestamp.isoformat(),
            "classification": classification_data,
            "predicted_category": classification_data["category"] if classification_data else None,
            "predicted_confidence": classification_data["confidence"] if classification_data else None,
            "predicted_class_id": classification_data["class_id"] if classification_data else None,
        })
    return {"transactions": history}, 200


def get_all_history_service():
    history = fetch_transactions_with_classification()
    return {"transactions": history}, 200