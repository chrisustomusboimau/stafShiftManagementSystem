# Event Staff Tracker — Backend API (FastAPI + SQLModel + Supabase)

Dokumentasi ini berisi panduan instalasi, spesifikasi arsitektur endpoint, dan langkah penyebaran (*deployment*) untuk mesin utama (*backend*) aplikasi Event Staff Tracker. Proyek ini dibangun menggunakan FastAPI untuk performa asinkron berkecepatan tinggi, SQLModel (berbasis SQLAlchemy dan Pydantic) untuk pemetaan objek database, serta dirancang untuk berintegrasi langsung dengan PostgreSQL Supabase.

---

## Fitur Utama Sistem Backend

* **Arsitektur Asinkron dan Lifespan**: Mengelola inisialisasi koneksi database dan proses *seeding* otomatis tepat sebelum server siap menerima permintaan.
* **Autentikasi Hibrida Lintas Tabel**: Sistem login terpadu yang memvalidasi kredensial administrator (tabel `User`) dan staf operasional (tabel `Staff`) menggunakan enkripsi JWT (JSON Web Tokens) dan Bcrypt.
* **Kontrol Akses Berbasis Peran (RBAC)**: Pembatasan hak akses ketat di tingkat *middleware* di mana seluruh operasi mutasi data (POST, PUT, DELETE) mewajibkan hak akses tingkat `admin`.
* **Sistem Absensi Kontingensi**: Skema penugasan dinamis yang mendukung nilai `nullable` pada referensi lokasi untuk memfasilitasi status staf yang sedang mengambil cuti atau izin sakit (`is_leave`).

---

## Prasyarat dan Lingkungan Kerja

Aplikasi ini memerlukan Python versi 3.10 atau yang lebih tinggi serta akses ke instans database PostgreSQL (Supabase).

### Konfigurasi Variabel Lingkungan (.env)

Sebelum menginisialisasi server, salin berkas templat lingkungan dan lengkapi nilai variabel di dalamnya:

```bash
cp .env.example .env