package middleware

import (
	"database/sql"
	"log"
	"time"

	"github.com/google/uuid"
)

// LogAuditEntry inserts an activity log record into the database
func LogAuditEntry(db *sql.DB, actorID *string, userName, tableName, dataID, actionType, description, division string) error {
	id := uuid.New().String()
	now := time.Now().UTC()

	if division == "" {
		division = "Global"
	}
	if userName == "" {
		userName = "System"
	}

	query := `INSERT INTO activity_logs (id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := db.Exec(query, id, actorID, userName, tableName, dataID, actionType, description, division, now)
	if err != nil {
		log.Printf("[Audit Error] Failed to log activity (%s on %s): %v", actionType, tableName, err)
		return err
	}

	return nil
}
