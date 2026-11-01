package main

// Mengekspor seluruh isi humdok.db ke frontend/src/services/seedData.json
// untuk mode demo offline (GitHub Pages).

import (
	"database/sql"
	"encoding/json"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

func main() {
	db, err := sql.Open("sqlite", "humdok.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	tables := []string{"board_members", "work_programs", "events", "schedules", "publications", "documentations", "achievements", "activity_logs"}
	out := map[string][]map[string]interface{}{}

	for _, t := range tables {
		rows, err := db.Query("SELECT * FROM " + t)
		if err != nil {
			log.Fatalf("%s: %v", t, err)
		}
		cols, _ := rows.Columns()
		list := []map[string]interface{}{}
		for rows.Next() {
			vals := make([]interface{}, len(cols))
			ptrs := make([]interface{}, len(cols))
			for i := range vals {
				ptrs[i] = &vals[i]
			}
			if err := rows.Scan(ptrs...); err != nil {
				log.Fatal(err)
			}
			m := map[string]interface{}{}
			for i, c := range cols {
				v := vals[i]
				if b, ok := v.([]byte); ok {
					v = string(b)
				}
				if c == "is_done" {
					if n, ok := v.(int64); ok {
						v = n == 1
					}
				}
				if c == "password_hash" {
					continue
				}
				m[c] = v
			}
			list = append(list, m)
		}
		rows.Close()
		out[t] = list
		log.Printf("%s: %d", t, len(list))
	}

	b, _ := json.MarshalIndent(out, "", "  ")
	if err := os.WriteFile("../frontend/src/services/seedData.json", b, 0644); err != nil {
		log.Fatal(err)
	}
	log.Println("OK -> frontend/src/services/seedData.json")
}
