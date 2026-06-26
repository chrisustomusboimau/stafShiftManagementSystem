from __future__ import annotations

from functools import lru_cache
from typing import Iterator

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlmodel import Session, SQLModel, create_engine


class Settings(BaseSettings):
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 720
    
    # FIX UTAMA: Gunakan PostgreSQL Supabase sebagai default fallback (atau kosongkan agar wajib dari .env)
    database_url: str = "postgresql://postgres:password_kamu@db.xyz.supabase.co:5432/postgres"
    
    admin_user: str = "admin"
    admin_pass: str = "admin123"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# FIX UTAMA: Hapus 'check_same_thread' karena PostgreSQL mendukung multi-threading secara native
connect_args = {}

# Inisialisasi engine database menggunakan PostgreSQL Supabase
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def init_db() -> None:
    # Import models so SQLModel.metadata is populated.
    from . import models  # noqa: F401

    # Ini akan membuat semua tabel (User, Staff, Location, Assignment) langsung di database Supabase kamu
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session