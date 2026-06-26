from __future__ import annotations

from functools import lru_cache
from typing import Iterator

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlmodel import Session, SQLModel, create_engine


class Settings(BaseSettings):
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 720
    
    # FIX VERCEL: Dikosongkan agar sistem wajib membaca string asli dari env Vercel / file .env lokal
    database_url: str = ""
    
    admin_user: str = "admin"
    admin_pass: str = "admin123"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# PostgreSQL mendukung operasi multi-threading secara native (tidak memerlukan check_same_thread)
connect_args = {}

# Inisialisasi engine database menggunakan PostgreSQL Supabase / Pooler URI
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def init_db() -> None:
    # FIX VERCEL: Menggunakan absolute import agar aman dari relative import error di runtime cloud
    from app import models  # noqa: F401

    # Membuat seluruh skema tabel langsung di kluster database Supabase
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session