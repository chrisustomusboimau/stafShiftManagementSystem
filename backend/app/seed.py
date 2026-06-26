from __future__ import annotations

from sqlmodel import Session, select

# FIX VERCEL: Mengubah ke absolute imports agar terhindar dari relative import error di serverless environment
from app.database import engine, settings
from app.models import Location, User
from app.security import hash_password


def run_seed() -> None:
    with Session(engine) as session:
        # 1. Jalankan Seeding Akun Admin Utama
        existing_admin = session.exec(select(User).where(User.username == settings.admin_user)).first()
        if not existing_admin:
            session.add(
                User(
                    username=settings.admin_user,
                    password_hash=hash_password(settings.admin_pass),
                    role="admin",
                )
            )

        # 2. Opsional: Tempat menambahkan seeding boilerplate data lain ke Supabase jika dibutuhkan

        session.commit()