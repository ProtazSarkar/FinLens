import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from app.models import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    os.makedirs(os.path.join(app.root_path, '..', 'instance'), exist_ok=True)

    CORS(app)
    db.init_app(app)
    JWTManager(app)

    from app.routes.auth import auth_bp
    from app.routes.transaction import transaction_bp
    from app.routes.developer import developer_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(transaction_bp, url_prefix='/api/transactions')
    app.register_blueprint(developer_bp, url_prefix='/api/developer')

    with app.app_context():
        db.create_all()

    return app