from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Transaction
from app.utils.logger import log_event

transaction_bp = Blueprint('transaction', __name__)

@transaction_bp.route('/transfer', methods=['POST'])
@jwt_required()
def transfer():
    sender_id = int(get_jwt_identity())
    data = request.json or {}
    receiver_username = data.get('receiver_username')
    
    try:
        amount = float(data.get('amount', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid amount'}), 400

    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than zero'}), 400

    sender = User.query.get(sender_id)
    receiver = User.query.filter_by(username=receiver_username).first()

    if not receiver:
        return jsonify({'error': 'Receiver user not found'}), 404

    if sender.id == receiver.id:
        return jsonify({'error': 'Cannot transfer money to yourself'}), 400

    if sender.balance < amount:
        log_event('TRANSFER_FAILED', {
            'sender_id': sender.id,
            'receiver_id': receiver.id,
            'amount': amount,
            'reason': 'Insufficient funds'
        })
        return jsonify({'error': 'Insufficient funds'}), 400

    # Atomic Balance Transfer
    sender.balance -= amount
    receiver.balance += amount

    tx = Transaction(sender_id=sender.id, receiver_id=receiver.id, amount=amount)
    db.session.add(tx)
    db.session.commit()

    log_event('TRANSFER_SUCCESS', {
        'transaction_id': tx.id,
        'sender': sender.username,
        'receiver': receiver.username,
        'amount': amount
    })

    return jsonify({'message': 'Transfer successful', 'transaction': tx.to_dict(), 'new_balance': sender.balance}), 200

@transaction_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    txs = Transaction.query.filter(
        (Transaction.sender_id == user_id) | (Transaction.receiver_id == user_id)
    ).order_by(Transaction.timestamp.desc()).all()

    return jsonify([t.to_dict() for t in txs]), 200