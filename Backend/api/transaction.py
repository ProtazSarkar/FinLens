from flask import Blueprint, request, jsonify
from service.transaction import (
    process_transaction_service,
    predict_transaction_preview_service,
    get_history_service,
    get_all_history_service,
    get_ledger_stats_service,
    verify_receipt_service,
)

transaction_bp = Blueprint("transaction_bp", __name__)


@transaction_bp.route("/transfer", methods=["POST"])
def transfer():
    data = request.get_json() or {}
    res, status = process_transaction_service(data)
    return jsonify(res), status


@transaction_bp.route("/predict", methods=["POST"])
def predict_preview():
    data = request.get_json() or {}
    res, status = predict_transaction_preview_service(data)
    return jsonify(res), status


@transaction_bp.route("/verify", methods=["POST"])
def verify_receipt():
    data = request.get_json() or {}
    res, status = verify_receipt_service(data)
    return jsonify(res), status


@transaction_bp.route("/stats", methods=["GET"])
def stats():
    res, status = get_ledger_stats_service()
    return jsonify(res), status


@transaction_bp.route("/history/<int:user_id>", methods=["GET"])
def history(user_id):
    res, status = get_history_service(user_id)
    return jsonify(res), status


@transaction_bp.route("/history/all", methods=["GET"])
def all_history():
    category = request.args.get("category")
    search = request.args.get("search")
    limit_arg = request.args.get("limit")
    limit = int(limit_arg) if limit_arg and limit_arg.isdigit() else None

    res, status = get_all_history_service(category=category, search=search, limit=limit)
    return jsonify(res), status
