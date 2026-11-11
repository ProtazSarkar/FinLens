from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from database.util import get_user_by_username, create_user, fetch_all_users, get_user_by_id, deposit_to_user


def register_user_service(data):
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    user_type = data.get("user_type", "Personal")
    raw_balance = data.get("balance", data.get("initial_balance", 10000.0))

    try:
        initial_balance = max(0.0, float(raw_balance))
    except (ValueError, TypeError):
        initial_balance = 10000.0

    if not username or not password:
        return {"error": "Username and password are required"}, 400

    if len(username) < 3:
        return {"error": "Username must be at least 3 characters long"}, 400

    if len(password) < 6:
        return {"error": "Password must be at least 6 characters long"}, 400

    if get_user_by_username(username):
        return {"error": f"User '{username}' already exists"}, 409

    hashed = generate_password_hash(password)
    user = create_user(username, hashed, user_type, initial_balance=initial_balance)

    return {
        "message": "User registered successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "balance": round(float(user.balance), 2),
            "user_type": user.user_type,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
    }, 201


def login_user_service(data):
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = get_user_by_username(username)
    if not user or not check_password_hash(user.password_hash, password):
        return {"error": "Invalid username or password"}, 401

    token = create_access_token(identity=str(user.id))

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "balance": round(float(user.balance), 2),
            "user_type": user.user_type,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
    }, 200


def get_all_users_service():
    users = fetch_all_users()
    payload = [
        {
            "id": u.id,
            "username": u.username,
            "user_type": u.user_type,
            "balance": round(float(u.balance), 2),
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]
    return {"users": payload}, 200


def get_me_service(user_id):
    user = get_user_by_id(user_id)
    if not user:
        return {"error": "User not found"}, 404

    return {
        "id": user.id,
        "username": user.username,
        "user_type": user.user_type,
        "balance": round(float(user.balance), 2),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }, 200


def deposit_user_service(user_id, data):
    raw_amount = data.get("amount")
    try:
        amount = float(raw_amount)
    except (ValueError, TypeError):
        return {"error": "Invalid deposit amount specified"}, 400

    try:
        user = deposit_to_user(user_id, amount)
        return {
            "message": f"Successfully deposited INR {amount:,.2f} into account {user.username}.",
            "user": {
                "id": user.id,
                "username": user.username,
                "balance": round(float(user.balance), 2),
                "user_type": user.user_type,
            },
        }, 200
    except ValueError as e:
        return {"error": str(e)}, 400
