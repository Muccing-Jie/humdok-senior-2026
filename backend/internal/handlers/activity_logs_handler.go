package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"humdok-backend/internal/models"

	"github.com/gin-gonic/gin"
)

type ActivityLogHandler struct {
	DB *sql.DB
}

func NewActivityLogHandler(db *sql.DB) *ActivityLogHandler {
	return &ActivityLogHandler{DB: db}
}

func (h *ActivityLogHandler) List(c *gin.Context) {
	page, pageSize, offset := ParsePagination(c)
	search := strings.TrimSpace(c.Query("search"))
	division := strings.TrimSpace(c.Query("division"))
	tableName := strings.TrimSpace(c.Query("table_name"))
	actionType := strings.TrimSpace(c.Query("action_type"))

	cu := GetContextUser(c)
	// Role scoping
	if cu.Role == models.RoleHumas {
		division = "Humas"
	} else if cu.Role == models.RolePubdok {
		division = "Pubdok"
	}

	whereClauses := []string{"1=1"}
	args := []interface{}{}

	if division != "" && division != "Global" {
		whereClauses = append(whereClauses, "(division = ? OR division = 'Global')")
		args = append(args, division)
	}
	if tableName != "" {
		whereClauses = append(whereClauses, "table_name = ?")
		args = append(args, tableName)
	}
	if actionType != "" {
		whereClauses = append(whereClauses, "action_type = ?")
		args = append(args, actionType)
	}
	if search != "" {
		whereClauses = append(whereClauses, "(user_name LIKE ? OR description LIKE ? OR table_name LIKE ?)")
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	whereSQL := " WHERE " + strings.Join(whereClauses, " AND ")

	var total int64
	countQuery := "SELECT COUNT(*) FROM activity_logs" + whereSQL
	if err := h.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghitung log aktivitas."})
		return
	}

	dataQuery := fmt.Sprintf(`SELECT id, actor_user_id, user_name, table_name, data_id, action_type, description, division, created_at
		FROM activity_logs %s ORDER BY created_at DESC LIMIT ? OFFSET ?`, whereSQL)

	dataArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(dataQuery, dataArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal mengambil riwayat aktivitas."})
		return
	}
	defer rows.Close()

	list := make([]models.ActivityLog, 0)
	for rows.Next() {
		var l models.ActivityLog
		var actorID sql.NullString
		if err := rows.Scan(&l.ID, &actorID, &l.UserName, &l.TableName, &l.DataID, &l.ActionType, &l.Description, &l.Division, &l.CreatedAt); err == nil {
			if actorID.Valid {
				l.ActorUserID = &actorID.String
			}
			list = append(list, l)
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: list,
		Meta: BuildPaginationMeta(page, pageSize, total),
	})
}
