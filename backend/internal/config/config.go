package config

import (
	"os"
)

type Config struct {
	Port           string
	DBDriver       string
	DBUser         string
	DBPassword     string
	DBHost         string
	DBPort         string
	DBName         string
	DBPath         string
	DatabaseURL    string
	JWTSecret      string
	CorsOrigin     string
	Period         string
	AdminEmail     string
	AdminPassword  string
	HumasEmail     string
	HumasPassword  string
	PubdokEmail    string
	PubdokPassword string
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func LoadConfig() *Config {
	return &Config{
		Port:           getEnv("PORT", "8080"),
		DBDriver:       getEnv("DB_DRIVER", "sqlite"),
		DBUser:         getEnv("DB_USER", "root"),
		DBPassword:     getEnv("DB_PASSWORD", ""),
		DBHost:         getEnv("DB_HOST", "127.0.0.1"),
		DBPort:         getEnv("DB_PORT", "3306"),
		DBName:         getEnv("DB_NAME", "humdok_management"),
		DBPath:         getEnv("DB_PATH", "humdok.db"),
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		JWTSecret:      getEnv("JWT_SECRET", "humdok-management-secret-key-senior-2026"),
		CorsOrigin:     getEnv("CORS_ORIGIN", "http://localhost:3000"),
		Period:         getEnv("PERIOD", "2026"),
		AdminEmail:     getEnv("ADMIN_EMAIL", "admin@humdok.local"),
		AdminPassword:  getEnv("ADMIN_PASSWORD", "admin123"),
		HumasEmail:     getEnv("HUMAS_EMAIL", "div_humas@humdok.local"),
		HumasPassword:  getEnv("HUMAS_PASSWORD", "humas123"),
		PubdokEmail:    getEnv("PUBDOK_EMAIL", "div_pubdok@humdok.local"),
		PubdokPassword: getEnv("PUBDOK_PASSWORD", "pubdok123"),
	}
}
