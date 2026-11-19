import os
import re
import json
import time
from typing import Dict, Any, List, Optional
from sqlalchemy import text
from dotenv import load_dotenv

from config import Config
from database.models import db
from security.sql_guard import validate_and_sanitize_sql, SQLSecurityError
from sandbox.shadow_db import shadow_sandbox

load_dotenv()

# Schema prompt definition provided to LLM
DATABASE_SCHEMA_PROMPT = """
Target Database Schema (SQLite / PostgreSQL Compatible):

1. user_basic_details:
   - id: INTEGER (PRIMARY KEY)
   - username: VARCHAR(100) (User or Business Name, e.g. 'Alice_Dev', 'Apollo_Hospital_Pvt')
   - user_type: VARCHAR(50) ('Personal' or 'Business')
   - balance: REAL (Current balance in INR)
   - created_at: DATETIME

2. transaction_logs:
   - id: INTEGER (PRIMARY KEY)
   - sender_id: INTEGER (Foreign Key -> user_basic_details.id)
   - receiver_id: INTEGER (Foreign Key -> user_basic_details.id)
   - amount: REAL (Transfer amount in INR)
   - payment_method: VARCHAR(50) ('UPI', 'Credit_Card', 'Debit_Card', 'NetBanking')
   - location: VARCHAR(200) (Merchant name, city, descriptor)
   - timestamp: DATETIME (Timestamp of transfer)

3. transaction_classifications:
   - id: INTEGER (PRIMARY KEY)
   - transaction_id: INTEGER (Foreign Key -> transaction_logs.id)
   - category: VARCHAR(100) ('Healthcare', 'Groceries', 'Utilities', 'Restaurants', 'Shopping', 'Entertainment', 'Travel', etc.)
   - confidence: REAL (ML classification probability 0.0 - 1.0)
   - class_id: INTEGER
   - created_at: DATETIME

Join Guidelines:
- To get sender username: JOIN user_basic_details s ON s.id = transaction_logs.sender_id
- To get receiver username: JOIN user_basic_details r ON r.id = transaction_logs.receiver_id
- To get category: JOIN transaction_classifications tc ON tc.transaction_id = transaction_logs.id
"""


def _get_groq_client():
    """Initializes Groq client with configured API key."""
    api_key = (os.getenv("GROQ_API_KEY") or "").strip()
    if not api_key:
        return None
    try:
        from groq import Groq
        return Groq(api_key=api_key)
    except Exception as e:
        print(f"[GROQ] Client init error: {e}")
        return None


def _call_groq(client, messages: List[Dict[str, str]], model_preference: str = None) -> Optional[str]:
    """Calls Groq API with automatic model fallback."""
    models_to_try = [model_preference] if model_preference else []
    models_to_try.extend(["qwen/qwen3.8-27b", "openai/gpt-oss-20b", "openai/gpt-oss-120b"])
    
    # Filter out empty or duplicate model names
    seen = set()
    models = [m for m in models_to_try if m and not (m in seen or seen.add(m))]

    for model_name in models:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.1,
                max_tokens=600,
            )
            content = response.choices[0].message.content or ""
            if content.strip():
                return content.strip()
        except Exception as e:
            print(f"[GROQ] Model '{model_name}' failed: {e}. Trying fallback...")
            continue
    return None


