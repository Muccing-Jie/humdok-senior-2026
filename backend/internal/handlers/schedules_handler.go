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

type ScheduleHandler struct {
	DB *sql.DB
}

func NewScheduleHandler(db *sql.DB) *ScheduleHandler {
	return &ScheduleHandler{DB: db}
}

func (h *ScheduleHandler) List(c *gin.Context) {
	page, pageSize, offset := ParsePagination(c)
	search := strings.TrimSpace(c.Query("search"))
	division := strings.TrimSpace(c.Query("division"))
	month := strings.TrimSpace(c.Query("month")) // e.g. "2026-01"
	category := strings.TrimSpace(c.Query("category"))
	status := strings.TrimSpace(c.Query("status"))
	period := c.DefaultQuery("period", "2026")

	cu := GetContextUser(c)
	if cu.Role == models.RoleHumas {
		division = "Humas"
	} else if cu.Role == models.RolePubdok {
		division = "Pubdok"
	}

	sortField := ValidateSortColumn(c.Query("sort"), []string{"title", "stage", "deadline_date", "is_done", "status", "category", "division", "created_at"}, "deadline_date")
	sortDir := ValidateSortDir(c.Query("dir"))

	whereClauses := []string{"period = ?"}
	args := []interface{}{period}

	if division != "" && division != "Global" {
		whereClauses = append(whereClauses, "division = ?")
		args = append(args, division)
	}
	if month != "" {
		whereClauses = append(whereClauses, "deadline_date LIKE ?")
		args = append(args, month+"%")
	}
	if category != "" {
		whereClauses = append(whereClauses, "category = ?")
		args = append(args, category)
	}
	if status != "" {
		whereClauses = append(whereClauses, "status = ?")
		args = append(args, status)
	}
	if search != "" {
		whereClauses = append(whereClauses, "(title LIKE ? OR pic_name LIKE ? OR stage LIKE ?)")
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	whereSQL := " WHERE " + strings.Join(whereClauses, " AND ")

	var total int64
	countQuery := "SELECT COUNT(*) FROM schedules" + whereSQL
	if err := h.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghitung jadwal kegiatan."})
		return
	}

	dataQuery := fmt.Sprintf(`SELECT id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at
		FROM schedules %s ORDER BY %s %s LIMIT ? OFFSET ?`, whereSQL, sortField, sortDir)

	dataArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(dataQuery, dataArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal mengambil data jadwal."})
		return
	}
	defer rows.Close()

	list := make([]models.Schedule, 0)
	for rows.Next() {
		var sc models.Schedule
		var picID sql.NullString
		if err := rows.Scan(&sc.ID, &sc.Title, &picID, &sc.PicName, &sc.Stage, &sc.DeadlineDate, &sc.IsDone, &sc.Status, &sc.Category, &sc.Division, &sc.Period, &sc.CreatedAt, &sc.UpdatedAt); err == nil {
			if picID.Valid {
				sc.PicID = &picID.String
			}
			list = append(list, sc)
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: list,
		Meta: BuildPaginationMeta(page, pageSize, total),
	})
}

func (h *ScheduleHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var sc models.Schedule
	var picID sql.NullString
	err := h.DB.QueryRow(`SELECT id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at
		FROM schedules WHERE id = ?`, id).Scan(
		&sc.ID, &sc.Title, &picID, &sc.PicName, &sc.Stage, &sc.DeadlineDate, &sc.IsDone, &sc.Status, &sc.Category, &sc.Division, &sc.Period, &sc.CreatedAt, &sc.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Jadwal tidak ditemukan."})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Terjadi kesalahan server."})
		return
	}

	if picID.Valid {
		sc.PicID = &picID.String
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: sc})
}

type ScheduleInput struct {
	Title        string  `json:"title" binding:"required"`
	PicID        *string `json:"pic_id"`
	PicName      string  `json:"pic_name"`
	Stage        string  `json:"stage" binding:"required"`
	DeadlineDate string  `json:"deadline_date" binding:"required"`
	IsDone       bool    `json:"is_done"`
	Status       string  `json:"status"`
	Category     string  `json:"category" binding:"required"`
	Division     string  `json:"division" binding:"required"`
	Period       string  `json:"period"`
}

