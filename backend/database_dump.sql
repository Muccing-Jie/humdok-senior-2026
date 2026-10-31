-- ========================================================================
-- HUMAS & PUBDOK MANAGEMENT — UKM SENIOR PNUP (Periode 2026)
-- Complete Database Dump & Seed SQL (Relational Schema & Authentic Dataset)
-- ========================================================================

-- ------------------------------------------------------------------------
-- 1. Table Definitions (DDL)
-- ------------------------------------------------------------------------
-- Schema Migration 001: Init Schema UKM SENIOR Humas & Pubdok Management (Periode 2026)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    module_access TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 2. Board Members Table (Pengurus)
CREATE TABLE IF NOT EXISTS board_members (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    snr VARCHAR(50) NOT NULL,
    position VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    division VARCHAR(50) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    period VARCHAR(20) NOT NULL DEFAULT '2026',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 3. Work Programs Table (Program Kerja)
CREATE TABLE IF NOT EXISTS work_programs (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    pic_id VARCHAR(36) NULL,
    pic_name VARCHAR(150) NOT NULL,
    target_text TEXT NOT NULL,
    progress_pct INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Belum Terlaksana',
    division VARCHAR(50) NOT NULL,
    period VARCHAR(20) NOT NULL DEFAULT '2026',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (pic_id) REFERENCES board_members(id) ON DELETE SET NULL
);

-- 4. Events Table (Kegiatan)
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    unit VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_date VARCHAR(50) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Belum Terlaksana',
    period VARCHAR(20) NOT NULL DEFAULT '2026',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 5. Schedules Table (Kalender / Agenda / Tugas)
CREATE TABLE IF NOT EXISTS schedules (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    pic_id VARCHAR(36) NULL,
    pic_name VARCHAR(150) NOT NULL,
    stage VARCHAR(100) NOT NULL,
    deadline_date VARCHAR(50) NOT NULL,
    is_done BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'Belum Dimulai',
    category VARCHAR(50) NOT NULL DEFAULT 'tugas',
    division VARCHAR(50) NOT NULL,
    period VARCHAR(20) NOT NULL DEFAULT '2026',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (pic_id) REFERENCES board_members(id) ON DELETE SET NULL
);

-- 6. Publications Table (Jadwal & Hasil Publikasi - Khusus Pubdok)
CREATE TABLE IF NOT EXISTS publications (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    publish_date VARCHAR(50) NOT NULL,
    post_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Ide Konten',
    views INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    period VARCHAR(20) NOT NULL DEFAULT '2026',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 7. Documentations Table (Dokumentasi - Khusus Pubdok, relasi ke Events)
CREATE TABLE IF NOT EXISTS documentations (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    event_id VARCHAR(36) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    doc_date VARCHAR(50) NOT NULL,
    drive_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Lengkap',
    period VARCHAR(20) NOT NULL DEFAULT '2026',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT
);

-- 8. Achievements Table (Database Prestasi - Khusus Pubdok)
CREATE TABLE IF NOT EXISTS achievements (
    id VARCHAR(36) PRIMARY KEY,
    unit VARCHAR(100) NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    rank_title VARCHAR(100) NOT NULL,
    event_date VARCHAR(50) NOT NULL,
    result_category VARCHAR(50) NOT NULL DEFAULT 'Partisipasi',
    period VARCHAR(20) NOT NULL DEFAULT '2026',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- 9. Activity Logs Table (Log Aktivitas)
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) PRIMARY KEY,
    actor_user_id VARCHAR(36) NULL,
    user_name VARCHAR(150) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    data_id VARCHAR(36) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    division VARCHAR(50) NOT NULL DEFAULT 'Global',
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_board_members_div ON board_members(division);
CREATE INDEX IF NOT EXISTS idx_work_programs_div ON work_programs(division);
CREATE INDEX IF NOT EXISTS idx_work_programs_period ON work_programs(period);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_period ON events(period);
CREATE INDEX IF NOT EXISTS idx_schedules_div ON schedules(division);
CREATE INDEX IF NOT EXISTS idx_schedules_period ON schedules(period);
CREATE INDEX IF NOT EXISTS idx_publications_period ON publications(period);
CREATE INDEX IF NOT EXISTS idx_documentations_event ON documentations(event_id);
CREATE INDEX IF NOT EXISTS idx_achievements_period ON achievements(period);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);


-- ------------------------------------------------------------------------
-- 2. Seed Data Records (DML)
-- ------------------------------------------------------------------------

-- Table: users
INSERT INTO users (id, name, email, password_hash, role, module_access, status, created_at, updated_at) VALUES ('c56a2610-9b8e-4706-b358-26b94aded795', 'Administrator SENIOR', 'admin@humdok.local', '$2a$10$.fTeW4yA0g5uH/WmwTwhJufOjb11RHEh30jxNp/ONfIsScvnVcAe2', 'Super Admin', 'all', 'active', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 12:12:16.5139088 +0000 UTC');
INSERT INTO users (id, name, email, password_hash, role, module_access, status, created_at, updated_at) VALUES ('a68aa514-04e3-480b-8747-741db2a491e9', 'Staff Divisi Humas', 'div_humas@humdok.local', '$2a$10$e57KyQURygeU8z0z5QoAEeSWGikByj5Vp2k1uXwr9BfM1rv4t4CGe', 'Divisi Humas', 'dashboard,board_members,work_programs,events,schedules,activity_logs', 'active', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 12:12:16.5139088 +0000 UTC');
INSERT INTO users (id, name, email, password_hash, role, module_access, status, created_at, updated_at) VALUES ('bfdd554b-34b1-46b0-b0a2-588fa971d2f8', 'Staff Divisi Publikasi & Dokumentasi', 'div_pubdok@humdok.local', '$2a$10$M.ULkC3.2Lo3kUoP4aUSUu3uRdsUltWTJE9mjJnVCfqG9OVNDT/GK', 'Divisi Pubdok', 'dashboard,work_programs,schedules,publications,documentations,achievements,activity_logs', 'active', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 12:12:16.5139088 +0000 UTC');
-- Total records in users: 3

-- Table: board_members
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-001', 'Ahsan', '—', 'Anggota Staf Ahli', 'Staf Ahli', 'Staf Ahli', '—', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-002', 'Andhika Aryaputra M', '—', 'Anggota Staf Ahli', 'Staf Ahli', 'Staf Ahli', '—', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-003', 'Asti Hafsari', '—', 'Anggota Staf Ahli', 'Staf Ahli', 'Staf Ahli', '—', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-004', 'Axel Febrian Palajukan', '—', 'Anggota Staf Ahli', 'Staf Ahli', 'Staf Ahli', '—', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-005', 'Ilham Yahya', '—', 'Anggota Staf Ahli', 'Staf Ahli', 'Staf Ahli', '—', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-006', 'Nur Amalia Ramadhani', '—', 'Anggota Staf Ahli', 'Staf Ahli', 'Staf Ahli', '—', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-007', 'Richard Abraham Lely', '—', 'Anggota Staf Ahli', 'Staf Ahli', 'Staf Ahli', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-008', 'Shintiya Rahma Pratiwi', '—', 'Anggota Staf Ahli', 'Staf Ahli', 'Staf Ahli', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-009', 'Dian Ainiyyah Yusuf', '—', 'KOORDINATOR STAF AHLI', 'Staf Ahli', 'Staf Ahli', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-010', 'Nur Fadilah', 'SNR.24.24.056', 'BENDAHARA UMUM', 'Pengurus Harian', 'Presidium', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-011', 'Andi Nurul Fasirah', 'SNR.24.24.071', 'KETUA BIDANG DIVISI', 'Pengurus Harian', 'Bidang Divisi', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-012', 'Muhammad Haidar Putra Subara', 'SNR.24.24.099', 'KETUA BIDANG OLAHRAGA', 'Pengurus Harian', 'Bidang Olahraga', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-013', 'Muh. Ramadhan Abhyantara Rusmin', 'SNR.24.24.108', 'KETUA BIDANG SENI', 'Pengurus Harian', 'Bidang Seni', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-014', 'Muhammad Khairan Muslim Pasarai', 'SNR.24.24.027', 'KETUA UMUM', 'Pengurus Harian', 'Presidium', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-015', 'Aulia Amelia Rahma', 'SNR.24.24.136', 'KOORDINATOR DIVISI DANUS', 'Pengurus Harian', 'Divisi Danus', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-016', 'Amanda Damayanti', 'SNR.24.24.121', 'KOORDINATOR DIVISI HUMAS', 'Pengurus Harian', 'Divisi Humas', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-017', 'Reiner Kaleb Hitijahubessy', 'SNR.24.24.020', 'KOORDINATOR DIVISI KESEKRETARIATAN', 'Pengurus Harian', 'Divisi Kesekretariatan', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-018', 'Reskiyah Auliah Putri Subair', 'SNR.24.24.048', 'KOORDINATOR DIVISI PUBDOK', 'Pengurus Harian', 'Divisi Pubdok', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-019', 'Nurul Rahma Maqfirah', 'SNR.24.24.014', 'KOORDINATOR DIVISI SDM', 'Pengurus Harian', 'Divisi SDM', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-020', 'Sissy Enesya Kalompo', 'SNR.24.25.027', 'KOORDINATOR UK BOLA BASKET', 'Pengurus Harian', 'UK Bola Basket', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-021', 'Muh. Afdal Tabrani', 'SNR.25.25.081', 'KOORDINATOR UK BOLA VOLI', 'Pengurus Harian', 'UK Bola Voli', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-022', 'Nurhikmah Khaerunnisa Ismail', 'SNR.24.24.069', 'KOORDINATOR UK BULUTANGKIS', 'Pengurus Harian', 'UK Bulutangkis', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-023', 'Muh. Arifin Ilham', 'SNR.24.25.030', 'KOORDINATOR UK MUSIK', 'Pengurus Harian', 'UK Musik', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-024', 'Zahra Mukhbita', 'SNR.24.24.131', 'KOORDINATOR UK TARI', 'Pengurus Harian', 'UK Tari', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-025', 'Adam Jamal', 'SNR.24.24.034', 'KOORDINATOR UK TENIS MEJA', 'Pengurus Harian', 'UK Tenis Meja', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-026', 'Rismayatullah', 'SNR.24.24.141', 'SEKRETARIS UMUM', 'Pengurus Harian', 'Presidium', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-027', 'Adelia Sulastia', 'SNR.25.25.150', 'Anggota Divisi Danus', 'Anggota Pengurus Harian', 'Divisi Danus', '082190857122', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-028', 'Dhita Amaliah', 'SNR.24.24.030', 'Anggota Divisi Danus', 'Anggota Pengurus Harian', 'Divisi Danus', '0895334389759', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-029', 'Nuriftah Khaerani', '—', 'Anggota Divisi Danus', 'Anggota Pengurus Harian', 'Divisi Danus', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-030', 'Azzahrah Amalia Said', 'SNR.25.25.104', 'Anggota Divisi Humas', 'Anggota Pengurus Harian', 'Divisi Humas', '087841592058', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-031', 'Eva Mesera', 'SNR.25.25.160', 'Anggota Divisi Humas', 'Anggota Pengurus Harian', 'Divisi Humas', '0887436863951', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-032', 'Nur Aliah', 'SNR.24.24.040', 'Anggota Divisi Humas', 'Anggota Pengurus Harian', 'Divisi Humas', '0895393754355', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-033', 'Nur Naila', 'SNR.25.25.143', 'Anggota Divisi Humas', 'Anggota Pengurus Harian', 'Divisi Humas', '085298508771', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-034', 'Dede Afdhal Hamlet', 'SNR.25.25.052', 'Anggota Divisi Kesekretariatan', 'Anggota Pengurus Harian', 'Divisi Kesekretariatan', '081257245471', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-035', 'Muhammad Irsan Setiawan', 'SNR.24.24.097', 'Anggota Divisi Kesekretariatan', 'Anggota Pengurus Harian', 'Divisi Kesekretariatan', '089694307890', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-036', 'Widya Anugrah', 'SNR.25.25.173', 'Anggota Divisi Kesekretariatan', 'Anggota Pengurus Harian', 'Divisi Kesekretariatan', '081522580661', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-037', 'Anisa Cahaya Langsa', 'SNR.25.25.157', 'Anggota Divisi Pubdok', 'Anggota Pengurus Harian', 'Divisi Pubdok', '082292828668', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-038', 'Asilah Nur Athiyah', '—', 'Anggota Divisi Pubdok', 'Anggota Pengurus Harian', 'Divisi Pubdok', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-039', 'Aulia Mutmainnah Akbar', 'SNR.25.25.135', 'Anggota Divisi Pubdok', 'Anggota Pengurus Harian', 'Divisi Pubdok', '085242660320', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-040', 'Muh. Althaf Andriansyah', 'SNR.25.25.116', 'Anggota Divisi Pubdok', 'Anggota Pengurus Harian', 'Divisi Pubdok', '081355442332', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-041', 'Afda Anugra', 'SNR.25.25.151', 'Anggota Divisi SDM', 'Anggota Pengurus Harian', 'Divisi SDM', '0882020739089', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-042', 'Jelsi Febriola', 'SNR.24.25.025', 'Anggota Divisi SDM', 'Anggota Pengurus Harian', 'Divisi SDM', '082193386064', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-043', 'Radisti Burirang', 'SNR.25.25.146', 'Anggota Divisi SDM', 'Anggota Pengurus Harian', 'Divisi SDM', '089603048239', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-044', 'Denaldi Rawan', 'SNR.24.25.029', 'Bidang Inventaris', 'Anggota Pengurus Harian', 'UK Musik', '082396050789', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-045', 'Muh. Anugrah', 'SNR.24.25.038', 'Bidang Inventaris', 'Anggota Pengurus Harian', 'UK Tari', '082195550014', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-046', 'Anniza Almira', '—', 'Bidang Keanggotaan', 'Anggota Pengurus Harian', 'UK Bola Voli', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-047', 'Atma Fira', 'SNR.25.25.095', 'Bidang Keanggotaan', 'Anggota Pengurus Harian', 'UK Tenis Meja', '082290634496', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-048', 'Nayla Nur Aqilah', 'SNR.25.25.122', 'Bidang Keanggotaan', 'Anggota Pengurus Harian', 'UK Bola Basket', '085141336779', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-049', 'Syihab Haq Saidiman', 'SNR.24.25.015', 'Bidang Keanggotaan', 'Anggota Pengurus Harian', 'UK Bulutangkis', '081341376395', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-050', 'Ahmad Hafiz Maulana', '—', 'Bidang Kepelatihan', 'Anggota Pengurus Harian', 'UK Bulutangkis', '—', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-051', 'Al Muqhira Syaebatul Hamdi', 'SNR.25.25.101', 'Bidang Kepelatihan', 'Anggota Pengurus Harian', 'UK Bola Basket', '089520675412', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-052', 'Andika', 'SNR.25.25.094', 'Bidang Kepelatihan', 'Anggota Pengurus Harian', 'UK Tenis Meja', '082227088061', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-053', 'Muh Dzaky', 'SNR.25.25.083', 'Bidang Kepelatihan', 'Anggota Pengurus Harian', 'UK Bola Voli', '083110001594', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-054', 'Ananda Lestari', 'SNR.25.25.154', 'Bidang Management Event', 'Anggota Pengurus Harian', 'UK Tari', '087846316851', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at) VALUES ('mem-055', 'Nahlah Nurfadilah', 'SNR.24.25.034', 'Bidang Management Event', 'Anggota Pengurus Harian', 'UK Musik', '087740059687', '2026', '2026-10-31 12:48:50.9205141 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
-- Total records in board_members: 55

-- Table: work_programs
INSERT INTO work_programs (id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at) VALUES ('proker-h01', 'Pendataan Event/Lomba Unit Kegiatan', 'mem-016', 'Amanda Damayanti', 'Mendata seluruh event/lomba internal dan eksternal kampus se-Sulsel', 70, 'Berjalan', 'Humas', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO work_programs (id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at) VALUES ('proker-h02', 'Kerja Sama & Undangan Eksternal', 'mem-030', 'Azzahrah Amalia Said', 'Membangun kemitraan strategis dan merespons undangan ormawa kampus', 40, 'Berjalan', 'Humas', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO work_programs (id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at) VALUES ('proker-p01', 'Mengelola media sosial UKM SENIOR PNUP secara berkala', 'mem-018', 'Reskiyah Auliah Putri Subair', '98% kegiatan Terdokumentasi di Sosial Media', 27, 'Berjalan', 'Pubdok', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO work_programs (id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at) VALUES ('proker-p02', 'Workshop (Pelatihan Media/Publikasi)', 'mem-018', 'Reskiyah Auliah Putri Subair', 'minimal 2 kali dalam kepengurusan', 0, 'Belum', 'Pubdok', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO work_programs (id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at) VALUES ('proker-p03', 'Pengadaan Tripod', 'mem-040', 'Muh. Althaf Andriansyah', '1 unit', 100, 'Terlaksana', 'Pubdok', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO work_programs (id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at) VALUES ('proker-p04', 'Membuat Konten Perunit Kegiatan dan Pengurus Harian', 'mem-037', 'Anisa Cahaya Langsa', '8 Konten selama periode ke pengurusan', 0, 'Berjalan', 'Pubdok', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO work_programs (id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at) VALUES ('proker-p05', 'Data Base Prestasi per unit kegiatan', 'mem-039', 'Aulia Mutmainnah Akbar', '1 dokumen database utama (diperbarui berkala).', 100, 'Terlaksana', 'Pubdok', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
-- Total records in work_programs: 7

-- Table: events
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-001', '[Contoh] Undangan Bazar Kampus', '—', 'Bazar', '20 Nov 2026', '—', 'Belum Terlaksana / Belum Dihadiri', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-002', 'Festival Basket Karebosi 2025', 'MUSIK', 'Lomba / Event', '4 Okt 2026', '0877-8255-8682', 'Terlaksana', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-003', 'Unhas Cup 2026', 'VOLI', 'Lomba / Event', '28 Sep 2026', '0882-0226-93656', 'Terlaksana', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-004', 'Phinisi Basketball Competition 2026', 'BASKET', 'Lomba / Event', '22 Agu 2026', '0852-4012-0284', 'Terlaksana', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-005', 'FSWL XIV 2026', 'VOLI', 'Lomba / Event', '22 Jun 2026', '0856-9673-6219', 'Terlaksana', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-006', 'Band Competition Entrance 4.0 UC 2025', 'MUSIK', 'Lomba / Event', '1 Mei 2026', '0858-2332-3374', 'Terlaksana', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-007', '[Contoh] Pelantikan Pengurus 2026', '—', 'Pelantikan', '14 Feb 2026', '—', 'Terlaksana', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-008', 'UKMB UMI CUP 2025', 'BULUTANGKIS', 'Lomba / Event', '28 Nov 2025', '—', 'Terlaksana', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-009', 'Tournament Tenis Meja 2025', 'TENIS MEJA', 'Lomba / Event', '5 Nov 2025', '0811-4443-877', 'Terlaksana', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-010', 'UIN Cup 2025', 'VOLI', 'Lomba / Event', '13 Okt 2025', '0823-4981-8466', 'Terlaksana', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-011', 'Lomba Indonesia Menari (Trans Studio Makassar) 2025', 'TARI', 'Lomba / Event', '12 Okt 2025', '—', 'Terlaksana', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-012', 'Unimerz Cup 2025', 'TENIS MEJA', 'Lomba / Event', '—', '0823-4584-0505', 'Belum Terlaksana / Belum Dihadiri', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-013', 'Unimerz 2025', 'VOLI', 'Lomba / Event', '—', '0823-4584-0505', 'Belum Terlaksana / Belum Dihadiri', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-014', 'Rector Unhas Cup 2025', 'BASKET', 'Lomba / Event', '—', '0882-4530-6918', 'Belum Terlaksana / Belum Dihadiri', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-015', '3X3 PARAGA 2025', 'BASKET', 'Lomba / Event', '—', '0822-6646-0994', 'Belum Terlaksana / Belum Dihadiri', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at) VALUES ('ev-016', 'UBC (Unhas Badminton Cup) 2026', 'BULUTANGKIS', 'Lomba / Event', '—', '0822-1720-9400', 'Belum Terlaksana / Belum Dihadiri', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
-- Total records in events: 16

-- Table: schedules
INSERT INTO schedules (id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at) VALUES ('sch-p01', 'FEED Pelantikan & Raker', 'mem-018', 'Reskiyah Auliah Putri Subair', 'Publikasi Konten', '2026-01-04', 1, 'Selesai', 'publikasi', 'Pubdok', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO schedules (id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at) VALUES ('sch-p02', 'DESAIN Ganstik', 'mem-037', 'Anisa Cahaya Langsa', 'Desain Visual', '2026-01-14', 1, 'Selesai', 'tugas', 'Pubdok', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO schedules (id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at) VALUES ('sch-p03', 'PAMFLET PDL', 'mem-040', 'Muh. Althaf Andriansyah', 'Finalisasi Cetak', '2026-01-22', 1, 'Selesai', 'tugas', 'Pubdok', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO schedules (id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at) VALUES ('sch-p04', 'PAMFLET Selamat Bertanding', 'mem-039', 'Aulia Mutmainnah Akbar', 'Rilis Media Sosial', '2026-01-27', 1, 'Selesai', 'publikasi', 'Pubdok', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO schedules (id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at) VALUES ('sch-p05', 'Feed Teaser Bazar Kampus', 'mem-018', 'Reskiyah Auliah Putri Subair', 'Editing Video', '2026-11-10', 0, 'Dalam Proses', 'publikasi', 'Pubdok', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO schedules (id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at) VALUES ('sch-h01', 'Rapat Evaluasi Bulanan', 'mem-016', 'Amanda Damayanti', 'Koordinasi BPH', '2026-02-01', 1, 'Selesai', 'rapat', 'Humas', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO schedules (id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at) VALUES ('sch-h02', 'Koordinasi Festival Basket', 'mem-030', 'Azzahrah Amalia Said', 'Audiensi Panitia', '2026-01-12', 1, 'Selesai', 'kegiatan', 'Humas', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO schedules (id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at) VALUES ('sch-h03', 'Rapat Persiapan Bazar Kampus', 'mem-032', 'Nur Aliah', 'Rapat Panitia', '2026-11-08', 0, 'Belum Dimulai', 'rapat', 'Humas', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
-- Total records in schedules: 8

-- Table: publications
INSERT INTO publications (id, title, platform, publish_date, post_url, status, views, likes, period, created_at, updated_at) VALUES ('pub-001', '[Contoh] Teaser Bazar Kampus', 'TikTok', '18 Nov 2026', '—', 'Ide Konten', 0, 0, '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO publications (id, title, platform, publish_date, post_url, status, views, likes, period, created_at, updated_at) VALUES ('pub-002', '[Contoh] Rekap Prestasi UKM 2026', 'Instagram', '15 Nov 2026', '—', 'Produksi', 0, 0, '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO publications (id, title, platform, publish_date, post_url, status, views, likes, period, created_at, updated_at) VALUES ('pub-003', '[Contoh] Highlight Unhas Cup 2026', 'TikTok', '1 Okt 2026', '—', 'Terbit', 5200, 610, '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO publications (id, title, platform, publish_date, post_url, status, views, likes, period, created_at, updated_at) VALUES ('pub-004', '[Contoh] Recap Phinisi Basketball', 'Instagram', '25 Agu 2026', '—', 'Terbit', 1850, 240, '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
-- Total records in publications: 4

-- Table: documentations
INSERT INTO documentations (id, title, event_id, file_type, doc_date, drive_url, status, period, created_at, updated_at) VALUES ('doc-001', '[Contoh] Dokumentasi Phinisi Basketball', 'ev-004', 'Video', '22 Agu 2026', 'https://drive.google.com/', 'Tersimpan', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO documentations (id, title, event_id, file_type, doc_date, drive_url, status, period, created_at, updated_at) VALUES ('doc-002', '[Contoh] Dokumentasi Pelantikan Pengurus 2026', 'ev-007', 'Foto', '14 Feb 2026', 'https://drive.google.com/', 'Tersimpan', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO documentations (id, title, event_id, file_type, doc_date, drive_url, status, period, created_at, updated_at) VALUES ('doc-003', '[Contoh] Dokumentasi UIN Cup 2025', 'ev-010', 'Foto', '13 Okt 2025', 'https://drive.google.com/', 'Tersimpan', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
-- Total records in documentations: 3

-- Table: achievements
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-001', 'BASKET', 'Phinisi Basketball Competition', '-', '22 Agu 2026', 'Partisipasi', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-002', 'BULUTANGKIS', 'UMI CUP', 'Juara 3', '24 Nov 2025', 'Juara', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-003', 'MUSIK', 'Band Competition Entrance 4.0 UC', '-', '1 Mei 2026', 'Partisipasi', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-004', 'MUSIK', 'Penyambutan Wakil Menteri Diktisaintek', '-', '13 Nov 2025', 'Partisipasi', '2026', '2026-10-31 12:12:16.5139088 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-005', 'MUSIK', 'Spectacular Singing Competition', '-', '29 Okt 2025', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-006', 'MUSIK', 'Pembukaan Funwalk HUT-57 Semen Tonasa', '-', '19 Okt 2025', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-007', 'MUSIK', 'Festival Bakat Makassar 2025', '-', '4 Okt 2025', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-008', 'MUSIK', 'Midtown Golden Voice Season 2 VC', 'Finalis', '17 Sep 2025', 'Finalis', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-009', 'TARI', 'Job Tonasa', '-', '18 Okt 2026', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-010', 'TARI', 'Job Dies Natalis PNUP', '-', '5 Okt 2026', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-011', 'TARI', 'Job Elektro', '-', '25 Sep 2026', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-012', 'TARI', 'Job Himatik (Hotel Dalton)', '-', '11 Sep 2026', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-013', 'TARI', 'Job Tari Paduppa (Gedung Manunggal Mini)', '-', '8 Jun 2026', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-014', 'TARI', 'Job Tari Paduppa - Penyambutan Wakil Menteri Pendidikan Sains dan Teknologi (Auditorium PNUP)', '-', '13 Nov 2025', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-015', 'TARI', 'Job HUT PT Tonasa', '-', '19 Okt 2025', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-016', 'TARI', 'Lomba Indonesia Menari (Trans Studio Makassar)', '-', '12 Okt 2025', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-017', 'TENIS MEJA', 'Open Tournament', '-', '5 Nov 2025', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-018', 'TENIS MEJA', 'UNIMERS Cup', '-', '—', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-019', 'VOLI', 'UNHAS Cup 2026', '-', '28 Sep 2026', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-020', 'VOLI', 'FSWL', 'Juara 4', '26 Jun 2026', 'Juara', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-021', 'VOLI', 'UIN Cup', 'Juara 3', '13 Okt 2025', 'Juara', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at) VALUES ('ach-022', 'VOLI', 'UNHAS Cup 2025', '-', '—', 'Partisipasi', '2026', '2026-10-31 13:12:23.3091101 +0000 UTC', '2026-10-31 13:36:53.2892751 +0000 UTC');
-- Total records in achievements: 22

-- Table: activity_logs
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('log-init-01', NULL, 'System Initialization', 'system', '0', 'CREATE', 'Inisialisasi sistem database Humas & Pubdok Management Periode 2026', 'Global', '2026-10-31 12:12:16.5139088 +0000 UTC');
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('log-init-02', NULL, 'Administrator SENIOR', 'work_programs', 'proker-h01', 'CREATE', 'Input Program Kerja Pendataan Event/Lomba Unit Kegiatan', 'Humas', '2026-10-31 12:12:16.5139088 +0000 UTC');
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('log-init-03', NULL, 'Administrator SENIOR', 'work_programs', 'proker-p01', 'CREATE', 'Input Program Kerja Mengelola Media Sosial', 'Pubdok', '2026-10-31 12:12:16.5139088 +0000 UTC');
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('log-init-04', NULL, 'Staff Divisi Pubdok', 'documentations', 'doc-001', 'CREATE', 'Pengarsipan Tautan Drive Dokumentasi Festival Basket Karebosi', 'Pubdok', '2026-10-31 12:12:16.5139088 +0000 UTC');
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('1701580e-1ad1-482d-8984-ecf7c9bcddb5', 'c56a2610-9b8e-4706-b358-26b94aded795', 'Administrator SENIOR', 'users', 'c56a2610-9b8e-4706-b358-26b94aded795', 'LOGIN', 'Pengguna berhasil masuk ke sistem', 'Global', '2026-10-31 12:31:38.0268269 +0000 UTC');
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('3c8b12df-7409-43db-b6cc-28d6a0e47a5a', 'c56a2610-9b8e-4706-b358-26b94aded795', 'Administrator SENIOR', 'schedules', 'sch-h03', 'TOGGLE', 'Mengubah status checklist Rapat Persiapan Bazar Kampus: Selesai', 'Humas', '2026-10-31 12:32:00.9608917 +0000 UTC');
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('c67c8cfc-45f3-4b29-8093-e02a9ae1b64c', 'c56a2610-9b8e-4706-b358-26b94aded795', 'Administrator SENIOR', 'schedules', 'sch-h02', 'TOGGLE', 'Mengubah status checklist Koordinasi Festival Basket: Dalam Proses', 'Humas', '2026-10-31 12:32:01.7039371 +0000 UTC');
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('c82bac32-93b8-4d45-acc7-7682e01827ed', 'c56a2610-9b8e-4706-b358-26b94aded795', 'Administrator SENIOR', 'schedules', 'sch-h02', 'TOGGLE', 'Mengubah status checklist Koordinasi Festival Basket: Selesai', 'Humas', '2026-10-31 12:34:36.6751774 +0000 UTC');
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('92415ad0-5970-4398-acb6-dc22596143d1', 'c56a2610-9b8e-4706-b358-26b94aded795', 'Administrator SENIOR', 'schedules', 'sch-h02', 'TOGGLE', 'Mengubah status checklist Koordinasi Festival Basket: Dalam Proses', 'Humas', '2026-10-31 12:34:37.9365056 +0000 UTC');
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('34c4c163-832c-401a-a1aa-849600ee1747', 'c56a2610-9b8e-4706-b358-26b94aded795', 'Administrator SENIOR', 'users', 'c56a2610-9b8e-4706-b358-26b94aded795', 'LOGIN', 'Pengguna berhasil masuk ke sistem', 'Global', '2026-10-31 12:38:56.932199 +0000 UTC');
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('log-init-05', NULL, 'Staff Divisi Pubdok', 'documentations', 'doc-001', 'CREATE', 'Pengarsipan Tautan Drive Dokumentasi Festival Basket Karebosi', 'Pubdok', '2026-10-31 12:48:50.9205141 +0000 UTC');
INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at) VALUES ('log-init-06', NULL, 'Staff Divisi Pubdok', 'achievements', '22-achievements', 'CREATE', 'Import 22 Data Rekap Database Prestasi Unit Kegiatan Periode 2026', 'Pubdok', '2026-10-31 13:12:23.3091101 +0000 UTC');
-- Total records in activity_logs: 12