def agent_generate_sql(prompt: str, client=None, active_user_id: Optional[int] = None) -> str:
    """Agent 1: Translates business question into safe SQL query."""
    user_context = f"Filter by active user account ID #{active_user_id} if relevant to 'my' transactions." if active_user_id else ""

    system_instruction = f"""You are FinLens SQL Architect, an expert financial analytics query generator.
{DATABASE_SCHEMA_PROMPT}

Rules:
1. Output ONLY valid executable SQL. No conversational text, no explanations, no markdown fences.
2. Read-only SELECT statements ONLY. Never output INSERT, UPDATE, DELETE, or DROP.
3. For spend aggregations, use SUM(amount) or ROUND(SUM(amount), 2).
4. Always give clear alias column names (e.g., total_spend, transaction_count, sender_name).
{user_context}
"""

    if client:
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"Generate SQL query for: {prompt}"},
        ]
        response = _call_groq(client, messages)
        if response:
            return response

    # Deterministic fallback template engine for standard business questions
    q_lower = prompt.lower()
    if "category" in q_lower or "breakdown" in q_lower or "spend by" in q_lower:
        return """
            SELECT tc.category, 
                   COUNT(tl.id) AS transaction_count, 
                   ROUND(SUM(tl.amount), 2) AS total_spend
            FROM transaction_logs tl
            JOIN transaction_classifications tc ON tc.transaction_id = tl.id
            GROUP BY tc.category
            ORDER BY total_spend DESC
            LIMIT 10
        """.strip()
    elif "top" in q_lower and ("merchant" in q_lower or "receiver" in q_lower):
        return """
            SELECT r.username AS merchant_name, 
                   COUNT(tl.id) AS total_transactions, 
                   ROUND(SUM(tl.amount), 2) AS total_received
            FROM transaction_logs tl
            JOIN user_basic_details r ON r.id = tl.receiver_id
            GROUP BY r.username
            ORDER BY total_received DESC
            LIMIT 5
        """.strip()
    elif "recurring" in q_lower or "subscriptions" in q_lower or "bills" in q_lower:
        return """
            SELECT r.username AS counterparty,
                   tl.location,
                   ROUND(AVG(tl.amount), 2) AS avg_amount,
                   COUNT(tl.id) AS occurrences,
                   tc.category
            FROM transaction_logs tl
            JOIN user_basic_details r ON r.id = tl.receiver_id
            JOIN transaction_classifications tc ON tc.transaction_id = tl.id
            GROUP BY r.username, tl.location, tc.category
            HAVING COUNT(tl.id) >= 1
            ORDER BY occurrences DESC, avg_amount DESC
            LIMIT 10
        """.strip()
    elif "payment" in q_lower or "method" in q_lower or "upi" in q_lower:
        return """
            SELECT payment_method,
                   COUNT(id) AS transaction_count,
                   ROUND(SUM(amount), 2) AS total_volume,
                   ROUND(AVG(amount), 2) AS avg_ticket_size
            FROM transaction_logs
            GROUP BY payment_method
            ORDER BY total_volume DESC
        """.strip()
    elif "large" in q_lower or "highest" in q_lower or "expensive" in q_lower:
        return """
            SELECT tl.id,
                   s.username AS sender,
                   r.username AS receiver,
                   tl.amount,
                   tl.payment_method,
                   tl.location,
                   tc.category,
                   tl.timestamp
            FROM transaction_logs tl
            JOIN user_basic_details s ON s.id = tl.sender_id
            JOIN user_basic_details r ON r.id = tl.receiver_id
            LEFT JOIN transaction_classifications tc ON tc.transaction_id = tl.id
            ORDER BY tl.amount DESC
            LIMIT 10
        """.strip()
    else:
        return """
            SELECT tl.id,
                   s.username AS sender,
                   r.username AS receiver,
                   tl.amount,
                   tl.payment_method,
                   tl.location,
                   tc.category,
                   tl.timestamp
            FROM transaction_logs tl
            JOIN user_basic_details s ON s.id = tl.sender_id
            JOIN user_basic_details r ON r.id = tl.receiver_id
            LEFT JOIN transaction_classifications tc ON tc.transaction_id = tl.id
            ORDER BY tl.timestamp DESC
            LIMIT 10
        """.strip()


