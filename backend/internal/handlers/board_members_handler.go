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

type BoardMemberHandler struct {
	DB *sql.DB
}

func NewBoardMemberHandler(db *sql.DB) *BoardMemberHandler {
	return &BoardMemberHandler{DB: db}
}

func (h *BoardMemberHandler) List(c *gin.Context) {
	page, pageSize, offset := ParsePagination(c)
	search := strings.TrimSpace(c.Query("search"))
	level := strings.TrimSpace(c.Query("level"))
	division := strings.TrimSpace(c.Query("division"))
	period := c.DefaultQuery("period", "2026")

	sortField := ValidateSortColumn(c.Query("sort"), []string{"name", "snr", "position", "level", "division", "contact", "created_at"}, "name")
	sortDir := ValidateSortDir(c.Query("dir"))

	whereClauses := []string{"period = ?"}
	args := []interface{}{period}

	if level != "" {
		whereClauses = append(whereClauses, "level = ?")
		args = append(args, level)
	}
	if division != "" {
		whereClauses = append(whereClauses, "division = ?")
		args = append(args, division)
	}
	if search != "" {
		whereClauses = append(whereClauses, "(name LIKE ? OR snr LIKE ? OR position LIKE ? OR contact LIKE ?)")
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	whereSQL := " WHERE " + strings.Join(whereClauses, " AND ")

	// Total count
	var total int64
	countQuery := "SELECT COUNT(*) FROM board_members" + whereSQL
	if err := h.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghitung data pengurus."})
		return
	}

	// Data query
	dataQuery := fmt.Sprintf(`SELECT id, name, snr, position, level, division, contact, period, created_at, updated_at
		FROM board_members %s ORDER BY %s %s LIMIT ? OFFSET ?`, whereSQL, sortField, sortDir)

	dataArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(dataQuery, dataArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal mengambil data pengurus."})
		return
	}
	defer rows.Close()

	list := make([]models.BoardMember, 0)
	for rows.Next() {
		var m models.BoardMember
		if err := rows.Scan(&m.ID, &m.Name, &m.SNR, &m.Position, &m.Level, &m.Division, &m.Contact, &m.Period, &m.CreatedAt, &m.UpdatedAt); err == nil {
			list = append(list, m)
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: list,
		Meta: BuildPaginationMeta(page, pageSize, total),
	})
}

func (h *BoardMemberHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var m models.BoardMember
	err := h.DB.QueryRow(`SELECT id, name, snr, position, level, division, contact, period, created_at, updated_at
		FROM board_members WHERE id = ?`, id).Scan(
		&m.ID, &m.Name, &m.SNR, &m.Position, &m.Level, &m.Division, &m.Contact, &m.Period, &m.CreatedAt, &m.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Data pengurus tidak ditemukan."})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Terjadi kesalahan internal server."})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: m})
}

type BoardMemberInput struct {
	Name     string `json:"name" binding:"required"`
	SNR      string `json:"snr" binding:"required"`
	Position string `json:"position" binding:"required"`
	Level    string `json:"level" binding:"required"`
	Division string `json:"division" binding:"required"`
	Contact  string `json:"contact" binding:"required"`
	Period   string `json:"period"`
}

func (h *BoardMemberHandler) Create(c *gin.Context) {
	var input BoardMemberInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Seluruh kolom pengurus wajib diisi."})
		return
	}

	if input.Period == "" {
		input.Period = "2026"
	}

	id := uuid.New().String()
	now := time.Now().UTC()

	_, err := h.DB.Exec(`INSERT INTO board_members (id, name, snr, position, level, division, contact, period, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, input.Name, input.SNR, input.Position, input.Level, input.Division, input.Contact, input.Period, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menyimpan pengurus baru: " + err.Error()})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "board_members", id, "CREATE", fmt.Sprintf("Menambahkan pengurus baru: %s (%s)", input.Name, input.Position), input.Division)

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    models.BoardMember{ID: id, Name: input.Name, SNR: input.SNR, Position: input.Position, Level: input.Level, Division: input.Division, Contact: input.Contact, Period: input.Period, CreatedAt: now, UpdatedAt: now},
		Message: "Data pengurus berhasil ditambahkan.",
	})
}

func (h *BoardMemberHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input BoardMemberInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Input data tidak valid."})
		return
	}

	if input.Period == "" {
		input.Period = "2026"
	}

	now := time.Now().UTC()
	res, err := h.DB.Exec(`UPDATE board_members SET name = ?, snr = ?, position = ?, level = ?, division = ?, contact = ?, period = ?, updated_at = ? WHERE id = ?`,
		input.Name, input.SNR, input.Position, input.Level, input.Division, input.Contact, input.Period, now, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal memperbarui data pengurus."})
		return
	}

	rowsAff, _ := res.RowsAffected()
	if rowsAff == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Data pengurus tidak ditemukan."})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "board_members", id, "UPDATE", fmt.Sprintf("Memperbarui data pengurus: %s", input.Name), input.Division)

	c.JSON(http.StatusOK, models.APIResponse{
		Data:    models.BoardMember{ID: id, Name: input.Name, SNR: input.SNR, Position: input.Position, Level: input.Level, Division: input.Division, Contact: input.Contact, Period: input.Period, UpdatedAt: now},
		Message: "Data pengurus berhasil diperbarui.",
	})
}

func (h *BoardMemberHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var name, division string
	_ = h.DB.QueryRow("SELECT name, division FROM board_members WHERE id = ?", id).Scan(&name, &division)

	res, err := h.DB.Exec("DELETE FROM board_members WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghapus pengurus: data mungkin masih terhubung dengan proker atau jadwal."})
		return
	}

	rowsAff, _ := res.RowsAffected()
	if rowsAff == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Data pengurus tidak ditemukan."})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "board_members", id, "DELETE", fmt.Sprintf("Menghapus data pengurus: %s", name), division)

	c.JSON(http.StatusOK, models.APIResponse{Message: "Data pengurus berhasil dihapus."})
}
