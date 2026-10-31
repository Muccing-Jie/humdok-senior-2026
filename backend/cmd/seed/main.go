package main

import (
	"log"

	"humdok-backend/internal/config"
	"humdok-backend/internal/database"
)

func main() {
	log.Println("[Seeder CLI] Starting independent database seeder...")

	cfg := config.LoadConfig()

	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("[Fatal] Failed to connect database: %v", err)
	}
	defer database.CloseDB()

	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("[Fatal] Migration failed: %v", err)
	}

	if err := database.SeedDatabase(db, cfg); err != nil {
		log.Fatalf("[Fatal] Seeding failed: %v", err)
	}

	log.Println("[Seeder CLI] Database seeded successfully!")
}
