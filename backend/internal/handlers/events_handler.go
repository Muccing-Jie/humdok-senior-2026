package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	"humdok-backend/internal/middleware"
	"humdok-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type EventHandler struct {
	DB *sql.DB
}

func NewEventHandler(db *sql.DB) *EventHandler {
	return &EventHandler{DB: db}
}

func (h *EventHandler) List(c *gin.Context) {
	page, pageSize, offset := ParsePagination(c)
	search := strings.TrimSpace(c.Query("search"))
	status := strings.TrimSpace(c.Query("status"))
	unit := strings.TrimSpace(c.Query("unit"))
	eventType := strings.TrimSpace(c.Query("event_type"))
	period := c.DefaultQuery("period", "2026")

	sortField := ValidateSortColumn(c.Query("sort"), []string{"name", "unit", "event_type", "event_date", "contact", "status", "created_at"}, "created_at")
	sortDir := ValidateSortDir(c.Query("dir"))

	whereClauses := []string{"e.period = ?"}
	args := []interface{}{period}

	if status != "" {
		whereClauses = append(whereClauses, "e.status = ?")
		args = append(args, status)
	}
	if unit != "" {
		whereClauses = append(whereClauses, "e.unit = ?")
		args = append(args, unit)
	}
	if eventType != "" {
		whereClauses = append(whereClauses, "e.event_type = ?")
		args = append(args, eventType)
	}
	if search != "" {
		whereClauses = append(whereClauses, "(e.name LIKE ? OR e.unit LIKE ? OR e.event_type LIKE ? OR e.contact LIKE ?)")
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	whereSQL := " WHERE " + strings.Join(whereClauses, " AND ")

	var total int64
	countQuery := "SELECT COUNT(*) FROM events e" + whereSQL
	if err := h.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghitung data kegiatan."})
		return
	}

	dataQuery := fmt.Sprintf(`SELECT e.id, e.name, e.unit, e.event_type, e.event_date, e.contact, e.status, e.period, e.created_at, e.updated_at,
		(SELECT COUNT(*) FROM documentations d WHERE d.event_id = e.id) as doc_count
		FROM events e %s ORDER BY %s %s LIMIT ? OFFSET ?`, whereSQL, "e."+sortField, sortDir)

	dataArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(dataQuery, dataArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal mengambil data kegiatan."})
		return
	}
	defer rows.Close()

	list := make([]models.Event, 0)
	for rows.Next() {
		var ev models.Event
		var docCount int
		if err := rows.Scan(&ev.ID, &ev.Name, &ev.Unit, &ev.EventType, &ev.EventDate, &ev.Contact, &ev.Status, &ev.Period, &ev.CreatedAt, &ev.UpdatedAt, &docCount); err == nil {
			ev.DocumentationCount = docCount
			ev.HasDocumentation = docCount > 0
			list = append(list, ev)
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: list,
		Meta: BuildPaginationMeta(page, pageSize, total),
	})
}

func (h *EventHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var ev models.Event
	var docCount int
	err := h.DB.QueryRow(`SELECT e.id, e.name, e.unit, e.event_type, e.event_date, e.contact, e.status, e.period, e.created_at, e.updated_at,
		(SELECT COUNT(*) FROM documentations d WHERE d.event_id = e.id) as doc_count
		FROM events e WHERE e.id = ?`, id).Scan(
		&ev.ID, &ev.Name, &ev.Unit, &ev.EventType, &ev.EventDate, &ev.Contact, &ev.Status, &ev.Period, &ev.CreatedAt, &ev.UpdatedAt, &docCount,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Data kegiatan tidak ditemukan."})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Terjadi kesalahan server."})
		return
	}

	ev.DocumentationCount = docCount
	ev.HasDocumentation = docCount > 0

	c.JSON(http.StatusOK, models.APIResponse{Data: ev})
}

type EventInput struct {
	Name      string `json:"name" binding:"required"`
	Unit      string `json:"unit" binding:"required"`
	EventType string `json:"event_type" binding:"required"`
	EventDate string `json:"event_date" binding:"required"`
	Contact   string `json:"contact" binding:"required"`
	Status    string `json:"status" binding:"required"`
	Period    string `json:"period"`
}

func (h *EventHandler) Create(c *gin.Context) {
	var input EventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Form kegiatan tidak lengkap."})
		return
	}

	if input.Period == "" {
		input.Period = "2026"
	}

	id := uuid.New().String()
	now := time.Now().UTC()

	_, err := h.DB.Exec(`INSERT INTO events (id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, input.Name, input.Unit, input.EventType, input.EventDate, input.Contact, input.Status, input.Period, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menyimpan kegiatan baru: " + err.Error()})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "events", id, "CREATE", fmt.Sprintf("Menambahkan kegiatan: %s (Unit: %s, %s)", input.Name, input.Unit, input.Status), "Humas")

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    models.Event{ID: id, Name: input.Name, Unit: input.Unit, EventType: input.EventType, EventDate: input.EventDate, Contact: input.Contact, Status: input.Status, Period: input.Period, CreatedAt: now, UpdatedAt: now},
		Message: "Kegiatan berhasil disimpan.",
	})
}

func (h *EventHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input EventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Format data tidak valid."})
		return
	}

	if input.Period == "" {
		input.Period = "2026"
	}

	now := time.Now().UTC()
	res, err := h.DB.Exec(`UPDATE events SET name = ?, unit = ?, event_type = ?, event_date = ?, contact = ?, status = ?, period = ?, updated_at = ?
		WHERE id = ?`,
		input.Name, input.Unit, input.EventType, input.EventDate, input.Contact, input.Status, input.Period, now, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal memperbarui kegiatan."})
		return
	}

	rowsAff, _ := res.RowsAffected()
	if rowsAff == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Data kegiatan tidak ditemukan."})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "events", id, "UPDATE", fmt.Sprintf("Memperbarui kegiatan: %s (%s)", input.Name, input.Status), "Humas")

	c.JSON(http.StatusOK, models.APIResponse{
		Data:    models.Event{ID: id, Name: input.Name, Unit: input.Unit, EventType: input.EventType, EventDate: input.EventDate, Contact: input.Contact, Status: input.Status, Period: input.Period, UpdatedAt: now},
		Message: "Kegiatan berhasil diperbarui.",
	})
}

func (h *EventHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// Check if any documentation references this event
	var docCount int
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM documentations WHERE event_id = ?", id).Scan(&docCount)
	if docCount > 0 {
		c.JSON(http.StatusConflict, models.APIResponse{
			Error: fmt.Sprintf("Kegiatan tidak dapat dihapus karena masih memiliki %d arsip dokumentasi terkait dari Divisi Pubdok. Hapus dokumentasi terlebih dahulu.", docCount),
		})
		return
	}

	var name string
	err := h.DB.QueryRow("SELECT name FROM events WHERE id = ?", id).Scan(&name)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Data kegiatan tidak ditemukan."})
		return
	}

	_, err = h.DB.Exec("DELETE FROM events WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghapus kegiatan: " + err.Error()})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "events", id, "DELETE", fmt.Sprintf("Menghapus kegiatan: %s", name), "Humas")

	c.JSON(http.StatusOK, models.APIResponse{Message: "Kegiatan berhasil dihapus."})
}
