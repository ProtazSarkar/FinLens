import os
import joblib

ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), "transaction_category_model.pkl")

if os.path.exists(ARTIFACT_PATH):
    artifacts = joblib.load(ARTIFACT_PATH)
    print("--- EXPECTED FEATURE NAMES IN PKL MODEL ---")
    for i, name in enumerate(artifacts.get("feature_names", []), 1):
        print(f"{i}. {name}")
else:
    print("pkl file not found.")