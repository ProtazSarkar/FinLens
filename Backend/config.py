import os
from typing import ClassVar

from dotenv import load_dotenv

load_dotenv()


def _database_uri():
    uri = os.getenv("SQL_DATABASE_URI") or os.getenv("DATABASE_URL")
    if uri and uri.startswith("postgres://"):
        return uri.replace("postgres://", "postgresql://", 1)
    return uri


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "smartledger-super-secret-key")
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_ENGINE_OPTIONS: ClassVar[dict] = {
        "pool_recycle": 3600,
        "pool_pre_ping": True,
    }

    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith("mysql"):
        SQLALCHEMY_ENGINE_OPTIONS["connect_args"] = {
            "ssl": {
                "check_hostname": False,
                "ssl_mode": "REQUIRED",
            }
        }