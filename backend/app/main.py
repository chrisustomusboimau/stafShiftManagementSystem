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


# =========================================================================
# FIX ROUTING PROXY VERCEL MENGGUNAKAN ROOT_PATH
# Deteksi secara otomatis apakah aplikasi berjalan di dalam serverless cloud Vercel
# =========================================================================
is_vercel = os.environ.get("VERCEL") == "1"

app = FastAPI(
    title="Event Staff Tracker", 
    lifespan=lifespan,
    # Jika di Vercel, strip /_/backend dari incoming request secara native di balik layar
    root_path="/_/backend" if is_vercel else ""
)
# =========================================================================

# Pengaturan CORS Middleware untuk komunikasi aman dengan frontend React/Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://staf-shift-management-system-o93b.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrasi Router API Endpoints (Rute internal Anda tetap bersih dan natural)
app.include_router(auth.router)
app.include_router(staff.router)
app.include_router(locations.router)
app.include_router(assignments.router)


@app.get("/health")
def health():
    return {"status": "ok"}