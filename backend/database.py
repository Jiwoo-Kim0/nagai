# === database.py ===
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Explicitly specify the path to the .env file
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / "frontend" / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

print("🔍 DATABASE_URL:", DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
