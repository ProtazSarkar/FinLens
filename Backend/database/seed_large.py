import os
import sys
import random
from datetime import datetime, timedelta

# Ensure Backend root is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from werkzeug.security import generate_password_hash
from app import create_app
from database.models import db, UserBasicDetails, TransactionLog, TransactionClassification
from sandbox.shadow_db import shadow_sandbox


def seed_large_dataset():
    app = create_app()
    with app.app_context():
        print("[SEED] Expanding users and ledger transactions...")

        personal_users = [
            ("Alice_Dev", "Password123!", "Personal", 54000.0),
            ("Bob_Trader", "Password123!", "Personal", 42500.0),
            ("Charlie_Student", "Password123!", "Personal", 16800.0),
            ("David_Miller", "Password123!", "Personal", 65000.0),
            ("Emma_Watson", "Password123!", "Personal", 84000.0),
            ("Frank_Engineer", "Password123!", "Personal", 49500.0),
            ("Grace_Designer", "Password123!", "Personal", 51200.0),
        ]

        business_users = [
            ("Apollo_Hospital_Pvt", "Password123!", "Business", 950000.0),
            ("City_Supermart_Ltd", "Password123!", "Business", 680000.0),
            ("Starbucks_Coffee", "Password123!", "Business", 220000.0),
            ("PVR_Cinemas_Pvt", "Password123!", "Business", 280000.0),
            ("State_Power_Corp", "Password123!", "Business", 1650000.0),
            ("TechZone_Electronics", "Password123!", "Business", 490000.0),
            ("Reliance_Retail_Ltd", "Password123!", "Business", 780000.0),
            ("Indigo_Airlines_Pvt", "Password123!", "Business", 890000.0),
            ("Swiggy_Food_Delivery", "Password123!", "Business", 310000.0),
            ("Amazon_India_Pvt", "Password123!", "Business", 1150000.0),
            ("Cult_Fitness_Club", "Password123!", "Business", 180000.0),
        ]

        user_map = {}
        for uname, pwd, utype, bal in personal_users + business_users:
            u = UserBasicDetails.query.filter_by(username=uname).first()
            if not u:
                u = UserBasicDetails(
                    username=uname,
                    password_hash=generate_password_hash(pwd),
                    user_type=utype,
                    balance=bal,
                    created_at=datetime(2026, 5, 1, 10, 0, 0),
                )
                db.session.add(u)
            user_map[uname] = u
        db.session.commit()

        # Re-fetch users to get database IDs
        all_users = UserBasicDetails.query.all()
        user_dict = {u.username: u for u in all_users}
        p_users = [u for u in all_users if u.user_type == "Personal"]

        # Templates for realistic transactions
        merchant_templates = [
            # Healthcare (Class ID 2)
            ("Apollo_Hospital_Pvt", "Apollo Hospital Emergency Kolkata", "Healthcare", 2, (1200, 6500), ["Credit_Card", "Debit_Card", "UPI"]),
            ("Apollo_Hospital_Pvt", "Apollo Pharmacy Medicine Store", "Healthcare", 2, (250, 1850), ["UPI", "Debit_Card"]),
            
            # Groceries (Class ID 1)
            ("City_Supermart_Ltd", "City Supermart South City Mall", "Groceries", 1, (450, 3200), ["UPI", "Debit_Card"]),
            ("Reliance_Retail_Ltd", "Reliance Fresh Supermarket Kolkata", "Groceries", 1, (380, 2900), ["UPI", "Debit_Card", "Credit_Card"]),
            
            # Utilities (Class ID 7)
            ("State_Power_Corp", "State Power Corp CESC Electricity Bill", "Utilities", 7, (1800, 4800), ["NetBanking", "UPI"]),
            ("State_Power_Corp", "Municipal Water & Gas Utility Bill", "Utilities", 7, (650, 1600), ["NetBanking", "UPI"]),
            
            # Restaurants (Class ID 4)
            ("Starbucks_Coffee", "Starbucks Cafe Park Street", "Restaurants", 4, (320, 950), ["UPI", "Credit_Card"]),
            ("Swiggy_Food_Delivery", "Swiggy Online Gourmet Delivery", "Restaurants", 4, (280, 1450), ["UPI", "Credit_Card"]),
            
            # Entertainment (Class ID 0)
            ("PVR_Cinemas_Pvt", "PVR Cinemas Forum IMAX Theatre", "Entertainment", 0, (480, 1600), ["Credit_Card", "UPI", "Debit_Card"]),
            ("Cult_Fitness_Club", "Cult.fit Monthly Gym & Yoga Center", "Entertainment", 0, (1500, 3200), ["Credit_Card", "NetBanking"]),
            
            # Shopping & Online Shopping (Class ID 3, 5)
            ("Amazon_India_Pvt", "Amazon India Prime Retail Order", "Online_Shopping", 3, (650, 8900), ["Credit_Card", "UPI", "NetBanking"]),
            ("TechZone_Electronics", "TechZone Electronics Park St Flagship", "Shopping", 5, (1200, 18500), ["Credit_Card", "NetBanking"]),
            
            # Travel (Class ID 6)
            ("Indigo_Airlines_Pvt", "Indigo Airlines Domestic Flight Kolkata-Delhi", "Travel", 6, (3800, 9800), ["Credit_Card", "NetBanking"]),
        ]

        # Generate ~75 transactions spread over the last 150 days (June 2026 to November 2026)
        base_date = datetime(2026, 11, 19, 12, 0, 0)
        transactions_to_add = []

        # Generate recurring monthly utility bills
        for month_offset in range(5, -1, -1):
            bill_date = base_date - timedelta(days=month_offset * 30 + random.randint(1, 4))
            for p_user in p_users[:4]:
                amt = round(random.uniform(2100, 3600), 2)
                t_obj = TransactionLog(
                    sender_id=p_user.id,
                    receiver_id=user_dict["State_Power_Corp"].id,
                    amount=amt,
                    payment_method="NetBanking",
                    location="State Power Corp Monthly Electric Bill",
                    timestamp=bill_date,
                )
                p_user.balance -= amt
                user_dict["State_Power_Corp"].balance += amt
                transactions_to_add.append((t_obj, "Utilities", 0.998, 7))

        # Generate recurring gym / fitness subscriptions
        for month_offset in range(4, -1, -1):
            sub_date = base_date - timedelta(days=month_offset * 30 + 1)
            for p_user in [user_dict["Alice_Dev"], user_dict["David_Miller"], user_dict["Emma_Watson"]]:
                amt = 2499.00
                t_obj = TransactionLog(
                    sender_id=p_user.id,
                    receiver_id=user_dict["Cult_Fitness_Club"].id,
                    amount=amt,
                    payment_method="Credit_Card",
                    location="Cult.fit Monthly Pro Pass",
                    timestamp=sub_date,
                )
                p_user.balance -= amt
                user_dict["Cult_Fitness_Club"].balance += amt
                transactions_to_add.append((t_obj, "Entertainment", 0.985, 0))

        # Generate random varied transactions
        for i in range(55):
            days_ago = random.randint(1, 140)
            hours_ago = random.randint(8, 22)
            mins_ago = random.randint(0, 59)
            tx_time = base_date - timedelta(days=days_ago, hours=hours_ago, minutes=mins_ago)

            sender = random.choice(p_users)
            receiver_name, loc, category, class_id, amt_range, methods = random.choice(merchant_templates)
            receiver = user_dict[receiver_name]

            amt = round(random.uniform(amt_range[0], amt_range[1]), 2)
            method = random.choice(methods)
            confidence = round(random.uniform(0.92, 0.999), 4)

            t_obj = TransactionLog(
                sender_id=sender.id,
                receiver_id=receiver.id,
                amount=amt,
                payment_method=method,
                location=loc,
                timestamp=tx_time,
            )
            sender.balance -= amt
            receiver.balance += amt
            transactions_to_add.append((t_obj, category, confidence, class_id))

        # Peer to peer transfers
        for i in range(6):
            days_ago = random.randint(2, 60)
            tx_time = base_date - timedelta(days=days_ago)
            s = random.choice(p_users)
            r = random.choice([u for u in p_users if u.id != s.id])
            amt = round(random.uniform(200, 2500), 2)

            t_obj = TransactionLog(
                sender_id=s.id,
                receiver_id=r.id,
                amount=amt,
                payment_method="UPI",
                location="Peer Settlement / UPI Transfer",
                timestamp=tx_time,
            )
            s.balance -= amt
            r.balance += amt
            transactions_to_add.append((t_obj, "Shopping", 0.91, 5))

        # Commit to database
        for tx, cat, conf, cid in transactions_to_add:
            db.session.add(tx)
            db.session.flush()
            tc = TransactionClassification(
                transaction_id=tx.id,
                category=cat,
                confidence=conf,
                class_id=cid,
                created_at=tx.timestamp,
            )
            db.session.add(tc)

        db.session.commit()
        total_tx = TransactionLog.query.count()
        print(f"[SEED SUCCESS] Total transactions in database now: {total_tx}")

        # Reseed in-memory shadow sandbox
        shadow_sandbox.seed_from_live_db()
        print("[SEED] In-memory shadow sandbox updated successfully!")


if __name__ == "__main__":
    seed_large_dataset()
