from flask import Blueprint, request, jsonify
from service.transaction import process_transaction_service, get_history_service, get_all_history_service

transaction_bp = Blueprint("transaction_bp", __name__)


@transaction_bp.route("/transfer", methods=["POST"])
def transfer():
    data = request.get_json() or {}
    res, status = process_transaction_service(data)
    return jsonify(res), status


@transaction_bp.route("/history/<int:user_id>", methods=["GET"])
def history(user_id):
    res, status = get_history_service(user_id)
    return jsonify(res), status


@transaction_bp.route("/history/all", methods=["GET"])
def all_history():
    res, status = get_all_history_service()
    return jsonify(res), status