from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from database.util import get_user_by_username, create_user, fetch_all_users, get_user_by_id


def register_user_service(data):
    username = data.get("username")
    password = data.get("password")
    user_type = data.get("user_type", "Personal")

    if not username or not password:
        return {"error": "Username and password are required"}, 400

    if get_user_by_username(username):
        return {"error": "User already exists"}, 409

    hashed = generate_password_hash(password)
    user = create_user(username, hashed, user_type)

    return {
        "message": "User registered successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "balance": user.balance,
            "user_type": user.user_type,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
    }, 201


def login_user_service(data):
    username = data.get("username")
    password = data.get("password")

    user = get_user_by_username(username)
    if not user or not check_password_hash(user.password_hash, password):
        return {"error": "Invalid credentials"}, 401

    token = create_access_token(identity=str(user.id))

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "balance": user.balance,
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
            "balance": u.balance,
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
        "balance": user.balance,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }, 200