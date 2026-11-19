import re
import sqlglot
from sqlglot import exp

ALLOWED_TABLES = {
    "user_basic_details",
    "transaction_logs",
    "transaction_classifications",
}

FORBIDDEN_EXPRESSIONS = (
    exp.Insert,
    exp.Update,
    exp.Delete,
    exp.Drop,
    exp.Alter,
    exp.Command,
    exp.Create,
    exp.Pragma,
)

FORBIDDEN_COLUMNS = {
    "password_hash",
}


class SQLSecurityError(Exception):
    """Raised when generated SQL violates read-only or schema safety policies."""
    pass


def clean_sql_input(raw_sql: str) -> str:
    """Strips markdown code blocks, comments, and trailing punctuation."""
    if not raw_sql:
        return ""
    # Remove markdown code block fences if present
    cleaned = re.sub(r"```(?:sql)?", "", raw_sql, flags=re.IGNORECASE)
    cleaned = cleaned.replace("```", "").strip()
    # Strip any trailing semicolons
    cleaned = re.sub(r";+\s*$", "", cleaned).strip()
    return cleaned


def validate_and_sanitize_sql(sql_query: str, dialect: str = "sqlite", default_limit: int = 100) -> dict:
    """
    Validates AST with sqlglot, enforces strict read-only execution, checks table whitelist,
    masks sensitive columns, detects cartesian product risks, and auto-injects LIMIT clauses.
    Returns:
        dict: {
            "sanitized_sql": str,
            "cost_warning": str or None,
            "tables_used": list,
            "has_limit": bool
        }
    """
    cleaned = clean_sql_input(sql_query)
    if not cleaned:
        raise SQLSecurityError("Empty SQL query received.")

    try:
        expression = sqlglot.parse_one(cleaned, read="postgres" if "postgres" in dialect else "sqlite")
    except Exception as e:
        # Fallback parse with default
        try:
            expression = sqlglot.parse_one(cleaned)
        except Exception as parse_err:
            raise SQLSecurityError(f"SQL Syntax Error: Unable to parse query AST ({parse_err})")

    # 1. Enforce SELECT only at root
    if not isinstance(expression, exp.Select):
        raise SQLSecurityError(
            f"Security Violation: Only SELECT read-only queries are permitted. Found: {expression.__class__.__name__}"
        )

    # 2. Check all AST sub-nodes for any mutating commands
    for node in expression.find_all(exp.Expression):
        if isinstance(node, FORBIDDEN_EXPRESSIONS):
            raise SQLSecurityError(
                f"Security Violation: Query contains prohibited operation '{node.__class__.__name__}'."
            )

    # 3. Whitelist tables
    tables_found = set()
    for table in expression.find_all(exp.Table):
        tname = table.name.lower()
        if tname not in ALLOWED_TABLES:
            raise SQLSecurityError(
                f"Security Violation: Access denied to table '{tname}'. Allowed tables: {', '.join(sorted(ALLOWED_TABLES))}"
            )
        tables_found.add(tname)

    # 4. Strip / Mask sensitive columns (e.g. password_hash)
    for col in expression.find_all(exp.Column):
        if col.name.lower() in FORBIDDEN_COLUMNS:
            raise SQLSecurityError(
                f"Security Violation: Access denied to protected security column '{col.name}'."
            )

    # 5. Cost & Cartesian Product Warning
    cost_warning = None
    from_clause = expression.args.get("from")
    joins = expression.args.get("joins") or []
    
    # Check for unbounded cartesian joins (CROSS JOIN or multiple tables in FROM without joins)
    if from_clause and len(from_clause.expressions) > 1 and not joins:
        cost_warning = "Potential Cartesian product detected: Multiple tables in FROM clause without explicit JOIN."

    for join in joins:
        if join.kind == "CROSS":
            cost_warning = "High-Cost Warning: CROSS JOIN detected which may produce exponential row evaluation."

    # 6. Auto-inject LIMIT if missing
    has_limit = expression.args.get("limit") is not None
    is_pure_aggregate = False
    
    # Check if all select targets are aggregate functions (COUNT, SUM, AVG, MIN, MAX)
    selects = expression.expressions
    if selects and all(isinstance(s, (exp.Count, exp.Sum, exp.Avg, exp.Min, exp.Max)) or 
                      isinstance(getattr(s, "this", None), (exp.Count, exp.Sum, exp.Avg, exp.Min, exp.Max))
                      for s in selects):
        is_pure_aggregate = True

    if not has_limit and not is_pure_aggregate:
        expression = expression.limit(default_limit)
        has_limit = True

    # 7. Generate dialect-specific clean SQL
    sanitized_sql = expression.sql(dialect=dialect)

    return {
        "sanitized_sql": sanitized_sql,
        "cost_warning": cost_warning,
        "tables_used": sorted(list(tables_found)),
        "has_limit": has_limit,
    }