def agent_repair_sql(previous_sql: str, error_message: str, client=None) -> str:
    """Self-healing loop: Repairs SQL query using the exact SQLite/Postgres error message."""
    if not client:
        return previous_sql

    messages = [
        {"role": "system", "content": f"You are FinLens SQL Architect. Fix the SQL error.\n{DATABASE_SCHEMA_PROMPT}\nOutput ONLY the corrected SQL query without commentary."},
        {"role": "user", "content": f"The following SQL failed:\n{previous_sql}\n\nDatabase Error:\n{error_message}\n\nPlease generate a corrected, valid SQL query."},
    ]
    repaired = _call_groq(client, messages)
    return repaired or previous_sql


def agent_judge_query(prompt: str, candidate_sql: str, dry_run_result: Dict[str, Any], client=None) -> Dict[str, Any]:
    """
    Agent 2: LLM-as-a-Judge.
    Evaluates semantic correctness, query cost risk, and assigns a confidence score.
    """
    sample_preview = dry_run_result.get("sample_rows", [])[:3]
    exec_time = dry_run_result.get("execution_time_ms", 0)
    cost_risk = dry_run_result.get("cost_risk", "LOW")
    row_count = dry_run_result.get("row_count", 0)

    if client:
        judge_prompt = f"""You are the FinLens Senior Analytics Judge.
Evaluate this natural language question and the candidate SQL dry-run result.

User Question: "{prompt}"
Candidate SQL: "{candidate_sql}"

Shadow Sandbox Dry-Run Telemetry:
- Execution Time: {exec_time} ms
- Row Count: {row_count}
- Columns: {dry_run_result.get('columns')}
- Sample Rows: {json.dumps(sample_preview, default=str)}
- Error: {dry_run_result.get('error')}

Evaluate:
1. Does the query answer the user's specific financial question?
2. Is the query safe and bounded (not causing runaway load)?
3. What is the most intuitive chart representation? (choose one: 'bar', 'pie', 'line', or 'table')

Respond ONLY in valid JSON matching this exact structure:
{{
  "verdict": "APPROVED" or "REQUIRES_HUMAN_APPROVAL",
  "confidence_score": 0-100,
  "cost_risk": "LOW" or "MEDIUM" or "HIGH",
  "explanation": "Brief one sentence executive explanation of the findings.",
  "recommended_chart": "bar" or "pie" or "line" or "table",
  "x_axis": "column_name_for_x_axis_or_null",
  "y_axis": "column_name_for_y_axis_or_null"
}}
"""
        messages = [
            {"role": "system", "content": "You are a strict data safety and query audit system. Respond only in raw JSON."},
            {"role": "user", "content": judge_prompt},
        ]
        raw_res = _call_groq(client, messages)
        if raw_res:
            try:
                # Strip markdown json blocks if present
                clean_json = re.sub(r"```(?:json)?", "", raw_res).replace("```", "").strip()
                parsed = json.loads(clean_json)
                return parsed
            except Exception as e:
                print(f"[JUDGE] JSON parse fallback: {e}")

    # Heuristic Fallback Judge
    has_aggregates = any(w in candidate_sql.upper() for w in ("SUM", "COUNT", "AVG", "GROUP BY"))
    rec_chart = "bar" if has_aggregates else "table"
    
    # Check column names
    cols = dry_run_result.get("columns", [])
    x_col = cols[0] if len(cols) > 0 else None
    y_col = cols[1] if len(cols) > 1 else None

    return {
        "verdict": "APPROVED" if cost_risk == "LOW" else "REQUIRES_HUMAN_APPROVAL",
        "confidence_score": 94 if dry_run_result.get("success") else 40,
        "cost_risk": cost_risk,
        "explanation": f"Computed analytics query returning {row_count} data records.",
        "recommended_chart": rec_chart,
        "x_axis": x_col,
        "y_axis": y_col,
    }


