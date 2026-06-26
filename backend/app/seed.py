from __future__ import annotations

from sqlmodel import Session, select

from .database import engine, settings
from .models import Location, User
from .security import hash_password


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


        session.commit()