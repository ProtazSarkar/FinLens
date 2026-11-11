import os
from typing import ClassVar
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
SQLITE_PATH = os.path.join(BASE_DIR, "smartledger.db")
SQLITE_URI = f"sqlite:///{SQLITE_PATH}"


def _determine_database_uri():
    if os.getenv("USE_SQLITE", "").lower() in ("true", "1", "yes"):
        return SQLITE_URI

    uri = os.getenv("SQL_DATABASE_URI") or os.getenv("DATABASE_URL")
    if not uri:
        return SQLITE_URI

    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://", 1)

    # For remote databases, perform a fast connectivity probe so backend never crashes on startup
    if uri.startswith("mysql") or uri.startswith("postgresql"):
        try:
            from sqlalchemy import create_engine
            connect_args = {"connect_timeout": 2} if uri.startswith("mysql") else {}
            probe_engine = create_engine(uri, connect_args=connect_args)
            with probe_engine.connect():
                pass
            print(f"[DATABASE] Connected to remote database.")
            return uri
        except Exception as e:
            print(f"[DATABASE] Remote connection probe failed ({e}). Falling back to local SQLite: {SQLITE_PATH}")
            return SQLITE_URI

    return uri


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "smartledger-super-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "smartledger-jwt-secret-key")
    SQLALCHEMY_DATABASE_URI = _determine_database_uri()
    SQLALCHEMY_ENGINE_OPTIONS: ClassVar[dict] = {
        "pool_recycle": 3600,
        "pool_pre_ping": True,
    }

    if SQLALCHEMY_DATABASE_URI.startswith("mysql"):
        SQLALCHEMY_ENGINE_OPTIONS["connect_args"] = {
            "connect_timeout": 3,
            "ssl": {
                "check_hostname": False,
                "ssl_mode": "REQUIRED",
            },
        }
    elif SQLALCHEMY_DATABASE_URI.startswith("sqlite"):
        SQLALCHEMY_ENGINE_OPTIONS = {}
