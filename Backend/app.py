from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from database.models import db
from api.user import user_bp
from api.transaction import transaction_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(
        app,
        resources={r"/api/*": {"origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3002",
            "http://127.0.0.1:3002",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
        ]}},
        supports_credentials=True,
        expose_headers=["Content-Type", "Authorization"],
    )

    db.init_app(app)
    JWTManager(app)

    with app.app_context():
        db.create_all()

    # Register Blueprints according to README route specifications
    app.register_blueprint(user_bp, url_prefix="/api/user")
    app.register_blueprint(transaction_bp, url_prefix="/api/transaction")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)