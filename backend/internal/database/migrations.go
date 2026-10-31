package database

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
)

func RunMigrations(db *sql.DB) error {
	log.Println("[Migrations] Running database migrations...")

	// Create migrations tracking table
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(50) PRIMARY KEY,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`)
	if err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	queries := []string{
		// 1. Users
		`CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(36) PRIMARY KEY,
			name VARCHAR(150) NOT NULL,
			email VARCHAR(150) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			role VARCHAR(50) NOT NULL,
			module_access TEXT NOT NULL,
			status VARCHAR(20) NOT NULL DEFAULT 'active',
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL
		)`,

		// 2. Board Members
		`CREATE TABLE IF NOT EXISTS board_members (
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
		)`,

		// 3. Work Programs
		`CREATE TABLE IF NOT EXISTS work_programs (
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
		)`,

		// 4. Events
		`CREATE TABLE IF NOT EXISTS events (
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
		)`,

		// 5. Schedules
		`CREATE TABLE IF NOT EXISTS schedules (
			id VARCHAR(36) PRIMARY KEY,
			title VARCHAR(200) NOT NULL,
			pic_id VARCHAR(36) NULL,
			pic_name VARCHAR(150) NOT NULL,
			stage VARCHAR(100) NOT NULL,
			deadline_date VARCHAR(50) NOT NULL,
			is_done BOOLEAN NOT NULL DEFAULT 0,
			status VARCHAR(50) NOT NULL DEFAULT 'Belum Dimulai',
			category VARCHAR(50) NOT NULL DEFAULT 'tugas',
			division VARCHAR(50) NOT NULL,
			period VARCHAR(20) NOT NULL DEFAULT '2026',
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL,
			FOREIGN KEY (pic_id) REFERENCES board_members(id) ON DELETE SET NULL
		)`,

		// 6. Publications
		`CREATE TABLE IF NOT EXISTS publications (
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
		)`,

		// 7. Documentations
		`CREATE TABLE IF NOT EXISTS documentations (
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
		)`,

		// 8. Achievements
		`CREATE TABLE IF NOT EXISTS achievements (
			id VARCHAR(36) PRIMARY KEY,
			unit VARCHAR(100) NOT NULL,
			event_name VARCHAR(200) NOT NULL,
			rank_title VARCHAR(100) NOT NULL,
			event_date VARCHAR(50) NOT NULL,
			result_category VARCHAR(50) NOT NULL DEFAULT 'Partisipasi',
			period VARCHAR(20) NOT NULL DEFAULT '2026',
			created_at TIMESTAMP NOT NULL,
			updated_at TIMESTAMP NOT NULL
		)`,

		// 9. Activity Logs
		`CREATE TABLE IF NOT EXISTS activity_logs (
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
		)`,

		// Indexes
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
		`CREATE INDEX IF NOT EXISTS idx_board_members_div ON board_members(division)`,
		`CREATE INDEX IF NOT EXISTS idx_work_programs_div ON work_programs(division)`,
		`CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)`,
		`CREATE INDEX IF NOT EXISTS idx_schedules_div ON schedules(division)`,
		`CREATE INDEX IF NOT EXISTS idx_documentations_event ON documentations(event_id)`,
		`CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at)`,
	}

	for _, q := range queries {
		trimmed := strings.TrimSpace(q)
		if trimmed == "" {
			continue
		}
		if _, err := db.Exec(trimmed); err != nil {
			return fmt.Errorf("migration error on query [%s]: %w", trimmed[:min(len(trimmed), 40)], err)
		}
	}

	_, _ = db.Exec("INSERT OR IGNORE INTO schema_migrations (version) VALUES ('001_init_schema')")
	log.Println("[Migrations] Database migrations completed successfully.")
	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
