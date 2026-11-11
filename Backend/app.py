import os

from api.transaction import transaction_bp
from api.user import user_bp
from config import Config
from database.models import db
from database.util import seed_demo_data_if_empty
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "https://smartledger-1-u3z7.onrender.com",
    ]
    configured_frontend = os.getenv("FRONTEND_URL")
    if configured_frontend:
        allowed_origins.append(configured_frontend.rstrip("/"))

    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
        expose_headers=["Content-Type", "Authorization"],
    )

    db.init_app(app)
    JWTManager(app)

    with app.app_context():
        db.create_all()
        seed_demo_data_if_empty()

    # Register Blueprints according to README route specifications
    app.register_blueprint(user_bp, url_prefix="/api/user")
    app.register_blueprint(transaction_bp, url_prefix="/api/transaction")

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy",
            "service": "SmartLedger AI Ledger Engine",
            "database": "active",
        }), 200

    return app


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app = create_app()
    app.run(host="0.0.0.0", port=port, debug=True)
