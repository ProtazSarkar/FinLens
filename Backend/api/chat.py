from flask import Blueprint, request, jsonify
from service.agent_judge import execute_finlens_pipeline
from model.behavioral import analyze_behavioral_recurrence

chat_bp = Blueprint("chat_bp", __name__)


@chat_bp.route("/ask", methods=["POST"])
def ask_assistant():
    """
    Main NL-to-SQL Analytics endpoint:
    Processes plain-English prompts through the dual-agent shadow sandbox pipeline.
    """
    data = request.get_json() or {}
    prompt = (data.get("prompt") or "").strip()
    active_user_id = data.get("active_user_id")
    force_execute = bool(data.get("force_execute", False))

    if not prompt:
        return jsonify({"success": False, "error": "Prompt cannot be empty."}), 400

    try:
        if active_user_id is not None:
            active_user_id = int(active_user_id)
    except (ValueError, TypeError):
        active_user_id = None

    result = execute_finlens_pipeline(
        prompt=prompt,
        active_user_id=active_user_id,
        force_execute=force_execute,
    )

    status_code = 200 if result.get("success") else 400
    return jsonify(result), status_code


@chat_bp.route("/suggestions", methods=["GET"])
def get_prompt_suggestions():
    """Provides curated analytical question suggestions for the chat interface."""
    suggestions = [
        {
            "id": "cat_spend",
            "title": "Category Spend Breakdown",
            "prompt": "Show total spend and transaction count grouped by category, ordered from highest to lowest spend.",
            "category": "Spend Analysis",
        },
        {
            "id": "top_merchants",
            "title": "Top Inflow Merchants",
            "prompt": "Who are the top 5 merchants or recipients by total money received?",
            "category": "Counterparties",
        },
        {
            "id": "recurring_subs",
            "title": "Detect Recurring Subscriptions",
            "prompt": "Identify all recurring payments and subscriptions with their average amounts.",
            "category": "Behavioral",
        },
        {
            "id": "payment_rails",
            "title": "Payment Channel Share",
            "prompt": "What is the breakdown of transactions across UPI, Credit Card, Debit Card, and NetBanking?",
            "category": "Channels",
        },
        {
            "id": "high_ticket",
            "title": "High-Value Transactions (> ₹1,000)",
            "prompt": "List the most expensive transactions exceeding INR 1,000 with sender, receiver, and location.",
            "category": "Audit",
        },
    ]
    return jsonify({"suggestions": suggestions}), 200


@chat_bp.route("/recurrence", methods=["GET"])
def get_recurrence_insights():
    """Returns behavioral recurrence analysis and spend intent breakdown."""
    user_id_arg = request.args.get("user_id")
    user_id = int(user_id_arg) if user_id_arg and user_id_arg.isdigit() else None
    
    insights = analyze_behavioral_recurrence(user_id=user_id)
    return jsonify(insights), 200
