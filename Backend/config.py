import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'smartledger-super-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-smartledger-secret-key')
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'database.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False