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

type DocumentationHandler struct {
	DB *sql.DB
}

func NewDocumentationHandler(db *sql.DB) *DocumentationHandler {
	return &DocumentationHandler{DB: db}
}

func (h *DocumentationHandler) List(c *gin.Context) {
	page, pageSize, offset := ParsePagination(c)
	search := strings.TrimSpace(c.Query("search"))
	fileType := strings.TrimSpace(c.Query("file_type"))
	status := strings.TrimSpace(c.Query("status"))
	eventID := strings.TrimSpace(c.Query("event_id"))
	period := c.DefaultQuery("period", "2026")

	sortField := ValidateSortColumn(c.Query("sort"), []string{"title", "file_type", "doc_date", "status", "created_at"}, "created_at")
	sortDir := ValidateSortDir(c.Query("dir"))

	whereClauses := []string{"d.period = ?"}
	args := []interface{}{period}

	if fileType != "" {
		whereClauses = append(whereClauses, "d.file_type = ?")
		args = append(args, fileType)
	}
	if status != "" {
		whereClauses = append(whereClauses, "d.status = ?")
		args = append(args, status)
	}
	if eventID != "" {
		whereClauses = append(whereClauses, "d.event_id = ?")
		args = append(args, eventID)
	}
	if search != "" {
		whereClauses = append(whereClauses, "(d.title LIKE ? OR e.name LIKE ? OR d.drive_url LIKE ?)")
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	whereSQL := " WHERE " + strings.Join(whereClauses, " AND ")

	var total int64
	countQuery := "SELECT COUNT(*) FROM documentations d LEFT JOIN events e ON d.event_id = e.id" + whereSQL
	if err := h.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghitung data dokumentasi."})
		return
	}

	dataQuery := fmt.Sprintf(`SELECT d.id, d.title, d.event_id, COALESCE(e.name, '') as event_name, d.file_type, d.doc_date, d.drive_url, d.status, d.period, d.created_at, d.updated_at
		FROM documentations d LEFT JOIN events e ON d.event_id = e.id
		%s ORDER BY %s %s LIMIT ? OFFSET ?`, whereSQL, "d."+sortField, sortDir)

	dataArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(dataQuery, dataArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal mengambil data dokumentasi."})
		return
	}
	defer rows.Close()

	list := make([]models.Documentation, 0)
	for rows.Next() {
		var doc models.Documentation
		if err := rows.Scan(&doc.ID, &doc.Title, &doc.EventID, &doc.EventName, &doc.FileType, &doc.DocDate, &doc.DriveURL, &doc.Status, &doc.Period, &doc.CreatedAt, &doc.UpdatedAt); err == nil {
			list = append(list, doc)
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: list,
		Meta: BuildPaginationMeta(page, pageSize, total),
	})
}

func (h *DocumentationHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var doc models.Documentation
	err := h.DB.QueryRow(`SELECT d.id, d.title, d.event_id, COALESCE(e.name, '') as event_name, d.file_type, d.doc_date, d.drive_url, d.status, d.period, d.created_at, d.updated_at
		FROM documentations d LEFT JOIN events e ON d.event_id = e.id
		WHERE d.id = ?`, id).Scan(
		&doc.ID, &doc.Title, &doc.EventID, &doc.EventName, &doc.FileType, &doc.DocDate, &doc.DriveURL, &doc.Status, &doc.Period, &doc.CreatedAt, &doc.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Dokumentasi tidak ditemukan."})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Terjadi kesalahan server."})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: doc})
}

type DocumentationInput struct {
	Title    string `json:"title" binding:"required"`
	EventID  string `json:"event_id" binding:"required"`
	FileType string `json:"file_type" binding:"required"`
	DocDate  string `json:"doc_date" binding:"required"`
	DriveURL string `json:"drive_url" binding:"required"`
	Status   string `json:"status" binding:"required"`
	Period   string `json:"period"`
}

func (h *DocumentationHandler) Create(c *gin.Context) {
	var input DocumentationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Form dokumentasi tidak lengkap."})
		return
	}

	// Verify event exists
	var eventName string
	err := h.DB.QueryRow("SELECT name FROM events WHERE id = ?", input.EventID).Scan(&eventName)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Kegiatan yang dipilih tidak ditemukan dalam database."})
		return
	}

	if input.Period == "" {
		input.Period = "2026"
	}

	id := uuid.New().String()
	now := time.Now().UTC()

	_, err = h.DB.Exec(`INSERT INTO documentations (id, title, event_id, file_type, doc_date, drive_url, status, period, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, input.Title, input.EventID, input.FileType, input.DocDate, input.DriveURL, input.Status, input.Period, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menyimpan dokumentasi: " + err.Error()})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "documentations", id, "CREATE", fmt.Sprintf("Mengunggah dokumentasi: %s (Kegiatan: %s)", input.Title, eventName), "Pubdok")

	c.JSON(http.StatusCreated, models.APIResponse{
		Data: models.Documentation{
			ID: id, Title: input.Title, EventID: input.EventID, EventName: eventName, FileType: input.FileType, DocDate: input.DocDate, DriveURL: input.DriveURL, Status: input.Status, Period: input.Period, CreatedAt: now, UpdatedAt: now,
		},
		Message: "Dokumentasi berhasil disimpan.",
	})
}

func (h *DocumentationHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input DocumentationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Format data tidak valid."})
		return
	}

	var eventName string
	err := h.DB.QueryRow("SELECT name FROM events WHERE id = ?", input.EventID).Scan(&eventName)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Kegiatan yang dipilih tidak valid."})
		return
	}

	if input.Period == "" {
		input.Period = "2026"
	}

	now := time.Now().UTC()
	res, err := h.DB.Exec(`UPDATE documentations SET title = ?, event_id = ?, file_type = ?, doc_date = ?, drive_url = ?, status = ?, period = ?, updated_at = ?
		WHERE id = ?`,
		input.Title, input.EventID, input.FileType, input.DocDate, input.DriveURL, input.Status, input.Period, now, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal memperbarui dokumentasi."})
		return
	}

	rowsAff, _ := res.RowsAffected()
	if rowsAff == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Dokumentasi tidak ditemukan."})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "documentations", id, "UPDATE", fmt.Sprintf("Memperbarui dokumentasi: %s", input.Title), "Pubdok")

	c.JSON(http.StatusOK, models.APIResponse{
		Data: models.Documentation{
			ID: id, Title: input.Title, EventID: input.EventID, EventName: eventName, FileType: input.FileType, DocDate: input.DocDate, DriveURL: input.DriveURL, Status: input.Status, Period: input.Period, UpdatedAt: now,
		},
		Message: "Dokumentasi berhasil diperbarui.",
	})
}

func (h *DocumentationHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var title string
	err := h.DB.QueryRow("SELECT title FROM documentations WHERE id = ?", id).Scan(&title)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Dokumentasi tidak ditemukan."})
		return
	}

	_, err = h.DB.Exec("DELETE FROM documentations WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghapus dokumentasi."})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "documentations", id, "DELETE", fmt.Sprintf("Menghapus dokumentasi: %s", title), "Pubdok")

	c.JSON(http.StatusOK, models.APIResponse{Message: "Dokumentasi berhasil dihapus."})
}
