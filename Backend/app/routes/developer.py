from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Transaction, EventLog
from app.utils.logger import log_event

developer_bp = Blueprint('developer', __name__)

def check_developer_role(user_id):
    user = User.query.get(user_id)
    return user and user.role == 'developer'

@developer_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    user_id = int(get_jwt_identity())
    if not check_developer_role(user_id):
        return jsonify({'error': 'Access denied: Developer privileges required'}), 403

    users = User.query.order_by(User.id.asc()).all()
    return jsonify([u.to_dict() for u in users]), 200

@developer_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    user_id = int(get_jwt_identity())
    if not check_developer_role(user_id):
        return jsonify({'error': 'Access denied'}), 403

    data = request.json or {}
    if User.query.filter((User.username == data.get('username')) | (User.email == data.get('email'))).first():
        return jsonify({'error': 'User already exists'}), 400

    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        balance=float(data.get('balance', 1000.0)),
        role=data.get('role', 'user')
    )
    new_user.set_password(data.get('password', 'default123'))
    db.session.add(new_user)
    db.session.commit()

    log_event('ADMIN_USER_CREATED', {'created_by': user_id, 'new_user_id': new_user.id})
    return jsonify(new_user.to_dict()), 201

@developer_bp.route('/transactions', methods=['GET'])
@jwt_required()
def global_transactions():
    user_id = int(get_jwt_identity())
    if not check_developer_role(user_id):
        return jsonify({'error': 'Access denied'}), 403

    txs = Transaction.query.order_by(Transaction.timestamp.desc()).all()
    return jsonify([t.to_dict() for t in txs]), 200

@developer_bp.route('/events', methods=['GET'])
@jwt_required()
def system_events():
    user_id = int(get_jwt_identity())
    if not check_developer_role(user_id):
        return jsonify({'error': 'Access denied'}), 403

    events = EventLog.query.order_by(EventLog.timestamp.desc()).limit(100).all()
    return jsonify([e.to_dict() for e in events]), 200