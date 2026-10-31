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

type WorkProgramHandler struct {
	DB *sql.DB
}

func NewWorkProgramHandler(db *sql.DB) *WorkProgramHandler {
	return &WorkProgramHandler{DB: db}
}

func (h *WorkProgramHandler) List(c *gin.Context) {
	page, pageSize, offset := ParsePagination(c)
	search := strings.TrimSpace(c.Query("search"))
	division := strings.TrimSpace(c.Query("division"))
	status := strings.TrimSpace(c.Query("status"))
	period := c.DefaultQuery("period", "2026")

	// Check user role: If user is Humas or Pubdok and not Super Admin, lock list to their division
	cu := GetContextUser(c)
	if cu.Role == models.RoleHumas {
		division = "Humas"
	} else if cu.Role == models.RolePubdok {
		division = "Pubdok"
	}

	sortField := ValidateSortColumn(c.Query("sort"), []string{"name", "progress_pct", "status", "division", "created_at"}, "created_at")
	sortDir := ValidateSortDir(c.Query("dir"))

	whereClauses := []string{"period = ?"}
	args := []interface{}{period}

	if division != "" && division != "Global" {
		whereClauses = append(whereClauses, "division = ?")
		args = append(args, division)
	}
	if status != "" {
		whereClauses = append(whereClauses, "status = ?")
		args = append(args, status)
	}
	if search != "" {
		whereClauses = append(whereClauses, "(name LIKE ? OR pic_name LIKE ? OR target_text LIKE ?)")
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	whereSQL := " WHERE " + strings.Join(whereClauses, " AND ")

	var total int64
	countQuery := "SELECT COUNT(*) FROM work_programs" + whereSQL
	if err := h.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghitung program kerja."})
		return
	}

	dataQuery := fmt.Sprintf(`SELECT id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at
		FROM work_programs %s ORDER BY %s %s LIMIT ? OFFSET ?`, whereSQL, sortField, sortDir)

	dataArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(dataQuery, dataArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal mengambil data program kerja."})
		return
	}
	defer rows.Close()

	list := make([]models.WorkProgram, 0)
	for rows.Next() {
		var wp models.WorkProgram
		var picID sql.NullString
		if err := rows.Scan(&wp.ID, &wp.Name, &picID, &wp.PicName, &wp.TargetText, &wp.ProgressPct, &wp.Status, &wp.Division, &wp.Period, &wp.CreatedAt, &wp.UpdatedAt); err == nil {
			if picID.Valid {
				wp.PicID = &picID.String
			}
			list = append(list, wp)
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: list,
		Meta: BuildPaginationMeta(page, pageSize, total),
	})
}

func (h *WorkProgramHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var wp models.WorkProgram
	var picID sql.NullString
	err := h.DB.QueryRow(`SELECT id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at
		FROM work_programs WHERE id = ?`, id).Scan(
		&wp.ID, &wp.Name, &picID, &wp.PicName, &wp.TargetText, &wp.ProgressPct, &wp.Status, &wp.Division, &wp.Period, &wp.CreatedAt, &wp.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Data program kerja tidak ditemukan."})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Terjadi kesalahan server."})
		return
	}

	if picID.Valid {
		wp.PicID = &picID.String
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: wp})
}

type WorkProgramInput struct {
	Name        string  `json:"name" binding:"required"`
	PicID       *string `json:"pic_id"`
	PicName     string  `json:"pic_name"`
	TargetText  string  `json:"target_text" binding:"required"`
	ProgressPct int     `json:"progress_pct"`
	Status      string  `json:"status"`
	Division    string  `json:"division" binding:"required"`
	Period      string  `json:"period"`
}

