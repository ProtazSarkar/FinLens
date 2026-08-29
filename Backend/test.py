from app import create_app
from database.models import db, UserBasicDetails
from service.user import register_user_service
from service.transaction import process_transaction_service, get_history_service

app = create_app()

def run_test():
    with app.app_context():
        print("[INFO] Clearing existing tables and re-creating schema...")
        db.drop_all()
        db.create_all()

        print("\n--- 1. SEEDING USERS ---")
        # Create Alice (Sender)
        alice_res, _ = register_user_service({
            "username": "Alice_Dev",
            "password": "Password123!",
            "user_type": "Personal"
        })
        print(f"[CREATED] Sender: {alice_res['user']}")

        # Receiver 1: Hospital Merchant
        hospital_res, _ = register_user_service({
            "username": "Apollo_Hospital_Pvt",
            "password": "Password123!",
            "user_type": "Business"
        })
        print(f"[CREATED] Receiver 1 (Hospital): {hospital_res['user']}")

        # Receiver 2: Retail/Grocery Merchant
        mart_res, _ = register_user_service({
            "username": "City_Supermart_Ltd",
            "password": "Password123!",
            "user_type": "Business"
        })
        print(f"[CREATED] Receiver 2 (Supermart): {mart_res['user']}")

        alice_id = alice_res['user']['id']
        hospital_id = hospital_res['user']['id']
        mart_id = mart_res['user']['id']

        print("\n--- 2. EXECUTING TEST TRANSACTIONS ---")
        # Transaction 1: Healthcare / Hospital test
        tx1_res, _ = process_transaction_service({
            "sender_id": alice_id,
            "receiver_id": hospital_id,
            "amount": 2450.00,
            "payment_method": "Credit_Card",
            "location": "Apollo Hospital Branch, Kolkata"
        })
        print("[TX 1 EXECUTED]:")
        print(f"  - Category: {tx1_res['classification']['category']}")
        print(f"  - Confidence: {tx1_res['classification']['confidence'] * 100:.2f}%")
        print(f"  - Signature: {tx1_res['signature']}")

        # Transaction 2: Groceries / Retail test
        tx2_res, _ = process_transaction_service({
            "sender_id": alice_id,
            "receiver_id": mart_id,
            "amount": 420.50,
            "payment_method": "UPI",
            "location": "City Mall Supermart"
        })
        print("\n[TX 2 EXECUTED]:")
        print(f"  - Category: {tx2_res['classification']['category']}")
        print(f"  - Confidence: {tx2_res['classification']['confidence'] * 100:.2f}%")

        print("\n--- 3. FETCHING TRANSACTION HISTORY FROM DATABASE ---")
        history_res, status = get_history_service(alice_id)
        print(f"[FETCH SUCCESS] Status Code: {status}")
        print(f"[DATABASE RECORDS RECORDED]: {len(history_res['transactions'])} entries found:")
        
        for record in history_res['transactions']:
            print(f"  - TX #{record['id']} | Amount: INR {record['amount']} | Category: {record['classification']['category']} ({record['classification']['confidence']*100:.1f}%)")

if __name__ == "__main__":
    run_test()