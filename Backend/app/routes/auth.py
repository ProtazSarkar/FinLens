from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User
from app.utils.logger import log_event

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')

    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'error': 'User with this username or email already exists'}), 400

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    log_event('USER_REGISTERED', {'user_id': user.id, 'username': user.username, 'role': user.role})
    return jsonify({'message': 'Registration successful', 'user': user.to_dict()}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        log_event('LOGIN_FAILED', {'username': username})
        return jsonify({'error': 'Invalid credentials'}), 401

    access_token = create_access_token(identity=str(user.id))
    log_event('USER_LOGIN', {'user_id': user.id, 'username': user.username})
    return jsonify({'token': access_token, 'user': user.to_dict()}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict()), 200