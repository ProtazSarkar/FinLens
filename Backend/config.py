import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "smartledger-super-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "SQL_DATABASE_URI"
    )
    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {
            "ssl": {
                "check_hostname": False,
                "ssl_mode": "REQUIRED"
            }
        },
        "pool_recycle": 3600,
        "pool_pre_ping": True
    }