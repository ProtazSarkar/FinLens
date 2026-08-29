from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class UserBasicDetails(db.Model):
    __tablename__ = "user_basic_details"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.String(50), default="Personal")
    balance = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class TransactionLog(db.Model):
    __tablename__ = "transaction_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("user_basic_details.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("user_basic_details.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default="UPI")
    location = db.Column(db.String(200), default="Unknown")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # 1-to-1 relationship with Classification
    classification = db.relationship("TransactionClassification", backref="transaction", uselist=False)

class TransactionClassification(db.Model):
    __tablename__ = "transaction_classifications"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey("transaction_logs.id"), nullable=False, unique=True)
    category = db.Column(db.String(100), nullable=False)   # e.g., Shopping, Groceries, Healthcare
    confidence = db.Column(db.Float, nullable=False)         # Model Probability (0.0 to 1.0)
    class_id = db.Column(db.Integer, nullable=False)         # Numeric class ID (0 to 7)
    created_at = db.Column(db.DateTime, default=datetime.now)