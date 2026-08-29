import os
import pickle
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

def evaluate_transaction_xgboost(amount: float, payment_method: str):
    """
    Evaluates a transaction using an XGBoost Classifier model.
    Returns: (is_fraud: bool, transaction_type: str, confidence: float)
    """
    # Simple method encoding map
    method_map = {"UPI": 1, "CARD": 2, "NETBANKING": 3}
    method_code = method_map.get(payment_method.upper(), 0)

    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                model = pickle.load(f)

            # Feature vector: [amount, payment_method_code]
            features = np.array([[amount, method_code]])
            
            # Get probability scores from XGBoost classifier
            probabilities = model.predict_proba(features)[0]
            fraud_prob = float(probabilities[1])  # Class 1 = Fraud
            
            is_fraud = fraud_prob >= 0.5
            confidence = fraud_prob if is_fraud else (1.0 - fraud_prob)
            
            tx_type = "High-Risk Anomaly (XGBoost)" if is_fraud else "Legitimate Transfer"
            return is_fraud, tx_type, round(confidence, 4)
        except Exception as e:
            print(f"[WARNING] Fallback triggered. Could not run XGBoost model: {e}")

    # Fallback logic if model.pkl does not exist yet
    if amount > 50000.0:
        return True, "Suspicious Large Transfer (Rule-based)", 0.95
    else:
        return False, "Standard Peer Transfer", 0.98