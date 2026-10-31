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

type AchievementHandler struct {
	DB *sql.DB
}

func NewAchievementHandler(db *sql.DB) *AchievementHandler {
	return &AchievementHandler{DB: db}
}

func (h *AchievementHandler) List(c *gin.Context) {
	page, pageSize, offset := ParsePagination(c)
	search := strings.TrimSpace(c.Query("search"))
	resultCategory := strings.TrimSpace(c.Query("result_category"))
	unit := strings.TrimSpace(c.Query("unit"))
	period := c.DefaultQuery("period", "2026")

	sortField := ValidateSortColumn(c.Query("sort"), []string{"event_name", "unit", "rank_title", "event_date", "result_category", "created_at"}, "created_at")
	sortDir := ValidateSortDir(c.Query("dir"))

	whereClauses := []string{"period = ?"}
	args := []interface{}{period}

	if resultCategory != "" {
		whereClauses = append(whereClauses, "result_category = ?")
		args = append(args, resultCategory)
	}
	if unit != "" {
		whereClauses = append(whereClauses, "unit = ?")
		args = append(args, unit)
	}
	if search != "" {
		whereClauses = append(whereClauses, "(event_name LIKE ? OR unit LIKE ? OR rank_title LIKE ?)")
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	whereSQL := " WHERE " + strings.Join(whereClauses, " AND ")

	var total int64
	countQuery := "SELECT COUNT(*) FROM achievements" + whereSQL
	if err := h.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghitung data prestasi."})
		return
	}

	dataQuery := fmt.Sprintf(`SELECT id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at
		FROM achievements %s ORDER BY %s %s LIMIT ? OFFSET ?`, whereSQL, sortField, sortDir)

	dataArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(dataQuery, dataArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal mengambil data prestasi."})
		return
	}
	defer rows.Close()

	list := make([]models.Achievement, 0)
	for rows.Next() {
		var a models.Achievement
		if err := rows.Scan(&a.ID, &a.Unit, &a.EventName, &a.RankTitle, &a.EventDate, &a.ResultCategory, &a.Period, &a.CreatedAt, &a.UpdatedAt); err == nil {
			list = append(list, a)
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: list,
		Meta: BuildPaginationMeta(page, pageSize, total),
	})
}

func (h *AchievementHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var a models.Achievement
	err := h.DB.QueryRow(`SELECT id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at
		FROM achievements WHERE id = ?`, id).Scan(
		&a.ID, &a.Unit, &a.EventName, &a.RankTitle, &a.EventDate, &a.ResultCategory, &a.Period, &a.CreatedAt, &a.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Prestasi tidak ditemukan."})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Terjadi kesalahan server."})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: a})
}

type AchievementInput struct {
	Unit           string `json:"unit" binding:"required"`
	EventName      string `json:"event_name" binding:"required"`
	RankTitle      string `json:"rank_title" binding:"required"`
	EventDate      string `json:"event_date" binding:"required"`
	ResultCategory string `json:"result_category" binding:"required"`
	Period         string `json:"period"`
}

func (h *AchievementHandler) Create(c *gin.Context) {
	var input AchievementInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Form database prestasi tidak lengkap."})
		return
	}

	if input.Period == "" {
		input.Period = "2026"
	}

	id := uuid.New().String()
	now := time.Now().UTC()

	_, err := h.DB.Exec(`INSERT INTO achievements (id, unit, event_name, rank_title, event_date, result_category, period, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, input.Unit, input.EventName, input.RankTitle, input.EventDate, input.ResultCategory, input.Period, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menyimpan data prestasi: " + err.Error()})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "achievements", id, "CREATE", fmt.Sprintf("Menambahkan prestasi: %s - %s (%s)", input.EventName, input.RankTitle, input.Unit), "Pubdok")

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    models.Achievement{ID: id, Unit: input.Unit, EventName: input.EventName, RankTitle: input.RankTitle, EventDate: input.EventDate, ResultCategory: input.ResultCategory, Period: input.Period, CreatedAt: now, UpdatedAt: now},
		Message: "Data prestasi berhasil disimpan.",
	})
}

func (h *AchievementHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input AchievementInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Format data tidak valid."})
		return
	}

	if input.Period == "" {
		input.Period = "2026"
	}

	now := time.Now().UTC()
	res, err := h.DB.Exec(`UPDATE achievements SET unit = ?, event_name = ?, rank_title = ?, event_date = ?, result_category = ?, period = ?, updated_at = ?
		WHERE id = ?`,
		input.Unit, input.EventName, input.RankTitle, input.EventDate, input.ResultCategory, input.Period, now, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal memperbarui data prestasi."})
		return
	}

	rowsAff, _ := res.RowsAffected()
	if rowsAff == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Prestasi tidak ditemukan."})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "achievements", id, "UPDATE", fmt.Sprintf("Memperbarui prestasi: %s (%s)", input.EventName, input.RankTitle), "Pubdok")

	c.JSON(http.StatusOK, models.APIResponse{
		Data:    models.Achievement{ID: id, Unit: input.Unit, EventName: input.EventName, RankTitle: input.RankTitle, EventDate: input.EventDate, ResultCategory: input.ResultCategory, Period: input.Period, UpdatedAt: now},
		Message: "Data prestasi berhasil diperbarui.",
	})
}

func (h *AchievementHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var eventName, rankTitle string
	err := h.DB.QueryRow("SELECT event_name, rank_title FROM achievements WHERE id = ?", id).Scan(&eventName, &rankTitle)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Prestasi tidak ditemukan."})
		return
	}

	_, err = h.DB.Exec("DELETE FROM achievements WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghapus prestasi."})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "achievements", id, "DELETE", fmt.Sprintf("Menghapus data prestasi: %s (%s)", eventName, rankTitle), "Pubdok")

	c.JSON(http.StatusOK, models.APIResponse{Message: "Data prestasi berhasil dihapus."})
}
