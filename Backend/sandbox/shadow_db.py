import time
import sqlite3
import pandas as pd
from typing import Dict, Any, List
from database.models import db, UserBasicDetails, TransactionLog, TransactionClassification


class ShadowSandbox:
    """
    In-memory isolated shadow environment mirroring the production database schema
    seeded with a non-destructive sample slice of active records.
    Used for safe dry-run execution, telemetry gathering, and cost profiling.
    """

    def __init__(self, sample_size: int = 100):
        self.sample_size = sample_size
        self.conn = sqlite3.connect(":memory:", check_same_thread=False)
        self.is_seeded = False

    def seed_from_live_db(self, app_context=None):
        """Populates the shadow SQLite memory database with a slice of live records."""
        try:
            # Seed users (excluding password_hash for safety)
            users_query = f"SELECT id, username, user_type, balance, created_at FROM {UserBasicDetails.__tablename__} LIMIT {self.sample_size}"
            users_df = pd.read_sql(users_query, db.engine)
            users_df.to_sql("user_basic_details", self.conn, index=False, if_exists="replace")

            # Seed transactions
            tx_query = f"SELECT id, sender_id, receiver_id, amount, payment_method, location, timestamp FROM {TransactionLog.__tablename__} LIMIT {self.sample_size}"
            tx_df = pd.read_sql(tx_query, db.engine)
            tx_df.to_sql("transaction_logs", self.conn, index=False, if_exists="replace")

            # Seed classifications
            class_query = f"SELECT id, transaction_id, category, confidence, class_id, created_at FROM {TransactionClassification.__tablename__} LIMIT {self.sample_size}"
            class_df = pd.read_sql(class_query, db.engine)
            class_df.to_sql("transaction_classifications", self.conn, index=False, if_exists="replace")

            self.is_seeded = True
            return True
        except Exception as e:
            # If live DB read fails, seed with minimal mock schema
            print(f"[SHADOW_SANDBOX] Could not seed from live DB ({e}). Falling back to schema tables.")
            self._create_empty_schema()
            return False

    def _create_empty_schema(self):
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_basic_details (
                id INTEGER PRIMARY KEY,
                username TEXT,
                user_type TEXT,
                balance REAL,
                created_at TEXT
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transaction_logs (
                id INTEGER PRIMARY KEY,
                sender_id INTEGER,
                receiver_id INTEGER,
                amount REAL,
                payment_method TEXT,
                location TEXT,
                timestamp TEXT
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transaction_classifications (
                id INTEGER PRIMARY KEY,
                transaction_id INTEGER,
                category TEXT,
                confidence REAL,
                class_id INTEGER,
                created_at TEXT
            );
        """)
        self.conn.commit()
        self.is_seeded = True

    def dry_run(self, sql_query: str) -> Dict[str, Any]:
        """
        Executes query safely within in-memory shadow database.
        Returns execution telemetry, result shape, and error messages if any.
        """
        start_time = time.perf_counter()
        cursor = self.conn.cursor()

        try:
            cursor.execute(sql_query)
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            all_rows = cursor.fetchall()
            row_count = len(all_rows)
            
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            
            # Form sample preview records (up to 5)
            sample_records = []
            for row in all_rows[:5]:
                sample_records.append(dict(zip(columns, row)))

            # Assess risk heuristic
            cost_risk = "LOW"
            if elapsed_ms > 200 or row_count > 500:
                cost_risk = "MEDIUM"
            if elapsed_ms > 800:
                cost_risk = "HIGH"

            return {
                "success": True,
                "execution_time_ms": elapsed_ms,
                "row_count": row_count,
                "columns": columns,
                "sample_rows": sample_records,
                "cost_risk": cost_risk,
                "error": None,
            }
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "success": False,
                "execution_time_ms": elapsed_ms,
                "row_count": 0,
                "columns": [],
                "sample_rows": [],
                "cost_risk": "HIGH",
                "error": str(e),
            }


# Singleton shadow sandbox instance
shadow_sandbox = ShadowSandbox()
