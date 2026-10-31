# HUMAS & PUBDOK MANAGEMENT — UKM SENIOR PNUP
### Periode Kepengurusan 2026

Aplikasi sistem manajemen organisasi terpadu Divisi Hubungan Masyarakat (Humas) dan Publikasi & Dokumentasi (Pubdok) UKM SENIOR Politeknik Negeri Ujung Pandang (PNUP). Dibangun dengan arsitektur decoupled client-server, tema desain visual **Gold Elegant**, sistem Dual-Workspace, serta Role-Based Access Control (RBAC) tingkat lanjut.

---

## 1. Teknologi yang Digunakan

### Frontend:
- **Framework**: Next.js 14 (App Router)
- **Bahasa**: TypeScript, React 18
- **Styling**: Kustom CSS Tema *Gold Elegant* (Font: Plus Jakarta Sans)
- **Ikon**: Lucide React
- **Komponen**: Modal dialog, Toast pemberitahuan, Drawer responsif

### Backend:
- **Bahasa**: Go (Golang) v1.22+
- **Framework REST API**: Gin Web Framework
- **Autentikasi**: JSON Web Token (JWT) + bcrypt Password Hashing + HttpOnly Cookie
- **Audit Logging**: Automatic append-only activity logger middleware
- **Driver Database**: Modern pure Go SQLite driver (`modernc.org/sqlite`), PostgreSQL driver (`pgx/v5`), dan MySQL (`go-sql-driver/mysql`)

### Database:
- **Basis Data**: Relational SQL (SQLite out-of-the-box, PostgreSQL, atau MySQL)
- **Migrasi Schema**: 9 Tabel berelasi, UUID PK, Foreign Keys, Indeks, Timestamps, dan Periode 2026

---

## 2. Struktur Direktori Proyek

```
humdok-management/
├── backend/
│   ├── cmd/
│   │   ├── server/           # Entry point server Gin
│   │   └── seed/             # CLI runner seeder data
│   ├── internal/
│   │   ├── config/           # Konfigurasi environment & secret
│   │   ├── database/         # Koneksi DB, migration engine & seeder
│   │   ├── handlers/         # HTTP Controller Gin per modul
│   │   ├── middleware/       # JWT Auth, RBAC policy & Audit Logger
│   │   ├── models/           # Definisi entitas model & respons JSON
│   │   └── routes/           # Routing API & CORS
│   ├── migrations/           # File SQL DDL migrasi schema
│   ├── tests/                # Automated API & RBAC unit/integration tests
│   ├── Dockerfile
│   └── go.mod
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/  # Route grup layout dashboard
│   │   │   │   ├── dashboard/       # Dashboard metrik & grafik
│   │   │   │   ├── board-members/   # Modul data pengurus
│   │   │   │   ├── work-programs/   # Modul program kerja
│   │   │   │   ├── events/          # Modul kegiatan
│   │   │   │   ├── schedules/       # Kalender visual & checklist
│   │   │   │   ├── publications/    # Jadwal publikasi (Pubdok)
│   │   │   │   ├── documentations/  # Dokumentasi kegiatan (Pubdok)
│   │   │   │   ├── achievements/    # Database prestasi (Pubdok)
│   │   │   │   ├── users/           # Pengguna & hak akses (Admin)
│   │   │   │   └── activity-logs/   # Log aktivitas append-only
│   │   │   ├── login/        # Halaman masuk Gold Elegant
│   │   │   ├── globals.css   # Stylesheet tema Gold Elegant lengkap
│   │   │   └── layout.tsx    # Root layout & providers
│   │   ├── components/       # Komponen reusable (Sidebar, Topbar, Modal, dll)
│   │   ├── context/          # AuthContext & ToastContext
│   │   ├── services/         # API fetch client
│   │   └── types/            # Interface TypeScript
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── Makefile
├── start-backend.bat
├── start-frontend.bat
├── run-app.bat
└── README.md
```

---

## 3. Sistem Dual-Workspace & Hak Akses (RBAC)

Aplikasi memiliki sakelar divisi instan di topbar dengan aturan akses:

| Peran (Role) | Ruang Lingkup Workspace | Hak Akses Modul |
| :--- | :--- | :--- |
| **Super Admin** | Bebas beralih Humas & Pubdok | Akses penuh seluruh 10 modul termasuk manajemen akun pengguna |
| **Divisi Humas** | Terkunci di workspace Humas | Dashboard, Pengurus, Proker Humas, Kegiatan, Kalender, Log Aktivitas |
| **Divisi Pubdok** | Terkunci di workspace Pubdok | Dashboard, Proker Pubdok, Publikasi, Dokumentasi, Prestasi, Kalender, Log |

---

## 4. Akun Demo Pengembangan

| Role | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@humdok.local` | `admin123` | Akses seluruh fitur dan bebas pindah divisi |
| **Divisi Humas** | `div_humas@humdok.local` | `humas123` | Terkunci pada workspace Humas |
| **Divisi Pubdok** | `div_pubdok@humdok.local` | `pubdok123` | Terkunci pada workspace Pubdok |

---

## 5. Cara Menjalankan Aplikasi

### Opsi A: Menggunakan Script Cepat (Windows)
Cukup jalankan file batch:
```cmd
run-app.bat
```
Script ini akan langsung menyalakan Backend Go (`http://localhost:8080`) dan Frontend Next.js (`http://localhost:3000`).

