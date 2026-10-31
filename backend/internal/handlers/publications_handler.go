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

type PublicationHandler struct {
	DB *sql.DB
}

func NewPublicationHandler(db *sql.DB) *PublicationHandler {
	return &PublicationHandler{DB: db}
}

func (h *PublicationHandler) List(c *gin.Context) {
	page, pageSize, offset := ParsePagination(c)
	search := strings.TrimSpace(c.Query("search"))
	status := strings.TrimSpace(c.Query("status"))
	platform := strings.TrimSpace(c.Query("platform"))
	period := c.DefaultQuery("period", "2026")

	sortField := ValidateSortColumn(c.Query("sort"), []string{"title", "platform", "publish_date", "status", "views", "likes", "created_at"}, "created_at")
	sortDir := ValidateSortDir(c.Query("dir"))

	whereClauses := []string{"period = ?"}
	args := []interface{}{period}

	if status != "" {
		whereClauses = append(whereClauses, "status = ?")
		args = append(args, status)
	}
	if platform != "" {
		whereClauses = append(whereClauses, "platform = ?")
		args = append(args, platform)
	}
	if search != "" {
		whereClauses = append(whereClauses, "(title LIKE ? OR platform LIKE ? OR post_url LIKE ?)")
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	whereSQL := " WHERE " + strings.Join(whereClauses, " AND ")

	var total int64
	countQuery := "SELECT COUNT(*) FROM publications" + whereSQL
	if err := h.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghitung publikasi."})
		return
	}

	dataQuery := fmt.Sprintf(`SELECT id, title, platform, publish_date, post_url, status, views, likes, period, created_at, updated_at
		FROM publications %s ORDER BY %s %s LIMIT ? OFFSET ?`, whereSQL, sortField, sortDir)

	dataArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(dataQuery, dataArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal mengambil data publikasi."})
		return
	}
	defer rows.Close()

	list := make([]models.Publication, 0)
	for rows.Next() {
		var p models.Publication
		if err := rows.Scan(&p.ID, &p.Title, &p.Platform, &p.PublishDate, &p.PostURL, &p.Status, &p.Views, &p.Likes, &p.Period, &p.CreatedAt, &p.UpdatedAt); err == nil {
			list = append(list, p)
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: list,
		Meta: BuildPaginationMeta(page, pageSize, total),
	})
}

func (h *PublicationHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var p models.Publication
	err := h.DB.QueryRow(`SELECT id, title, platform, publish_date, post_url, status, views, likes, period, created_at, updated_at
		FROM publications WHERE id = ?`, id).Scan(
		&p.ID, &p.Title, &p.Platform, &p.PublishDate, &p.PostURL, &p.Status, &p.Views, &p.Likes, &p.Period, &p.CreatedAt, &p.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Publikasi tidak ditemukan."})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Terjadi kesalahan server."})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: p})
}

type PublicationInput struct {
	Title       string `json:"title" binding:"required"`
	Platform    string `json:"platform" binding:"required"`
	PublishDate string `json:"publish_date" binding:"required"`
	PostURL     string `json:"post_url" binding:"required"`
	Status      string `json:"status" binding:"required"`
	Views       int    `json:"views"`
	Likes       int    `json:"likes"`
	Period      string `json:"period"`
}

func (h *PublicationHandler) Create(c *gin.Context) {
	var input PublicationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Form jadwal publikasi tidak lengkap."})
		return
	}

	if input.Period == "" {
		input.Period = "2026"
	}

	id := uuid.New().String()
	now := time.Now().UTC()

	_, err := h.DB.Exec(`INSERT INTO publications (id, title, platform, publish_date, post_url, status, views, likes, period, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, input.Title, input.Platform, input.PublishDate, input.PostURL, input.Status, input.Views, input.Likes, input.Period, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menyimpan data publikasi: " + err.Error()})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "publications", id, "CREATE", fmt.Sprintf("Menambahkan publikasi: %s (%s)", input.Title, input.Platform), "Pubdok")

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    models.Publication{ID: id, Title: input.Title, Platform: input.Platform, PublishDate: input.PublishDate, PostURL: input.PostURL, Status: input.Status, Views: input.Views, Likes: input.Likes, Period: input.Period, CreatedAt: now, UpdatedAt: now},
		Message: "Data publikasi berhasil disimpan.",
	})
}

func (h *PublicationHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input PublicationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Format data tidak valid."})
		return
	}

	if input.Period == "" {
		input.Period = "2026"
	}

	now := time.Now().UTC()
	res, err := h.DB.Exec(`UPDATE publications SET title = ?, platform = ?, publish_date = ?, post_url = ?, status = ?, views = ?, likes = ?, period = ?, updated_at = ?
		WHERE id = ?`,
		input.Title, input.Platform, input.PublishDate, input.PostURL, input.Status, input.Views, input.Likes, input.Period, now, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal memperbarui publikasi."})
		return
	}

	rowsAff, _ := res.RowsAffected()
	if rowsAff == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Publikasi tidak ditemukan."})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "publications", id, "UPDATE", fmt.Sprintf("Memperbarui publikasi: %s", input.Title), "Pubdok")

	c.JSON(http.StatusOK, models.APIResponse{
		Data:    models.Publication{ID: id, Title: input.Title, Platform: input.Platform, PublishDate: input.PublishDate, PostURL: input.PostURL, Status: input.Status, Views: input.Views, Likes: input.Likes, Period: input.Period, UpdatedAt: now},
		Message: "Data publikasi berhasil diperbarui.",
	})
}

func (h *PublicationHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var title string
	err := h.DB.QueryRow("SELECT title FROM publications WHERE id = ?", id).Scan(&title)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Publikasi tidak ditemukan."})
		return
	}

	_, err = h.DB.Exec("DELETE FROM publications WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghapus publikasi."})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "publications", id, "DELETE", fmt.Sprintf("Menghapus publikasi: %s", title), "Pubdok")

	c.JSON(http.StatusOK, models.APIResponse{Message: "Data publikasi berhasil dihapus."})
}
