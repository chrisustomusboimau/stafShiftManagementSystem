from __future__ import annotations

import logging
from sqlmodel import Session, select

# FIX VERCEL: Mengubah ke absolute imports agar terhindar dari relative import error di serverless environment
from database import engine, settings
from models import Location, User
from security import hash_password

# Konfigurasi logging agar tercatat jelas di dashboard Vercel
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_seed() -> None:
    logger.info("LOG-SEED: Memulai proses seeding data awal...")
    
    try:
        with Session(engine) as session:
            # 1. Jalankan Seeding Akun Admin Utama
            logger.info(f"LOG-SEED: Memeriksa apakah user admin '{settings.admin_user}' sudah terdaftar...")
            existing_admin = session.exec(select(User).where(User.username == settings.admin_user)).first()
            
            if not existing_admin:
                logger.info(f"LOG-SEED: User admin tidak ditemukan. Membuat akun admin baru default...")
                
                # Pengamanan tambahan: pastikan password seed tidak kosong
                if not settings.admin_pass:
                    logger.warning("LOG-SEED [WARNING]: password admin kosong di konfigurasi settings!")
                
                admin_user_obj = User(
                    username=settings.admin_user,
                    password_hash=hash_password(settings.admin_pass),
                    role="admin",
                )
                
                session.add(admin_user_obj)
                logger.info("LOG-SEED: Objek admin berhasil ditambahkan ke unit of work session.")
            else:
                logger.info(f"LOG-SEED: User admin '{settings.admin_user}' sudah ada. Proses pembuatan dilewati.")

            # 2. Opsional: Tempat menambahkan seeding boilerplate data lain ke Supabase jika dibutuhkan

            logger.info("LOG-SEED: Melakukan commit transaksi ke database...")
            session.commit()
            logger.info("LOG-SEED: Proses seeding selesai dan berhasil disimpan!")

    except Exception as e:
        logger.error(f"LOG-SEED [FATAL ERROR] Terjadi kegagalan saat menjalankan run_seed(): {str(e)}", exc_info=True)
        # Kita lemparkan kembali (raise) eror ini agar terbaca di tingkat lifespan main.py jika diperlukan,
        # namun karena di main.py sudah kita bungkus try-except, aplikasi tidak akan crash mati total.
        raise e