---

### Opsi B: Menjalankan Secara Manual

#### 1. Menjalankan Backend (Go + Gin):
```bash
cd backend
# Database SQLite otomatis dibuat dan diseed saat server start
go run ./cmd/server
```
Server backend akan aktif di `http://localhost:8080`.

Jika ingin menjalankan seeder secara terpisah:
```bash
cd backend
go run ./cmd/seed
```

#### 2. Menjalankan Frontend (Next.js):
```bash
cd frontend
npm install
npm run dev
```
Buka browser pada: `http://localhost:3000`.

---

### Opsi C: Menggunakan Docker Compose (Multi-Container)
```bash
docker-compose up --build
```
Konfigurasi ini akan menyalakan PostgreSQL 16, backend Go, dan frontend Next.js secara otomatis.

---

## 6. Daftar Endpoint REST API (Go + Gin)

| Modul | Method | Endpoint | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | Publik |
| **Auth** | `GET` | `/api/v1/auth/me` | Authenticated |
| **Auth** | `POST` | `/api/v1/auth/logout` | Authenticated |
| **Dashboard** | `GET` | `/api/v1/dashboard` | Authenticated |
| **Pengurus** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/board-members` | Super Admin & Humas |
| **Program Kerja** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/work-programs` | Sesuai Divisi & Super Admin |
| **Kegiatan** | `GET` | `/api/v1/events` | Semua (Pubdok baca untuk dokumen) |
| **Kegiatan** | `POST`, `PUT`, `DELETE` | `/api/v1/events` | Super Admin & Humas |
| **Kalender** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/schedules` | Sesuai Divisi & Super Admin |
| **Kalender** | `PATCH` | `/api/v1/schedules/:id/toggle` | Centang selesai langsung ke DB |
| **Publikasi** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/publications` | Khusus Pubdok & Super Admin |
| **Dokumentasi** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/documentations` | Khusus Pubdok & Super Admin |
| **Prestasi** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/achievements` | Khusus Pubdok & Super Admin |
| **Pengguna** | `GET`, `POST`, `PUT`, `DELETE` | `/api/v1/users` | Khusus Super Admin |
| **Log Aktivitas** | `GET` | `/api/v1/activity-logs` | Read-only semua peran |

---

## 7. Pengujian Otomatis (Testing)

Jalankan test suite backend untuk memvalidasi autentikasi JWT, kalkulasi statistik dashboard, RBAC, dan integritas relasi:
```bash
cd backend
go test -v ./tests
```
Hasil pengujian mencakup:
- `TestDashboardStats`: Memvalidasi kalkulasi dinamis (7 proker, rata-rata Humas 55%, Pubdok 45%, 16 kegiatan, 63% selesai).
- `TestRBACEnforcement`: Memvalidasi proteksi endpoint lintas peran.
- `TestEventDocumentationRestrict`: Memvalidasi perlindungan penghapusan kegiatan yang masih memiliki arsip dokumentasi (`ON DELETE RESTRICT`).
- `TestBoardMembers55Dataset`: Memvalidasi kelengkapan 55 data pengurus resmi Periode 2026 (9 Staf Ahli, 17 Pengurus Harian, 29 Anggota Pengurus Harian) dan fungsionalitas filtering.

---

## 8. Verifikasi Kriteria Selesai (Acceptance Criteria)

- [x] Frontend Next.js TypeScript (App Router) terkompilasi dan berjalan normal.
- [x] Backend Go Gin REST API terkompilasi dan berjalan normal.
- [x] Sembilan tabel relasional SQL dibuat melalui migrasi otomatis.
- [x] Seluruh data seeder kepengurusan 2026 terisi lengkap dan bersifat idempoten.
- [x] Login 3 peran (Super Admin, Divisi Humas, Divisi Pubdok) berhasil.
- [x] Pembatasan hak akses (RBAC) ditegakkan di middleware backend dan navigasi frontend.
- [x] Sakelar Dual-Workspace (Humas & Pubdok) berfungsi instan di topbar.
- [x] Dashboard menampilkan data hasil agregasi database secara dinamis.
- [x] Seluruh operasi CRUD pada 9 modul berfungsi penuh dengan dialog konfirmasi hapus.
- [x] Relasi foreign key kegiatan dan dokumentasi aktif (`ON DELETE RESTRICT`).
- [x] Kalender kegiatan bulanan dan toggle checklist tersinkronisasi langsung ke database.
- [x] Log aktivitas tercatat otomatis secara append-only.
- [x] Pencarian kata kunci, filter, sorting kolom whitelist, dan paginasi berfungsi.
- [x] Desain CSS Gold Elegant dan font Plus Jakarta Sans diterapkan secara presisi.
- [x] Tampilan responsif untuk desktop, tablet, dan drawer mobile.
- [x] Dokumentasi lengkap dan batch runner tersedia.