func (h *ScheduleHandler) Create(c *gin.Context) {
	var input ScheduleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Form jadwal kegiatan tidak lengkap."})
		return
	}

	cu := GetContextUser(c)
	if cu.Role == models.RoleHumas && input.Division != "Humas" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Humas hanya dapat mengelola jadwal Humas."})
		return
	}
	if cu.Role == models.RolePubdok && input.Division != "Pubdok" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Pubdok hanya dapat mengelola jadwal Pubdok."})
		return
	}

	if input.Status == "" {
		if input.IsDone {
			input.Status = "Selesai"
		} else {
			input.Status = "Belum Dimulai"
		}
	}
	if input.Period == "" {
		input.Period = "2026"
	}

	if input.PicID != nil && *input.PicID != "" && input.PicName == "" {
		_ = h.DB.QueryRow("SELECT name FROM board_members WHERE id = ?", *input.PicID).Scan(&input.PicName)
	}

	var picIDParam interface{}
	if input.PicID != nil && *input.PicID != "" {
		picIDParam = *input.PicID
	} else {
		picIDParam = nil
	}

	id := uuid.New().String()
	now := time.Now().UTC()

	_, err := h.DB.Exec(`INSERT INTO schedules (id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, input.Title, picIDParam, input.PicName, input.Stage, input.DeadlineDate, input.IsDone, input.Status, input.Category, input.Division, input.Period, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menyimpan jadwal baru: " + err.Error()})
		return
	}

	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "schedules", id, "CREATE", fmt.Sprintf("Menambahkan jadwal: %s (%s, %s)", input.Title, input.Category, input.DeadlineDate), input.Division)

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    models.Schedule{ID: id, Title: input.Title, PicID: input.PicID, PicName: input.PicName, Stage: input.Stage, DeadlineDate: input.DeadlineDate, IsDone: input.IsDone, Status: input.Status, Category: input.Category, Division: input.Division, Period: input.Period, CreatedAt: now, UpdatedAt: now},
		Message: "Jadwal berhasil ditambahkan.",
	})
}

func (h *ScheduleHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input ScheduleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Format data tidak valid."})
		return
	}

	var existingDiv string
	err := h.DB.QueryRow("SELECT division FROM schedules WHERE id = ?", id).Scan(&existingDiv)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Jadwal tidak ditemukan."})
		return
	}

	cu := GetContextUser(c)
	if cu.Role == models.RoleHumas && existingDiv != "Humas" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Humas hanya dapat mengedit jadwal Humas."})
		return
	}
	if cu.Role == models.RolePubdok && existingDiv != "Pubdok" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Pubdok hanya dapat mengedit jadwal Pubdok."})
		return
	}

	if input.PicID != nil && *input.PicID != "" && input.PicName == "" {
		_ = h.DB.QueryRow("SELECT name FROM board_members WHERE id = ?", *input.PicID).Scan(&input.PicName)
	}

	var picIDParam interface{}
	if input.PicID != nil && *input.PicID != "" {
		picIDParam = *input.PicID
	} else {
		picIDParam = nil
	}

	if input.Period == "" {
		input.Period = "2026"
	}

	now := time.Now().UTC()
	_, err = h.DB.Exec(`UPDATE schedules SET title = ?, pic_id = ?, pic_name = ?, stage = ?, deadline_date = ?, is_done = ?, status = ?, category = ?, division = ?, period = ?, updated_at = ?
		WHERE id = ?`,
		input.Title, picIDParam, input.PicName, input.Stage, input.DeadlineDate, input.IsDone, input.Status, input.Category, input.Division, input.Period, now, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal memperbarui jadwal."})
		return
	}

	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "schedules", id, "UPDATE", fmt.Sprintf("Memperbarui jadwal: %s (%s)", input.Title, input.Status), input.Division)

	c.JSON(http.StatusOK, models.APIResponse{
		Data:    models.Schedule{ID: id, Title: input.Title, PicID: input.PicID, PicName: input.PicName, Stage: input.Stage, DeadlineDate: input.DeadlineDate, IsDone: input.IsDone, Status: input.Status, Category: input.Category, Division: input.Division, Period: input.Period, UpdatedAt: now},
		Message: "Jadwal berhasil diperbarui.",
	})
}

func (h *ScheduleHandler) Toggle(c *gin.Context) {
	id := c.Param("id")

	var isDone bool
	var title, division string
	err := h.DB.QueryRow("SELECT title, is_done, division FROM schedules WHERE id = ?", id).Scan(&title, &isDone, &division)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Jadwal tidak ditemukan."})
		return
	}

	cu := GetContextUser(c)
	if cu.Role == models.RoleHumas && division != "Humas" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Humas hanya dapat mengubah jadwal Humas."})
		return
	}
	if cu.Role == models.RolePubdok && division != "Pubdok" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Pubdok hanya dapat mengubah jadwal Pubdok."})
		return
	}

	newIsDone := !isDone
	var newStatus string
	if newIsDone {
		newStatus = "Selesai"
	} else {
		newStatus = "Dalam Proses"
	}

	now := time.Now().UTC()
	_, err = h.DB.Exec("UPDATE schedules SET is_done = ?, status = ?, updated_at = ? WHERE id = ?", newIsDone, newStatus, now, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal memperbarui status checklist."})
		return
	}

	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "schedules", id, "TOGGLE", fmt.Sprintf("Mengubah status checklist %s: %s", title, newStatus), division)

	c.JSON(http.StatusOK, models.APIResponse{
		Data: gin.H{
			"id":      id,
			"is_done": newIsDone,
			"status":  newStatus,
		},
		Message: fmt.Sprintf("Status agenda diubah menjadi %s.", newStatus),
	})
}

func (h *ScheduleHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var title, division string
	err := h.DB.QueryRow("SELECT title, division FROM schedules WHERE id = ?", id).Scan(&title, &division)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Jadwal tidak ditemukan."})
		return
	}

	cu := GetContextUser(c)
	if cu.Role == models.RoleHumas && division != "Humas" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Humas hanya dapat menghapus jadwal Humas."})
		return
	}
	if cu.Role == models.RolePubdok && division != "Pubdok" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Pubdok hanya dapat menghapus jadwal Pubdok."})
		return
	}

	_, err = h.DB.Exec("DELETE FROM schedules WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghapus jadwal."})
		return
	}

	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "schedules", id, "DELETE", fmt.Sprintf("Menghapus agenda jadwal: %s", title), division)

	c.JSON(http.StatusOK, models.APIResponse{Message: "Jadwal berhasil dihapus."})
}