func (h *WorkProgramHandler) Create(c *gin.Context) {
	var input WorkProgramInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Form program kerja tidak lengkap."})
		return
	}

	cu := GetContextUser(c)
	if cu.Role == models.RoleHumas && input.Division != "Humas" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Humas hanya dapat menambah proker untuk Humas."})
		return
	}
	if cu.Role == models.RolePubdok && input.Division != "Pubdok" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Pubdok hanya dapat menambah proker untuk Pubdok."})
		return
	}

	if input.ProgressPct < 0 {
		input.ProgressPct = 0
	}
	if input.ProgressPct > 100 {
		input.ProgressPct = 100
	}
	if input.Status == "" {
		if input.ProgressPct == 100 {
			input.Status = "Terlaksana"
		} else if input.ProgressPct > 0 {
			input.Status = "Berjalan"
		} else {
			input.Status = "Belum Terlaksana"
		}
	}
	if input.Period == "" {
		input.Period = "2026"
	}

	// Lookup PIC name from board members if PIC ID given
	if input.PicID != nil && *input.PicID != "" && input.PicName == "" {
		_ = h.DB.QueryRow("SELECT name FROM board_members WHERE id = ?", *input.PicID).Scan(&input.PicName)
	}

	id := uuid.New().String()
	now := time.Now().UTC()

	var picIDParam interface{}
	if input.PicID != nil && *input.PicID != "" {
		picIDParam = *input.PicID
	} else {
		picIDParam = nil
	}

	_, err := h.DB.Exec(`INSERT INTO work_programs (id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, input.Name, picIDParam, input.PicName, input.TargetText, input.ProgressPct, input.Status, input.Division, input.Period, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menyimpan program kerja: " + err.Error()})
		return
	}

	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "work_programs", id, "CREATE", fmt.Sprintf("Menambahkan Program Kerja: %s (%s, %d%%)", input.Name, input.Division, input.ProgressPct), input.Division)

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    models.WorkProgram{ID: id, Name: input.Name, PicID: input.PicID, PicName: input.PicName, TargetText: input.TargetText, ProgressPct: input.ProgressPct, Status: input.Status, Division: input.Division, Period: input.Period, CreatedAt: now, UpdatedAt: now},
		Message: "Program kerja berhasil disimpan.",
	})
}

func (h *WorkProgramHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input WorkProgramInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Format data pembaruan tidak valid."})
		return
	}

	// Check existing record division
	var existingDiv string
	err := h.DB.QueryRow("SELECT division FROM work_programs WHERE id = ?", id).Scan(&existingDiv)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Program kerja tidak ditemukan."})
		return
	}

	cu := GetContextUser(c)
	if cu.Role == models.RoleHumas && existingDiv != "Humas" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Humas hanya dapat mengedit proker Humas."})
		return
	}
	if cu.Role == models.RolePubdok && existingDiv != "Pubdok" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Pubdok hanya dapat mengedit proker Pubdok."})
		return
	}

	if input.ProgressPct < 0 {
		input.ProgressPct = 0
	}
	if input.ProgressPct > 100 {
		input.ProgressPct = 100
	}
	if input.Status == "" {
		if input.ProgressPct == 100 {
			input.Status = "Terlaksana"
		} else if input.ProgressPct > 0 {
			input.Status = "Berjalan"
		} else {
			input.Status = "Belum Terlaksana"
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

	now := time.Now().UTC()
	_, err = h.DB.Exec(`UPDATE work_programs SET name = ?, pic_id = ?, pic_name = ?, target_text = ?, progress_pct = ?, status = ?, division = ?, period = ?, updated_at = ?
		WHERE id = ?`,
		input.Name, picIDParam, input.PicName, input.TargetText, input.ProgressPct, input.Status, input.Division, input.Period, now, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal memperbarui program kerja."})
		return
	}

	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "work_programs", id, "UPDATE", fmt.Sprintf("Memperbarui Program Kerja: %s (Progres: %d%%)", input.Name, input.ProgressPct), input.Division)

	c.JSON(http.StatusOK, models.APIResponse{
		Data:    models.WorkProgram{ID: id, Name: input.Name, PicID: input.PicID, PicName: input.PicName, TargetText: input.TargetText, ProgressPct: input.ProgressPct, Status: input.Status, Division: input.Division, Period: input.Period, UpdatedAt: now},
		Message: "Program kerja berhasil diperbarui.",
	})
}

func (h *WorkProgramHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var name, division string
	err := h.DB.QueryRow("SELECT name, division FROM work_programs WHERE id = ?", id).Scan(&name, &division)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Program kerja tidak ditemukan."})
		return
	}

	cu := GetContextUser(c)
	if cu.Role == models.RoleHumas && division != "Humas" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Humas hanya dapat menghapus proker Humas."})
		return
	}
	if cu.Role == models.RolePubdok && division != "Pubdok" {
		c.JSON(http.StatusForbidden, models.APIResponse{Error: "Divisi Pubdok hanya dapat menghapus proker Pubdok."})
		return
	}

	_, err = h.DB.Exec("DELETE FROM work_programs WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghapus program kerja."})
		return
	}

	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "work_programs", id, "DELETE", fmt.Sprintf("Menghapus Program Kerja: %s", name), division)

	c.JSON(http.StatusOK, models.APIResponse{Message: "Program kerja berhasil dihapus."})
}
