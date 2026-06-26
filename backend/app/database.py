from __future__ import annotations

import os
import sys
import logging
from functools import lru_cache
from typing import Iterator

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlmodel import Session, SQLModel, create_engine

# Konfigurasi logging agar tercatat jelas di dashboard Vercel
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 720
    database_url: str | None = None
    admin_user: str = "admin"
    admin_pass: str = "admin123"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)


@lru_cache
def get_settings() -> Settings:
    return Settings()


# =========================================================================
# ERROR HANDLING: INISIALISASI DATABASE ENGINE
# =========================================================================
try:
    settings = get_settings()
    db_url = settings.database_url or os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    
    logger.info(f"LOG-DATABASE: Memeriksa ketersediaan string koneksi... {'DITEMUKAN' if db_url else 'KOSONG/NONE'}")

    if not db_url:
        logger.warning("LOG-DATABASE: DATABASE_URL tidak ditemukan di env. Menggunakan fallback sqlite memori.")
        db_url = "sqlite:///:memory:"

    if db_url.startswith("postgres://"):
        logger.info("LOG-DATABASE: Mengubah skema postgres:// menjadi postgresql:// untuk kompatibilitas SQLAlchemy.")
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    connect_args = {}
    # Jika terhubung ke Supabase/Cloud, pastikan SSL aktif dan cegah argumen SQLite bocor
    if "sqlite" not in db_url:
        connect_args = {"sslmode": "require"}
    else:
        connect_args = {"check_same_thread": False}

    logger.info(f"LOG-DATABASE: Mencoba membuat engine untuk dialek: {db_url.split('://')[0]}")
    engine = create_engine(db_url, echo=False, connect_args=connect_args)

except Exception as e:
    logger.error(f"LOG-DATABASE [FATAL ERROR] Gagal menginisialisasi create_engine: {str(e)}", exc_info=True)
    # Terapkan emergency fallback agar aplikasi tidak crash total saat booting awal imports
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
# =========================================================================


def init_db() -> None:
    try:
        # FIX VERCEL: Baris "from app import models" dihapus dari sini karena model 
        # sudah otomatis dimuat saat router di-import di berkas main.py untuk mencegah
        # InvalidRequestError: Table 'user' is already defined.
        
        logger.info("LOG-DATABASE: Menjalankan SQLModel.metadata.create_all...")
        SQLModel.metadata.create_all(engine)
        logger.info("LOG-DATABASE: Pembuatan skema tabel sukses/dilewati karena struktur sudah siap!")
    except Exception as e:
        # Gunakan log warning/error tanpa re-raise keras agar kegagalan pengecekan skema
        # di lingkungan serverless tidak memotong paksa siklus pemetaan rute API (Cegah Eror 404/500)
        logger.warning(f"LOG-DATABASE [MIGRATION NOTICE]: metadata.create_all skipped/handled: {str(e)}")


def get_session() -> Iterator[Session]:
    try:
        with Session(engine) as session:
            yield session
    except Exception as e:
        logger.error(f"LOG-DATABASE [ERROR] Gagal membuka/menutup Session: {str(e)}", exc_info=True)
        raise e