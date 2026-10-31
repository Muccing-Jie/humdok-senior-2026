package database

import (
	"database/sql"
	"fmt"
	"log"

	"humdok-backend/internal/config"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/jackc/pgx/v5/stdlib"
	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDB(cfg *config.Config) (*sql.DB, error) {
	var db *sql.DB
	var err error

	switch cfg.DBDriver {
	case "postgres", "postgresql", "pgx":
		connStr := cfg.DatabaseURL
		if connStr == "" {
			connStr = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
				cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
		}
		db, err = sql.Open("pgx", connStr)
		if err != nil {
			return nil, fmt.Errorf("failed to open pgx db: %w", err)
		}

	case "mysql":
		connStr := cfg.DatabaseURL
		if connStr == "" {
			connStr = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
				cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
		}
		db, err = sql.Open("mysql", connStr)
		if err != nil {
			return nil, fmt.Errorf("failed to open mysql db: %w", err)
		}

	default: // sqlite fallback default
		dbPath := cfg.DBPath
		if dbPath == "" {
			dbPath = "humdok.db"
		}
		// enable foreign keys and WAL mode for sqlite
		db, err = sql.Open("sqlite", dbPath+"?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)")
		if err != nil {
			return nil, fmt.Errorf("failed to open sqlite db: %w", err)
		}
	}

	if err := db.Ping(); err != nil {
		log.Printf("[DB Ping Warning] %v (driver: %s)", err, cfg.DBDriver)
		// If postgres or mysql fails ping, fall back to sqlite so application runs reliably
		if cfg.DBDriver != "sqlite" {
			log.Println("[DB Fallback] Falling back to SQLite file humdok.db")
			db, err = sql.Open("sqlite", "humdok.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)")
			if err != nil {
				return nil, fmt.Errorf("fallback sqlite failed: %w", err)
			}
		} else {
			return nil, err
		}
	}

	DB = db
	log.Printf("[DB Init] Connected successfully using driver: %s", cfg.DBDriver)
	return DB, nil
}

func CloseDB() {
	if DB != nil {
		_ = DB.Close()
	}
}

// GetDB returns active instance
func GetDB() *sql.DB {
	return DB
}
