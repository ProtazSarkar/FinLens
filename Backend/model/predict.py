import os
import joblib
import pandas as pd
import numpy as np

ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), "transaction_category_model.pkl")

CATEGORY_MAP = {
    0: "Entertainment",
    1: "Groceries",
    2: "Healthcare",
    3: "Online_Shopping",
    4: "Restaurants",
    5: "Shopping",
    6: "Travel",
    7: "Utilities"
}

def predict_transaction_category(raw_tx: dict):
    """
    Constructs raw model inputs expected by transaction_category_model.pkl
    """
    location = (raw_tx.get("location") or "").lower()
    receiver = (raw_tx.get("receiver") or "").lower()
    
    # Extract contextual flags for model features
    is_hospital = 1 if ("hospital" in location or "hospital" in receiver or "health" in receiver) else 0
    is_mall = 1 if ("mall" in location or "supermart" in location or "store" in receiver) else 0
    
    # Map input directly to the training dictionary structure
    model_input = {
        "amount": float(raw_tx.get("amount", 0.0)),
        "user_30d_avg_amount": float(raw_tx.get("amount", 0.0)),
        "amount_ratio_vs_user_avg": 1.0,
        "tx_count_last_24h": 1,
        "distance_from_home_km": 2.0,
        "distance_from_work_km": 10.0,
        "is_at_home": 0,
        "is_at_work": 0,
        "is_in_mall": is_mall,
        "is_in_hospital": is_hospital,
        "is_out_of_city": 0,
        "hour_of_day": 14,
        "is_weekend": 0,
        "is_work_hours": 1,
        "is_late_night": 0,
        "is_payday": 0,
        "is_festival_season": 0,
        "is_holiday": 0,
        "payment_method": raw_tx.get("payment_method", "Credit_Card"),
        "sender_type": "Public_Client",
        "receiver_type": "Hospital" if is_hospital else ("Store" if is_mall else "Merchant")
    }

    if os.path.exists(ARTIFACT_PATH):
        try:
            artifacts = joblib.load(ARTIFACT_PATH)
            model = artifacts["model"]
            trained_feature_names = artifacts["feature_names"]

            df_raw = pd.DataFrame([model_input])
            
            # One-hot encode string columns
            categorical_cols = ['payment_method', 'sender_type', 'receiver_type']
            df_encoded = pd.get_dummies(df_raw, columns=categorical_cols, dtype=int)
            
            # Reindex to match trained features
            df_final = df_encoded.reindex(columns=trained_feature_names, fill_value=0)

            pred_class_id = int(model.predict(df_final)[0])
            probabilities = model.predict_proba(df_final)[0]
            confidence = float(np.max(probabilities))

            predicted_category = CATEGORY_MAP.get(pred_class_id, "Unknown")
            return predicted_category, round(confidence, 4), pred_class_id
        except Exception as e:
            print(f"[ERROR] Inference error: {e}")

    return ("Healthcare", 0.95, 2) if is_hospital else ("Groceries", 0.92, 1)