from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from service.user import (
    register_user_service,
    login_user_service,
    get_all_users_service,
    get_me_service,
    deposit_user_service,
)

user_bp = Blueprint("user_bp", __name__)


@user_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    res, status = register_user_service(data)
    return jsonify(res), status


@user_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    res, status = login_user_service(data)
    return jsonify(res), status


@user_bp.route("/all", methods=["GET"])
def get_all_users():
    res, status = get_all_users_service()
    return jsonify(res), status


@user_bp.route("/<int:user_id>/deposit", methods=["POST"])
def deposit(user_id):
    data = request.get_json() or {}
    res, status = deposit_user_service(user_id, data)
    return jsonify(res), status


@user_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    res, status = get_me_service(user_id)
    return jsonify(res), status
