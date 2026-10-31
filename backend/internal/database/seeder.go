package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"humdok-backend/internal/config"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func SeedDatabase(db *sql.DB, cfg *config.Config) error {
	log.Println("[Seeder] Starting database seeding (idempotent)...")

	now := time.Now().UTC()

	// 1. Seed Users
	hashPassword := func(pwd string) string {
		h, _ := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
		return string(h)
	}

	users := []struct {
		Email        string
		Name         string
		Password     string
		Role         string
		ModuleAccess string
	}{
		{
			Email:        cfg.AdminEmail,
			Name:         "Administrator SENIOR",
			Password:     cfg.AdminPassword,
			Role:         "Super Admin",
			ModuleAccess: "all",
		},
		{
			Email:        cfg.HumasEmail,
			Name:         "Staff Divisi Humas",
			Password:     cfg.HumasPassword,
			Role:         "Divisi Humas",
			ModuleAccess: "dashboard,board_members,work_programs,events,schedules,activity_logs",
		},
		{
			Email:        cfg.PubdokEmail,
			Name:         "Staff Divisi Publikasi & Dokumentasi",
			Password:     cfg.PubdokPassword,
			Role:         "Divisi Pubdok",
			ModuleAccess: "dashboard,work_programs,schedules,publications,documentations,achievements,activity_logs",
		},
	}

	for _, u := range users {
		var existingID string
		err := db.QueryRow("SELECT id FROM users WHERE email = ?", u.Email).Scan(&existingID)
		if err == sql.ErrNoRows {
			uid := uuid.New().String()
			_, err = db.Exec(`INSERT INTO users (id, name, email, password_hash, role, module_access, status, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
				uid, u.Name, u.Email, hashPassword(u.Password), u.Role, u.ModuleAccess, now, now)
			if err != nil {
				return fmt.Errorf("failed to seed user %s: %w", u.Email, err)
			}
		}
	}

	// 2. Seed Board Members (55 Pengurus Resmi Periode 2026)
	type MemberSeed struct {
		ID       string
		Name     string
		SNR      string
		Position string
		Level    string
		Division string
		Contact  string
	}

	members := []MemberSeed{
		{ID: "mem-001", Name: "Ahsan", SNR: "—", Position: "Anggota Staf Ahli", Level: "Staf Ahli", Division: "Staf Ahli", Contact: "—"},
		{ID: "mem-002", Name: "Andhika Aryaputra M", SNR: "—", Position: "Anggota Staf Ahli", Level: "Staf Ahli", Division: "Staf Ahli", Contact: "—"},
		{ID: "mem-003", Name: "Asti Hafsari", SNR: "—", Position: "Anggota Staf Ahli", Level: "Staf Ahli", Division: "Staf Ahli", Contact: "—"},
		{ID: "mem-004", Name: "Axel Febrian Palajukan", SNR: "—", Position: "Anggota Staf Ahli", Level: "Staf Ahli", Division: "Staf Ahli", Contact: "—"},
		{ID: "mem-005", Name: "Ilham Yahya", SNR: "—", Position: "Anggota Staf Ahli", Level: "Staf Ahli", Division: "Staf Ahli", Contact: "—"},
		{ID: "mem-006", Name: "Nur Amalia Ramadhani", SNR: "—", Position: "Anggota Staf Ahli", Level: "Staf Ahli", Division: "Staf Ahli", Contact: "—"},
		{ID: "mem-007", Name: "Richard Abraham Lely", SNR: "—", Position: "Anggota Staf Ahli", Level: "Staf Ahli", Division: "Staf Ahli", Contact: "—"},
		{ID: "mem-008", Name: "Shintiya Rahma Pratiwi", SNR: "—", Position: "Anggota Staf Ahli", Level: "Staf Ahli", Division: "Staf Ahli", Contact: "—"},
		{ID: "mem-009", Name: "Dian Ainiyyah Yusuf", SNR: "—", Position: "KOORDINATOR STAF AHLI", Level: "Staf Ahli", Division: "Staf Ahli", Contact: "—"},
		{ID: "mem-010", Name: "Nur Fadilah", SNR: "SNR.24.24.056", Position: "BENDAHARA UMUM", Level: "Pengurus Harian", Division: "Presidium", Contact: "—"},
		{ID: "mem-011", Name: "Andi Nurul Fasirah", SNR: "SNR.24.24.071", Position: "KETUA BIDANG DIVISI", Level: "Pengurus Harian", Division: "Bidang Divisi", Contact: "—"},
		{ID: "mem-012", Name: "Muhammad Haidar Putra Subara", SNR: "SNR.24.24.099", Position: "KETUA BIDANG OLAHRAGA", Level: "Pengurus Harian", Division: "Bidang Olahraga", Contact: "—"},
		{ID: "mem-013", Name: "Muh. Ramadhan Abhyantara Rusmin", SNR: "SNR.24.24.108", Position: "KETUA BIDANG SENI", Level: "Pengurus Harian", Division: "Bidang Seni", Contact: "—"},
		{ID: "mem-014", Name: "Muhammad Khairan Muslim Pasarai", SNR: "SNR.24.24.027", Position: "KETUA UMUM", Level: "Pengurus Harian", Division: "Presidium", Contact: "—"},
		{ID: "mem-015", Name: "Aulia Amelia Rahma", SNR: "SNR.24.24.136", Position: "KOORDINATOR DIVISI DANUS", Level: "Pengurus Harian", Division: "Divisi Danus", Contact: "—"},
		{ID: "mem-016", Name: "Amanda Damayanti", SNR: "SNR.24.24.121", Position: "KOORDINATOR DIVISI HUMAS", Level: "Pengurus Harian", Division: "Divisi Humas", Contact: "—"},
		{ID: "mem-017", Name: "Reiner Kaleb Hitijahubessy", SNR: "SNR.24.24.020", Position: "KOORDINATOR DIVISI KESEKRETARIATAN", Level: "Pengurus Harian", Division: "Divisi Kesekretariatan", Contact: "—"},
		{ID: "mem-018", Name: "Reskiyah Auliah Putri Subair", SNR: "SNR.24.24.048", Position: "KOORDINATOR DIVISI PUBDOK", Level: "Pengurus Harian", Division: "Divisi Pubdok", Contact: "—"},
		{ID: "mem-019", Name: "Nurul Rahma Maqfirah", SNR: "SNR.24.24.014", Position: "KOORDINATOR DIVISI SDM", Level: "Pengurus Harian", Division: "Divisi SDM", Contact: "—"},
		{ID: "mem-020", Name: "Sissy Enesya Kalompo", SNR: "SNR.24.25.027", Position: "KOORDINATOR UK BOLA BASKET", Level: "Pengurus Harian", Division: "UK Bola Basket", Contact: "—"},
		{ID: "mem-021", Name: "Muh. Afdal Tabrani", SNR: "SNR.25.25.081", Position: "KOORDINATOR UK BOLA VOLI", Level: "Pengurus Harian", Division: "UK Bola Voli", Contact: "—"},
		{ID: "mem-022", Name: "Nurhikmah Khaerunnisa Ismail", SNR: "SNR.24.24.069", Position: "KOORDINATOR UK BULUTANGKIS", Level: "Pengurus Harian", Division: "UK Bulutangkis", Contact: "—"},
		{ID: "mem-023", Name: "Muh. Arifin Ilham", SNR: "SNR.24.25.030", Position: "KOORDINATOR UK MUSIK", Level: "Pengurus Harian", Division: "UK Musik", Contact: "—"},
		{ID: "mem-024", Name: "Zahra Mukhbita", SNR: "SNR.24.24.131", Position: "KOORDINATOR UK TARI", Level: "Pengurus Harian", Division: "UK Tari", Contact: "—"},
		{ID: "mem-025", Name: "Adam Jamal", SNR: "SNR.24.24.034", Position: "KOORDINATOR UK TENIS MEJA", Level: "Pengurus Harian", Division: "UK Tenis Meja", Contact: "—"},
		{ID: "mem-026", Name: "Rismayatullah", SNR: "SNR.24.24.141", Position: "SEKRETARIS UMUM", Level: "Pengurus Harian", Division: "Presidium", Contact: "—"},
		{ID: "mem-027", Name: "Adelia Sulastia", SNR: "SNR.25.25.150", Position: "Anggota Divisi Danus", Level: "Anggota Pengurus Harian", Division: "Divisi Danus", Contact: "082190857122"},
		{ID: "mem-028", Name: "Dhita Amaliah", SNR: "SNR.24.24.030", Position: "Anggota Divisi Danus", Level: "Anggota Pengurus Harian", Division: "Divisi Danus", Contact: "0895334389759"},
		{ID: "mem-029", Name: "Nuriftah Khaerani", SNR: "—", Position: "Anggota Divisi Danus", Level: "Anggota Pengurus Harian", Division: "Divisi Danus", Contact: "—"},
		{ID: "mem-030", Name: "Azzahrah Amalia Said", SNR: "SNR.25.25.104", Position: "Anggota Divisi Humas", Level: "Anggota Pengurus Harian", Division: "Divisi Humas", Contact: "087841592058"},
		{ID: "mem-031", Name: "Eva Mesera", SNR: "SNR.25.25.160", Position: "Anggota Divisi Humas", Level: "Anggota Pengurus Harian", Division: "Divisi Humas", Contact: "0887436863951"},
		{ID: "mem-032", Name: "Nur Aliah", SNR: "SNR.24.24.040", Position: "Anggota Divisi Humas", Level: "Anggota Pengurus Harian", Division: "Divisi Humas", Contact: "0895393754355"},
		{ID: "mem-033", Name: "Nur Naila", SNR: "SNR.25.25.143", Position: "Anggota Divisi Humas", Level: "Anggota Pengurus Harian", Division: "Divisi Humas", Contact: "085298508771"},
		{ID: "mem-034", Name: "Dede Afdhal Hamlet", SNR: "SNR.25.25.052", Position: "Anggota Divisi Kesekretariatan", Level: "Anggota Pengurus Harian", Division: "Divisi Kesekretariatan", Contact: "081257245471"},
		{ID: "mem-035", Name: "Muhammad Irsan Setiawan", SNR: "SNR.24.24.097", Position: "Anggota Divisi Kesekretariatan", Level: "Anggota Pengurus Harian", Division: "Divisi Kesekretariatan", Contact: "089694307890"},
		{ID: "mem-036", Name: "Widya Anugrah", SNR: "SNR.25.25.173", Position: "Anggota Divisi Kesekretariatan", Level: "Anggota Pengurus Harian", Division: "Divisi Kesekretariatan", Contact: "081522580661"},
		{ID: "mem-037", Name: "Anisa Cahaya Langsa", SNR: "SNR.25.25.157", Position: "Anggota Divisi Pubdok", Level: "Anggota Pengurus Harian", Division: "Divisi Pubdok", Contact: "082292828668"},
		{ID: "mem-038", Name: "Asilah Nur Athiyah", SNR: "—", Position: "Anggota Divisi Pubdok", Level: "Anggota Pengurus Harian", Division: "Divisi Pubdok", Contact: "—"},
		{ID: "mem-039", Name: "Aulia Mutmainnah Akbar", SNR: "SNR.25.25.135", Position: "Anggota Divisi Pubdok", Level: "Anggota Pengurus Harian", Division: "Divisi Pubdok", Contact: "085242660320"},
		{ID: "mem-040", Name: "Muh. Althaf Andriansyah", SNR: "SNR.25.25.116", Position: "Anggota Divisi Pubdok", Level: "Anggota Pengurus Harian", Division: "Divisi Pubdok", Contact: "081355442332"},
		{ID: "mem-041", Name: "Afda Anugra", SNR: "SNR.25.25.151", Position: "Anggota Divisi SDM", Level: "Anggota Pengurus Harian", Division: "Divisi SDM", Contact: "0882020739089"},
		{ID: "mem-042", Name: "Jelsi Febriola", SNR: "SNR.24.25.025", Position: "Anggota Divisi SDM", Level: "Anggota Pengurus Harian", Division: "Divisi SDM", Contact: "082193386064"},
		{ID: "mem-043", Name: "Radisti Burirang", SNR: "SNR.25.25.146", Position: "Anggota Divisi SDM", Level: "Anggota Pengurus Harian", Division: "Divisi SDM", Contact: "089603048239"},
		{ID: "mem-044", Name: "Denaldi Rawan", SNR: "SNR.24.25.029", Position: "Bidang Inventaris", Level: "Anggota Pengurus Harian", Division: "UK Musik", Contact: "082396050789"},
		{ID: "mem-045", Name: "Muh. Anugrah", SNR: "SNR.24.25.038", Position: "Bidang Inventaris", Level: "Anggota Pengurus Harian", Division: "UK Tari", Contact: "082195550014"},
		{ID: "mem-046", Name: "Anniza Almira", SNR: "—", Position: "Bidang Keanggotaan", Level: "Anggota Pengurus Harian", Division: "UK Bola Voli", Contact: "—"},
		{ID: "mem-047", Name: "Atma Fira", SNR: "SNR.25.25.095", Position: "Bidang Keanggotaan", Level: "Anggota Pengurus Harian", Division: "UK Tenis Meja", Contact: "082290634496"},
		{ID: "mem-048", Name: "Nayla Nur Aqilah", SNR: "SNR.25.25.122", Position: "Bidang Keanggotaan", Level: "Anggota Pengurus Harian", Division: "UK Bola Basket", Contact: "085141336779"},
		{ID: "mem-049", Name: "Syihab Haq Saidiman", SNR: "SNR.24.25.015", Position: "Bidang Keanggotaan", Level: "Anggota Pengurus Harian", Division: "UK Bulutangkis", Contact: "081341376395"},
		{ID: "mem-050", Name: "Ahmad Hafiz Maulana", SNR: "—", Position: "Bidang Kepelatihan", Level: "Anggota Pengurus Harian", Division: "UK Bulutangkis", Contact: "—"},
		{ID: "mem-051", Name: "Al Muqhira Syaebatul Hamdi", SNR: "SNR.25.25.101", Position: "Bidang Kepelatihan", Level: "Anggota Pengurus Harian", Division: "UK Bola Basket", Contact: "089520675412"},
		{ID: "mem-052", Name: "Andika", SNR: "SNR.25.25.094", Position: "Bidang Kepelatihan", Level: "Anggota Pengurus Harian", Division: "UK Tenis Meja", Contact: "082227088061"},
		{ID: "mem-053", Name: "Muh Dzaky", SNR: "SNR.25.25.083", Position: "Bidang Kepelatihan", Level: "Anggota Pengurus Harian", Division: "UK Bola Voli", Contact: "083110001594"},
		{ID: "mem-054", Name: "Ananda Lestari", SNR: "SNR.25.25.154", Position: "Bidang Management Event", Level: "Anggota Pengurus Harian", Division: "UK Tari", Contact: "087846316851"},
		{ID: "mem-055", Name: "Nahlah Nurfadilah", SNR: "SNR.24.25.034", Position: "Bidang Management Event", Level: "Anggota Pengurus Harian", Division: "UK Musik", Contact: "087740059687"},
	}

	for _, m := range members {
		var id string
		err := db.QueryRow("SELECT id FROM board_members WHERE id = ?", m.ID).Scan(&id)
		if err == sql.ErrNoRows {
			_, err = db.Exec(`INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, '2026', ?, ?)`,
				m.ID, m.Name, m.SNR, m.Position, m.Level, m.Division, m.Contact, now, now)
			if err != nil {
				return fmt.Errorf("failed to seed board member %s: %w", m.Name, err)
			}
		} else {
			_, err = db.Exec(`UPDATE board_members SET name = ?, snr = ?, position = ?, level = ?, division = ?, contact = ?, period = '2026', updated_at = ?
				WHERE id = ?`,
				m.Name, m.SNR, m.Position, m.Level, m.Division, m.Contact, now, m.ID)
			if err != nil {
				return fmt.Errorf("failed to update board member %s: %w", m.Name, err)
			}
		}
	}

	// 3. Seed Work Programs (7 Total: Humas 2 [55% avg], Pubdok 5 [45% avg])
	programs := []struct {
		ID       string
		Name     string
		PicID    string
		PicName  string
		Target   string
		Progress int
		Status   string
		Division string
	}{
		// Humas (2 Proker, Avg = (70+40)/2 = 55%)
		{
			ID:       "proker-h01",
			Name:     "Pendataan Event/Lomba Unit Kegiatan",
			PicID:    "mem-016",
			PicName:  "Amanda Damayanti",
			Target:   "Mendata seluruh event/lomba internal dan eksternal kampus se-Sulsel",
			Progress: 70,
			Status:   "Berjalan",
			Division: "Humas",
		},
		{
			ID:       "proker-h02",
			Name:     "Kerja Sama & Undangan Eksternal",
			PicID:    "mem-030",
			PicName:  "Azzahrah Amalia Said",
			Target:   "Membangun kemitraan strategis dan merespons undangan ormawa kampus",
			Progress: 40,
			Status:   "Berjalan",
			Division: "Humas",
		},
		// Pubdok (5 Proker, Avg = (27+0+100+0+100)/5 = 45%, 2 Terlaksana, 2 Berjalan, 1 Belum)
		{
			ID:       "proker-p01",
			Name:     "Mengelola media sosial UKM SENIOR PNUP secara berkala",
			PicID:    "mem-018",
			PicName:  "Reskiyah Auliah Putri Subair",
			Target:   "98% kegiatan Terdokumentasi di Sosial Media",
			Progress: 27,
			Status:   "Berjalan",
			Division: "Pubdok",
		},
		{
			ID:       "proker-p02",
			Name:     "Workshop (Pelatihan Media/Publikasi)",
			PicID:    "mem-018",
			PicName:  "Reskiyah Auliah Putri Subair",
			Target:   "minimal 2 kali dalam kepengurusan",
			Progress: 0,
			Status:   "Belum",
			Division: "Pubdok",
		},
		{
			ID:       "proker-p03",
			Name:     "Pengadaan Tripod",
			PicID:    "mem-040",
			PicName:  "Muh. Althaf Andriansyah",
			Target:   "1 unit",
			Progress: 100,
			Status:   "Terlaksana",
			Division: "Pubdok",
		},
		{
			ID:       "proker-p04",
			Name:     "Membuat Konten Perunit Kegiatan dan Pengurus Harian",
			PicID:    "mem-037",
			PicName:  "Anisa Cahaya Langsa",
			Target:   "8 Konten selama periode ke pengurusan",
			Progress: 0,
			Status:   "Berjalan",
			Division: "Pubdok",
		},
		{
			ID:       "proker-p05",
			Name:     "Data Base Prestasi per unit kegiatan",
			PicID:    "mem-039",
			PicName:  "Aulia Mutmainnah Akbar",
			Target:   "1 dokumen database utama (diperbarui berkala).",
			Progress: 100,
			Status:   "Terlaksana",
			Division: "Pubdok",
		},
	}

	for _, p := range programs {
		var id string
		err := db.QueryRow("SELECT id FROM work_programs WHERE id = ?", p.ID).Scan(&id)
		if err == sql.ErrNoRows {
			_, err = db.Exec(`INSERT INTO work_programs (id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2026', ?, ?)`,
				p.ID, p.Name, p.PicID, p.PicName, p.Target, p.Progress, p.Status, p.Division, now, now)
			if err != nil {
				return fmt.Errorf("failed to seed work program %s: %w", p.Name, err)
			}
		} else {
			_, _ = db.Exec(`UPDATE work_programs SET name = ?, pic_id = ?, pic_name = ?, target_text = ?, progress_pct = ?, status = ?, division = ?, updated_at = ? WHERE id = ?`,
				p.Name, p.PicID, p.PicName, p.Target, p.Progress, p.Status, p.Division, now, p.ID)
		}
	}

	// 4. Seed Events (16 Total: 10 Terlaksana, 6 Belum Terlaksana / Belum Dihadiri)
	events := []struct {
		ID        string
		Name      string
		Unit      string
		EventType string
		Date      string
		Contact   string
		Status    string
	}{
		// 1
		{ID: "ev-001", Name: "[Contoh] Undangan Bazar Kampus", Unit: "—", EventType: "Bazar", Date: "20 Nov 2026", Contact: "—", Status: "Belum Terlaksana / Belum Dihadiri"},
		// 2
		{ID: "ev-002", Name: "Festival Basket Karebosi 2025", Unit: "MUSIK", EventType: "Lomba / Event", Date: "4 Okt 2026", Contact: "0877-8255-8682", Status: "Terlaksana"},
		// 3
		{ID: "ev-003", Name: "Unhas Cup 2026", Unit: "VOLI", EventType: "Lomba / Event", Date: "28 Sep 2026", Contact: "0882-0226-93656", Status: "Terlaksana"},
		// 4
		{ID: "ev-004", Name: "Phinisi Basketball Competition 2026", Unit: "BASKET", EventType: "Lomba / Event", Date: "22 Agu 2026", Contact: "0852-4012-0284", Status: "Terlaksana"},
		// 5
		{ID: "ev-005", Name: "FSWL XIV 2026", Unit: "VOLI", EventType: "Lomba / Event", Date: "22 Jun 2026", Contact: "0856-9673-6219", Status: "Terlaksana"},
		// 6
		{ID: "ev-006", Name: "Band Competition Entrance 4.0 UC 2025", Unit: "MUSIK", EventType: "Lomba / Event", Date: "1 Mei 2026", Contact: "0858-2332-3374", Status: "Terlaksana"},
		// 7
		{ID: "ev-007", Name: "[Contoh] Pelantikan Pengurus 2026", Unit: "—", EventType: "Pelantikan", Date: "14 Feb 2026", Contact: "—", Status: "Terlaksana"},
		// 8
		{ID: "ev-008", Name: "UKMB UMI CUP 2025", Unit: "BULUTANGKIS", EventType: "Lomba / Event", Date: "28 Nov 2025", Contact: "—", Status: "Terlaksana"},
		// 9
		{ID: "ev-009", Name: "Tournament Tenis Meja 2025", Unit: "TENIS MEJA", EventType: "Lomba / Event", Date: "5 Nov 2025", Contact: "0811-4443-877", Status: "Terlaksana"},
		// 10
		{ID: "ev-010", Name: "UIN Cup 2025", Unit: "VOLI", EventType: "Lomba / Event", Date: "13 Okt 2025", Contact: "0823-4981-8466", Status: "Terlaksana"},
		// 11
		{ID: "ev-011", Name: "Lomba Indonesia Menari (Trans Studio Makassar) 2025", Unit: "TARI", EventType: "Lomba / Event", Date: "12 Okt 2025", Contact: "—", Status: "Terlaksana"},
		// 12
		{ID: "ev-012", Name: "Unimerz Cup 2025", Unit: "TENIS MEJA", EventType: "Lomba / Event", Date: "—", Contact: "0823-4584-0505", Status: "Belum Terlaksana / Belum Dihadiri"},
		// 13
		{ID: "ev-013", Name: "Unimerz 2025", Unit: "VOLI", EventType: "Lomba / Event", Date: "—", Contact: "0823-4584-0505", Status: "Belum Terlaksana / Belum Dihadiri"},
		// 14
		{ID: "ev-014", Name: "Rector Unhas Cup 2025", Unit: "BASKET", EventType: "Lomba / Event", Date: "—", Contact: "0882-4530-6918", Status: "Belum Terlaksana / Belum Dihadiri"},
		// 15
		{ID: "ev-015", Name: "3X3 PARAGA 2025", Unit: "BASKET", EventType: "Lomba / Event", Date: "—", Contact: "0822-6646-0994", Status: "Belum Terlaksana / Belum Dihadiri"},
		// 16
		{ID: "ev-016", Name: "UBC (Unhas Badminton Cup) 2026", Unit: "BULUTANGKIS", EventType: "Lomba / Event", Date: "—", Contact: "0822-1720-9400", Status: "Belum Terlaksana / Belum Dihadiri"},
	}

	for _, e := range events {
		var id string
		err := db.QueryRow("SELECT id FROM events WHERE id = ?", e.ID).Scan(&id)
		if err == sql.ErrNoRows {
			_, err = db.Exec(`INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, '2026', ?, ?)`,
				e.ID, e.Name, e.Unit, e.EventType, e.Date, e.Contact, e.Status, now, now)
			if err != nil {
				return fmt.Errorf("failed to seed event %s: %w", e.Name, err)
			}
		} else {
			_, _ = db.Exec(`UPDATE events SET name = ?, unit = ?, event_type = ?, event_date = ?, contact = ?, status = ?, updated_at = ? WHERE id = ?`,
				e.Name, e.Unit, e.EventType, e.Date, e.Contact, e.Status, now, e.ID)
		}
	}

	// 5. Seed Schedules / Time Schedule Checklist
	schedules := []struct {
		ID       string
		Title    string
		PicID    string
		PicName  string
		Stage    string
		Deadline string
		IsDone   bool
		Status   string
		Category string
		Division string
	}{
		// Pubdok Schedules
		{ID: "sch-p01", Title: "FEED Pelantikan & Raker", PicID: "mem-018", PicName: "Reskiyah Auliah Putri Subair", Stage: "Publikasi Konten", Deadline: "2026-01-04", IsDone: true, Status: "Selesai", Category: "publikasi", Division: "Pubdok"},
		{ID: "sch-p02", Title: "DESAIN Ganstik", PicID: "mem-037", PicName: "Anisa Cahaya Langsa", Stage: "Desain Visual", Deadline: "2026-01-14", IsDone: true, Status: "Selesai", Category: "tugas", Division: "Pubdok"},
		{ID: "sch-p03", Title: "PAMFLET PDL", PicID: "mem-040", PicName: "Muh. Althaf Andriansyah", Stage: "Finalisasi Cetak", Deadline: "2026-01-22", IsDone: true, Status: "Selesai", Category: "tugas", Division: "Pubdok"},
		{ID: "sch-p04", Title: "PAMFLET Selamat Bertanding", PicID: "mem-039", PicName: "Aulia Mutmainnah Akbar", Stage: "Rilis Media Sosial", Deadline: "2026-01-27", IsDone: true, Status: "Selesai", Category: "publikasi", Division: "Pubdok"},
		{ID: "sch-p05", Title: "Feed Teaser Bazar Kampus", PicID: "mem-018", PicName: "Reskiyah Auliah Putri Subair", Stage: "Editing Video", Deadline: "2026-11-10", IsDone: false, Status: "Dalam Proses", Category: "publikasi", Division: "Pubdok"},
		// Humas Schedules
		{ID: "sch-h01", Title: "Rapat Evaluasi Bulanan", PicID: "mem-016", PicName: "Amanda Damayanti", Stage: "Koordinasi BPH", Deadline: "2026-02-01", IsDone: true, Status: "Selesai", Category: "rapat", Division: "Humas"},
		{ID: "sch-h02", Title: "Koordinasi Festival Basket", PicID: "mem-030", PicName: "Azzahrah Amalia Said", Stage: "Audiensi Panitia", Deadline: "2026-01-12", IsDone: true, Status: "Selesai", Category: "kegiatan", Division: "Humas"},
		{ID: "sch-h03", Title: "Rapat Persiapan Bazar Kampus", PicID: "mem-032", PicName: "Nur Aliah", Stage: "Rapat Panitia", Deadline: "2026-11-08", IsDone: false, Status: "Belum Dimulai", Category: "rapat", Division: "Humas"},
	}

	for _, s := range schedules {
		var id string
		err := db.QueryRow("SELECT id FROM schedules WHERE id = ?", s.ID).Scan(&id)
		if err == sql.ErrNoRows {
			_, err = db.Exec(`INSERT INTO schedules (id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2026', ?, ?)`,
				s.ID, s.Title, s.PicID, s.PicName, s.Stage, s.Deadline, s.IsDone, s.Status, s.Category, s.Division, now, now)
			if err != nil {
				return fmt.Errorf("failed to seed schedule %s: %w", s.Title, err)
			}
		} else {
			_, _ = db.Exec(`UPDATE schedules SET title = ?, pic_id = ?, pic_name = ?, stage = ?, deadline_date = ?, is_done = ?, status = ?, category = ?, division = ?, updated_at = ? WHERE id = ?`,
				s.Title, s.PicID, s.PicName, s.Stage, s.Deadline, s.IsDone, s.Status, s.Category, s.Division, now, s.ID)
		}
	}

	// 6. Seed Publications (Khusus Pubdok - 4 Data)
	publications := []struct {
		ID       string
		Title    string
		Platform string
		Date     string
		URL      string
		Status   string
		Views    int
		Likes    int
	}{
		{ID: "pub-001", Title: "[Contoh] Teaser Bazar Kampus", Platform: "TikTok", Date: "18 Nov 2026", URL: "—", Status: "Ide Konten", Views: 0, Likes: 0},
		{ID: "pub-002", Title: "[Contoh] Rekap Prestasi UKM 2026", Platform: "Instagram", Date: "15 Nov 2026", URL: "—", Status: "Produksi", Views: 0, Likes: 0},
		{ID: "pub-003", Title: "[Contoh] Highlight Unhas Cup 2026", Platform: "TikTok", Date: "1 Okt 2026", URL: "—", Status: "Terbit", Views: 5200, Likes: 610},
		{ID: "pub-004", Title: "[Contoh] Recap Phinisi Basketball", Platform: "Instagram", Date: "25 Agu 2026", URL: "—", Status: "Terbit", Views: 1850, Likes: 240},
	}

	for _, p := range publications {
		var id string
		err := db.QueryRow("SELECT id FROM publications WHERE id = ?", p.ID).Scan(&id)
		if err == sql.ErrNoRows {
			_, err = db.Exec(`INSERT INTO publications (id, title, platform, publish_date, post_url, status, views, likes, period, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2026', ?, ?)`,
				p.ID, p.Title, p.Platform, p.Date, p.URL, p.Status, p.Views, p.Likes, now, now)
			if err != nil {
				return fmt.Errorf("failed to seed publication %s: %w", p.Title, err)
			}
		} else {
			_, _ = db.Exec(`UPDATE publications SET title = ?, platform = ?, publish_date = ?, post_url = ?, status = ?, views = ?, likes = ?, updated_at = ? WHERE id = ?`,
				p.Title, p.Platform, p.Date, p.URL, p.Status, p.Views, p.Likes, now, p.ID)
		}
	}

	// 7. Seed Documentations (Khusus Pubdok - 3 Data, Foreign Key ke Events)
	documentations := []struct {
		ID       string
		Title    string
		EventID  string
		FileType string
		DocDate  string
		DriveURL string
		Status   string
	}{
		{ID: "doc-001", Title: "[Contoh] Dokumentasi Phinisi Basketball", EventID: "ev-004", FileType: "Video", DocDate: "22 Agu 2026", DriveURL: "https://drive.google.com/", Status: "Tersimpan"},
		{ID: "doc-002", Title: "[Contoh] Dokumentasi Pelantikan Pengurus 2026", EventID: "ev-007", FileType: "Foto", DocDate: "14 Feb 2026", DriveURL: "https://drive.google.com/", Status: "Tersimpan"},
		{ID: "doc-003", Title: "[Contoh] Dokumentasi UIN Cup 2025", EventID: "ev-010", FileType: "Foto", DocDate: "13 Okt 2025", DriveURL: "https://drive.google.com/", Status: "Tersimpan"},
	}

	for _, d := range documentations {
		var id string
		err := db.QueryRow("SELECT id FROM documentations WHERE id = ?", d.ID).Scan(&id)
		if err == sql.ErrNoRows {
			_, err = db.Exec(`INSERT INTO documentations (id, title, event_id, file_type, doc_date, drive_url, status, period, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, '2026', ?, ?)`,
				d.ID, d.Title, d.EventID, d.FileType, d.DocDate, d.DriveURL, d.Status, now, now)
			if err != nil {
				return fmt.Errorf("failed to seed documentation %s: %w", d.Title, err)
			}
		} else {
			_, _ = db.Exec(`UPDATE documentations SET title = ?, event_id = ?, file_type = ?, doc_date = ?, drive_url = ?, status = ?, updated_at = ? WHERE id = ?`,
				d.Title, d.EventID, d.FileType, d.DocDate, d.DriveURL, d.Status, now, d.ID)
		}
	}

	// 8. Seed Achievements (Khusus Pubdok - 22 Data Resmi)
	achievements := []struct {
		ID             string
		Unit           string
		EventName      string
		RankTitle      string
		EventDate      string
		ResultCategory string
	}{
		{ID: "ach-001", Unit: "BASKET", EventName: "Phinisi Basketball Competition", RankTitle: "-", EventDate: "22 Agu 2026", ResultCategory: "Partisipasi"},
		{ID: "ach-002", Unit: "BULUTANGKIS", EventName: "UMI CUP", RankTitle: "Juara 3", EventDate: "24 Nov 2025", ResultCategory: "Juara"},
		{ID: "ach-003", Unit: "MUSIK", EventName: "Band Competition Entrance 4.0 UC", RankTitle: "-", EventDate: "1 Mei 2026", ResultCategory: "Partisipasi"},
		{ID: "ach-004", Unit: "MUSIK", EventName: "Penyambutan Wakil Menteri Diktisaintek", RankTitle: "-", EventDate: "13 Nov 2025", ResultCategory: "Partisipasi"},
		{ID: "ach-005", Unit: "MUSIK", EventName: "Spectacular Singing Competition", RankTitle: "-", EventDate: "29 Okt 2025", ResultCategory: "Partisipasi"},
		{ID: "ach-006", Unit: "MUSIK", EventName: "Pembukaan Funwalk HUT-57 Semen Tonasa", RankTitle: "-", EventDate: "19 Okt 2025", ResultCategory: "Partisipasi"},
		{ID: "ach-007", Unit: "MUSIK", EventName: "Festival Bakat Makassar 2025", RankTitle: "-", EventDate: "4 Okt 2025", ResultCategory: "Partisipasi"},
		{ID: "ach-008", Unit: "MUSIK", EventName: "Midtown Golden Voice Season 2 VC", RankTitle: "Finalis", EventDate: "17 Sep 2025", ResultCategory: "Finalis"},
		{ID: "ach-009", Unit: "TARI", EventName: "Job Tonasa", RankTitle: "-", EventDate: "18 Okt 2026", ResultCategory: "Partisipasi"},
		{ID: "ach-010", Unit: "TARI", EventName: "Job Dies Natalis PNUP", RankTitle: "-", EventDate: "5 Okt 2026", ResultCategory: "Partisipasi"},
		{ID: "ach-011", Unit: "TARI", EventName: "Job Elektro", RankTitle: "-", EventDate: "25 Sep 2026", ResultCategory: "Partisipasi"},
		{ID: "ach-012", Unit: "TARI", EventName: "Job Himatik (Hotel Dalton)", RankTitle: "-", EventDate: "11 Sep 2026", ResultCategory: "Partisipasi"},
		{ID: "ach-013", Unit: "TARI", EventName: "Job Tari Paduppa (Gedung Manunggal Mini)", RankTitle: "-", EventDate: "8 Jun 2026", ResultCategory: "Partisipasi"},
		{ID: "ach-014", Unit: "TARI", EventName: "Job Tari Paduppa - Penyambutan Wakil Menteri Pendidikan Sains dan Teknologi (Auditorium PNUP)", RankTitle: "-", EventDate: "13 Nov 2025", ResultCategory: "Partisipasi"},
		{ID: "ach-015", Unit: "TARI", EventName: "Job HUT PT Tonasa", RankTitle: "-", EventDate: "19 Okt 2025", ResultCategory: "Partisipasi"},
		{ID: "ach-016", Unit: "TARI", EventName: "Lomba Indonesia Menari (Trans Studio Makassar)", RankTitle: "-", EventDate: "12 Okt 2025", ResultCategory: "Partisipasi"},
		{ID: "ach-017", Unit: "TENIS MEJA", EventName: "Open Tournament", RankTitle: "-", EventDate: "5 Nov 2025", ResultCategory: "Partisipasi"},
		{ID: "ach-018", Unit: "TENIS MEJA", EventName: "UNIMERS Cup", RankTitle: "-", EventDate: "—", ResultCategory: "Partisipasi"},
		{ID: "ach-019", Unit: "VOLI", EventName: "UNHAS Cup 2026", RankTitle: "-", EventDate: "28 Sep 2026", ResultCategory: "Partisipasi"},
		{ID: "ach-020", Unit: "VOLI", EventName: "FSWL", RankTitle: "Juara 4", EventDate: "26 Jun 2026", ResultCategory: "Juara"},
		{ID: "ach-021", Unit: "VOLI", EventName: "UIN Cup", RankTitle: "Juara 3", EventDate: "13 Okt 2025", ResultCategory: "Juara"},
		{ID: "ach-022", Unit: "VOLI", EventName: "UNHAS Cup 2025", RankTitle: "-", EventDate: "—", ResultCategory: "Partisipasi"},
	}

	for _, a := range achievements {
		var id string
		err := db.QueryRow("SELECT id FROM achievements WHERE id = ?", a.ID).Scan(&id)
		if err == sql.ErrNoRows {
			_, err = db.Exec(`INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, '2026', ?, ?)`,
				a.ID, a.Unit, a.EventName, a.RankTitle, a.EventDate, a.ResultCategory, now, now)
			if err != nil {
				return fmt.Errorf("failed to seed achievement %s: %w", a.EventName, err)
			}
		} else {
			_, _ = db.Exec(`UPDATE achievements SET unit = ?, event_name = ?, rank_title = ?, event_date = ?, result_category = ?, updated_at = ? WHERE id = ?`,
				a.Unit, a.EventName, a.RankTitle, a.EventDate, a.ResultCategory, now, a.ID)
		}
	}

	// 9. Initial Activity Logs
	logs := []struct {
		ID          string
		UserName    string
		TableName   string
		DataID      string
		ActionType  string
		Description string
		Division    string
	}{
		{ID: "log-init-01", UserName: "System Initialization", TableName: "system", DataID: "0", ActionType: "CREATE", Description: "Inisialisasi sistem database Humas & Pubdok Management Periode 2026", Division: "Global"},
		{ID: "log-init-02", UserName: "Administrator SENIOR", TableName: "board_members", DataID: "55-members", ActionType: "CREATE", Description: "Import 55 data Pengurus Periode Kepengurusan 2026", Division: "Global"},
		{ID: "log-init-03", UserName: "Administrator SENIOR", TableName: "work_programs", DataID: "proker-h01", ActionType: "CREATE", Description: "Input Program Kerja Pendataan Event/Lomba Unit Kegiatan", Division: "Humas"},
		{ID: "log-init-04", UserName: "Administrator SENIOR", TableName: "work_programs", DataID: "proker-p01", ActionType: "CREATE", Description: "Input Program Kerja Mengelola Media Sosial UKM SENIOR PNUP secara berkala", Division: "Pubdok"},
		{ID: "log-init-05", UserName: "Staff Divisi Pubdok", TableName: "documentations", DataID: "doc-001", ActionType: "CREATE", Description: "Pengarsipan Tautan Drive Dokumentasi Phinisi Basketball", Division: "Pubdok"},
		{ID: "log-init-06", UserName: "Staff Divisi Pubdok", TableName: "achievements", DataID: "22-achievements", ActionType: "CREATE", Description: "Import 22 Data Rekap Database Prestasi Unit Kegiatan Periode 2026", Division: "Pubdok"},
	}

	for _, l := range logs {
		var id string
		err := db.QueryRow("SELECT id FROM activity_logs WHERE id = ?", l.ID).Scan(&id)
		if err == sql.ErrNoRows {
			_, err = db.Exec(`INSERT INTO activity_logs (id, user_name, table_name, data_id, action_type, description, division, created_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				l.ID, l.UserName, l.TableName, l.DataID, l.ActionType, l.Description, l.Division, now)
			if err != nil {
				return fmt.Errorf("failed to seed initial log: %w", err)
			}
		}
	}

	log.Println("[Seeder] Database seeding finished successfully. 55 members, 7 prokers, 16 events, 22 achievements configured.")
	return nil
}
