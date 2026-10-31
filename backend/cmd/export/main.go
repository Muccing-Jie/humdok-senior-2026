package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	_ "modernc.org/sqlite"
)

func main() {
	db, err := sql.Open("sqlite", "humdok.db")
	if err != nil {
		log.Fatalf("Failed to open DB: %v", err)
	}
	defer db.Close()

	tables := []string{
		"users",
		"board_members",
		"work_programs",
		"events",
		"schedules",
		"publications",
		"documentations",
		"achievements",
		"activity_logs",
	}

	var sb strings.Builder
	sb.WriteString("-- ========================================================================\n")
	sb.WriteString("-- HUMAS & PUBDOK MANAGEMENT — UKM SENIOR PNUP (Periode 2026)\n")
	sb.WriteString("-- Complete Database Dump & Seed SQL (Relational Schema & Authentic Dataset)\n")
	sb.WriteString("-- ========================================================================\n\n")

	// Read schema DDL
	schemaBytes, err := os.ReadFile("migrations/001_init_schema.sql")
	if err == nil {
		sb.WriteString("-- ------------------------------------------------------------------------\n")
		sb.WriteString("-- 1. Table Definitions (DDL)\n")
		sb.WriteString("-- ------------------------------------------------------------------------\n")
		sb.WriteString(string(schemaBytes))
		sb.WriteString("\n\n")
	}

	sb.WriteString("-- ------------------------------------------------------------------------\n")
	sb.WriteString("-- 2. Seed Data Records (DML)\n")
	sb.WriteString("-- ------------------------------------------------------------------------\n\n")

	for _, table := range tables {
		rows, err := db.Query(fmt.Sprintf("SELECT * FROM %s", table))
		if err != nil {
			log.Printf("Warning: error querying %s: %v", table, err)
			continue
		}

		cols, _ := rows.Columns()
		count := 0

		sb.WriteString(fmt.Sprintf("-- Table: %s\n", table))

		for rows.Next() {
			vals := make([]interface{}, len(cols))
			valPtrs := make([]interface{}, len(cols))
			for i := range vals {
				valPtrs[i] = &vals[i]
			}

			if err := rows.Scan(valPtrs...); err != nil {
				continue
			}

			var valStrs []string
			for _, v := range vals {
				if v == nil {
					valStrs = append(valStrs, "NULL")
				} else {
					switch val := v.(type) {
					case []byte:
						escaped := strings.ReplaceAll(string(val), "'", "''")
						valStrs = append(valStrs, fmt.Sprintf("'%s'", escaped))
					case string:
						escaped := strings.ReplaceAll(val, "'", "''")
						valStrs = append(valStrs, fmt.Sprintf("'%s'", escaped))
					case int64, int, int32:
						valStrs = append(valStrs, fmt.Sprintf("%v", val))
					case float64, float32:
						valStrs = append(valStrs, fmt.Sprintf("%v", val))
					case bool:
						if val {
							valStrs = append(valStrs, "1")
						} else {
							valStrs = append(valStrs, "0")
						}
					default:
						escaped := strings.ReplaceAll(fmt.Sprintf("%v", val), "'", "''")
						valStrs = append(valStrs, fmt.Sprintf("'%s'", escaped))
					}
				}
			}

			sb.WriteString(fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s);\n",
				table,
				strings.Join(cols, ", "),
				strings.Join(valStrs, ", "),
			))
			count++
		}
		rows.Close()
		sb.WriteString(fmt.Sprintf("-- Total records in %s: %d\n\n", table, count))
	}

	if err := os.WriteFile("database_dump.sql", []byte(sb.String()), 0644); err != nil {
		log.Fatalf("Failed to write database_dump.sql: %v", err)
	}

	log.Println("Successfully generated backend/database_dump.sql!")
}
