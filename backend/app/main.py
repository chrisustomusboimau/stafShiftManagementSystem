from __future__ import annotations

import os
import sys
import logging

# =========================================================================
# KONFIGURASI LOGGING UNTUK MELACAK EROR DI VERCEL
# =========================================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================================================================
# FIX DEFINITIF STRUKTUR FOLDER MONOREPO VERCEL & SUBFOLDER ROUTERS
# Memaksa runtime serverless mengenali semua level direktori kerja
# =========================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))  # Menunjuk ke backend/app
backend_root = os.path.abspath(os.path.join(current_dir, ".."))  # Menunjuk ke backend
parent_root = os.path.abspath(os.path.join(backend_root, ".."))  # Menunjuk ke root terluar (place-shift)

# Memasukkan semua variasi ke sys.path menjamin 'from database import ...' di subfolder routers
# dan 'from app.database import ...' di main.py terurai dengan mulus di Vercel Lambda
for path in [current_dir, backend_root, parent_root]:
    if path not in sys.path:
        sys.path.insert(0, path)
# =========================================================================

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Impor modul utama menggunakan namespace yang telah dijamin oleh sys.path
from database import init_db, settings
from routers import assignments, auth, locations, staff
from seed import run_seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # =========================================================================
    # ERROR HANDLING LIFESPAN: Melacak crash saat startup database / seeding
    # =========================================================================
    try:
        logger.info("LOG-LIFESPAN: Memulai inisialisasi database (init_db)...")
        init_db()    
        logger.info("LOG-LIFESPAN: Inisialisasi database sukses!")
    except Exception as e:
        logger.error(f"LOG-LIFESPAN [FATAL ERROR] pada init_db(): {str(e)}", exc_info=True)
    
    try:
        logger.info("LOG-LIFESPAN: Memulai proses seeding admin (run_seed)...")
        run_seed()   
        logger.info("LOG-LIFESPAN: Seeding sukses atau dilewati!")
    except Exception as e:
        logger.error(f"LOG-LIFESPAN [FATAL ERROR] pada run_seed(): {str(e)}", exc_info=True)
    # =========================================================================
    yield


app = FastAPI(title="Event Staff Tracker", lifespan=lifespan)

# Pengaturan CORS Middleware untuk komunikasi aman dengan frontend React/Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        # Izinkan domain produksi Vercel-mu melakukan request API lintas asal
        "https://staf-shift-management-system-o93b.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router API Endpoints (Path aslinya tetap bersih: /auth/login, /staff, dll.)
app.include_router(auth.router)
app.include_router(staff.router)
app.include_router(locations.router)
app.include_router(assignments.router)


@app.get("/health")
def health():
    return {"status": "ok"}