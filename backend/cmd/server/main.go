package main

import (
	"log"

	"humdok-backend/internal/config"
	"humdok-backend/internal/database"
	"humdok-backend/internal/routes"
)

func main() {
	log.Println("==================================================")
	log.Println(" HUMAS & PUBDOK MANAGEMENT — UKM SENIOR PNUP")
	log.Println(" Periode Kepengurusan 2026")
	log.Println(" Decoupled Client-Server Backend (Go + Gin)")
	log.Println("==================================================")

	cfg := config.LoadConfig()

	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("[Fatal] Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

	// Run Migrations
	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("[Fatal] Migration failed: %v", err)
	}

	// Seed Initial Data (idempotent)
	if err := database.SeedDatabase(db, cfg); err != nil {
		log.Fatalf("[Fatal] Seeding failed: %v", err)
	}

	// Setup Routes
	r := routes.SetupRouter(db, cfg)

	log.Printf("[Server] Server starting on http://localhost:%s\n", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("[Fatal] Server failed to run: %v", err)
	}
}