def execute_finlens_pipeline(prompt: str, active_user_id: Optional[int] = None, force_execute: bool = False) -> Dict[str, Any]:
    """
    Full FinLens Analytical Pipeline:
    1. Agent 1 Generates SQL
    2. SQLGlot AST validation & sanitization
    3. Shadow Sandbox dry-run
    4. Self-healing loop if errors occur
    5. Agent 2 LLM-as-a-Judge evaluation
    6. Production live DB execution (if approved or forced)
    """
    client = _get_groq_client()
    
    # Ensure shadow sandbox is seeded
    if not shadow_sandbox.is_seeded:
        shadow_sandbox.seed_from_live_db()

    # Step 1: Agent 1 generates candidate SQL
    candidate_sql = agent_generate_sql(prompt, client=client, active_user_id=active_user_id)

    # Step 2 & 3: SQLGlot AST Guard + Shadow Sandbox with Self-Healing Loop
    max_retries = 2
    sanitized_sql = candidate_sql
    dry_run_res = None
    ast_info = None

    for attempt in range(max_retries + 1):
        try:
            ast_info = validate_and_sanitize_sql(candidate_sql, dialect="sqlite")
            sanitized_sql = ast_info["sanitized_sql"]
            dry_run_res = shadow_sandbox.dry_run(sanitized_sql)

            if dry_run_res["success"]:
                # Success in sandbox!
                break
            else:
                # Execution error in sandbox -> self-heal
                if attempt < max_retries and client:
                    candidate_sql = agent_repair_sql(sanitized_sql, dry_run_res["error"], client=client)
                else:
                    break
        except SQLSecurityError as sec_err:
            return {
                "success": False,
                "error": str(sec_err),
                "sql": candidate_sql,
                "stage": "AST_GUARD_REJECTION",
            }

    if not dry_run_res or not dry_run_res["success"]:
        return {
            "success": False,
            "error": dry_run_res.get("error") if dry_run_res else "Sandbox verification failed.",
            "sql": sanitized_sql,
            "stage": "SANDBOX_VERIFICATION_FAILED",
        }

    # Step 4: Agent 2 LLM-as-a-Judge Evaluation
    judge_evaluation = agent_judge_query(prompt, sanitized_sql, dry_run_res, client=client)

    requires_human_approval = (
        judge_evaluation.get("verdict") == "REQUIRES_HUMAN_APPROVAL" or
        judge_evaluation.get("cost_risk") == "HIGH" or
        judge_evaluation.get("confidence_score", 100) < 70
    )

    # If human approval is required and user hasn't explicitly confirmed:
    if requires_human_approval and not force_execute:
        return {
            "success": True,
            "status": "AWAITING_HUMAN_APPROVAL",
            "prompt": prompt,
            "sql": sanitized_sql,
            "judge": judge_evaluation,
            "sandbox_telemetry": {
                "execution_time_ms": dry_run_res["execution_time_ms"],
                "sample_preview": dry_run_res["sample_rows"],
                "row_count": dry_run_res["row_count"],
                "columns": dry_run_res["columns"],
            },
            "data": dry_run_res["sample_rows"],
            "columns": dry_run_res["columns"],
        }

    # Step 5: Execute safely on Live Production Database
    live_start = time.perf_counter()
    try:
        with db.engine.connect() as connection:
            result = connection.execute(text(sanitized_sql))
            rows = result.mappings().all()
            live_elapsed_ms = round((time.perf_counter() - live_start) * 1000, 2)
            
            data_list = [dict(r) for r in rows]
            columns = list(data_list[0].keys()) if data_list else dry_run_res.get("columns", [])

            return {
                "success": True,
                "status": "EXECUTED",
                "prompt": prompt,
                "sql": sanitized_sql,
                "judge": judge_evaluation,
                "data": data_list,
                "columns": columns,
                "live_telemetry": {
                    "live_execution_time_ms": live_elapsed_ms,
                    "row_count": len(data_list),
                    "sandbox_time_ms": dry_run_res["execution_time_ms"],
                },
            }
    except Exception as live_err:
        return {
            "success": False,
            "status": "LIVE_EXECUTION_ERROR",
            "error": str(live_err),
            "sql": sanitized_sql,
        }
