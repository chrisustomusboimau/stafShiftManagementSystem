from __future__ import annotations

import os
from functools import lru_cache
from typing import Iterator

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlmodel import Session, SQLModel, create_engine


class Settings(BaseSettings):
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 720
    
    # Menggunakan None agar Pydantic wajib mencari nilai dari Environment Variables Vercel
    database_url: str | None = None
    
    admin_user: str = "admin"
    admin_pass: str = "admin123"

    # case_sensitive=False memastikan variabel DATABASE_URL (kapital) di Vercel otomatis mengisi database_url
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# FIX AMAN VERCEL: Mengambil URL langsung dari os.environ sebagai fallback utama
db_url = settings.database_url or os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")

if not db_url:
    # Menggunakan sqlite memori sementara hanya agar fase inisialisasi awal tidak crash jika env belum terbaca
    db_url = "sqlite:///:memory:"

# Jika menggunakan database Supabase PostgreSQL, paksa perbaikan skema URI jika masih 'postgres://'
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
engine = create_engine(db_url, echo=False, connect_args=connect_args)


def init_db() -> None:
    # Menyesuaikan kembali ke absolute import yang selaras dengan trik sys.path kita sebelumnya
    from app import models  # noqa: F401

    # Membuat seluruh skema tabel langsung di kluster database Supabase
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session