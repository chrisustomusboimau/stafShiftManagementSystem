# Event Staff Tracker — Frontend (React + Vite + Tailwind CSS)

Dokumentasi ini berisi panduan instalasi, arsitektur direktori, dan langkah penyebaran (*deployment*) untuk antarmuka pengguna (*frontend*) aplikasi Event Staff Tracker. Aplikasi ini dibangun menggunakan React, Vite sebagai *bundler*, dan Tailwind CSS untuk pengelolaan komponen antarmuka yang responsif.

---

## Fitur Utama Sistem Antarmuka

* **Manajemen Matriks Jadwal**: Grid interaktif yang memetakan penugasan staf dalam interval waktu 30 menit secara real-time.
* **Dasbor Kontrol Administrasi**: Panel manajemen terpusat untuk memanipulasi data staf, lokasi ruangan, penugasan jadwal, serta status absensi harian.
* **Autentikasi Berbasis Peran (RBAC UI)**: Pembatasan hak akses elemen antarmuka yang membedakan visibilitas antara pengguna dengan peran `admin` dan `staff`.
* **Optimasi Performa**: Pemanfaatan fitur *Hot Module Replacement* (HMR) dari Vite untuk efisiensi proses pengembangan lokal.

---

## Prasyarat dan Lingkungan Kerja

Aplikasi ini mendukung pengelolaan paket melalui **Bun** (direkomendasikan sesuai dengan konfigurasi `bunfig.toml` proyek) atau **NPM** sebagai alternatif.

### Konfigurasi Variabel Lingkungan (.env)

Sebelum menjalankan aplikasi, Anda wajib mengonfigurasi URL *endpoint* backend. Buat file `.env` di dalam repositori `frontend/` dengan mengopi templat yang tersedia:

```bash
cp .env.example .env