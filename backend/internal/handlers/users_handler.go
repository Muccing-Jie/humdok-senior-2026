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
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	DB *sql.DB
}

func NewUserHandler(db *sql.DB) *UserHandler {
	return &UserHandler{DB: db}
}

func (h *UserHandler) List(c *gin.Context) {
	page, pageSize, offset := ParsePagination(c)
	search := strings.TrimSpace(c.Query("search"))
	role := strings.TrimSpace(c.Query("role"))
	status := strings.TrimSpace(c.Query("status"))

	sortField := ValidateSortColumn(c.Query("sort"), []string{"name", "email", "role", "status", "created_at"}, "created_at")
	sortDir := ValidateSortDir(c.Query("dir"))

	whereClauses := []string{"1=1"}
	args := []interface{}{}

	if role != "" {
		whereClauses = append(whereClauses, "role = ?")
		args = append(args, role)
	}
	if status != "" {
		whereClauses = append(whereClauses, "status = ?")
		args = append(args, status)
	}
	if search != "" {
		whereClauses = append(whereClauses, "(name LIKE ? OR email LIKE ?)")
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm)
	}

	whereSQL := " WHERE " + strings.Join(whereClauses, " AND ")

	var total int64
	countQuery := "SELECT COUNT(*) FROM users" + whereSQL
	if err := h.DB.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghitung data pengguna."})
		return
	}

	dataQuery := fmt.Sprintf(`SELECT id, name, email, role, module_access, status, created_at, updated_at
		FROM users %s ORDER BY %s %s LIMIT ? OFFSET ?`, whereSQL, sortField, sortDir)

	dataArgs := append(args, pageSize, offset)
	rows, err := h.DB.Query(dataQuery, dataArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal mengambil data pengguna."})
		return
	}
	defer rows.Close()

	list := make([]models.User, 0)
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.ModuleAccess, &u.Status, &u.CreatedAt, &u.UpdatedAt); err == nil {
			list = append(list, u)
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: list,
		Meta: BuildPaginationMeta(page, pageSize, total),
	})
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	var u models.User
	err := h.DB.QueryRow(`SELECT id, name, email, role, module_access, status, created_at, updated_at
		FROM users WHERE id = ?`, id).Scan(
		&u.ID, &u.Name, &u.Email, &u.Role, &u.ModuleAccess, &u.Status, &u.CreatedAt, &u.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Pengguna tidak ditemukan."})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Terjadi kesalahan server."})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{Data: u})
}

type UserCreateInput struct {
	Name         string `json:"name" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Password     string `json:"password" binding:"required,min=6"`
	Role         string `json:"role" binding:"required"`
	ModuleAccess string `json:"module_access"`
	Status       string `json:"status"`
}

type UserUpdateInput struct {
	Name         string `json:"name" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Password     string `json:"password"` // optional on update
	Role         string `json:"role" binding:"required"`
	ModuleAccess string `json:"module_access"`
	Status       string `json:"status"`
}

func (h *UserHandler) Create(c *gin.Context) {
	var input UserCreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Form pendaftaran pengguna tidak valid atau password minimal 6 karakter."})
		return
	}

	// Check if email already used
	var existsID string
	_ = h.DB.QueryRow("SELECT id FROM users WHERE email = ?", input.Email).Scan(&existsID)
	if existsID != "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Email tersebut sudah terdaftar dalam sistem."})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal memproses kata sandi."})
		return
	}

	if input.Status == "" {
		input.Status = "active"
	}
	if input.ModuleAccess == "" {
		if input.Role == models.RoleSuperAdmin {
			input.ModuleAccess = "all"
		} else if input.Role == models.RoleHumas {
			input.ModuleAccess = "dashboard,board_members,work_programs,events,schedules,activity_logs"
		} else {
			input.ModuleAccess = "dashboard,work_programs,schedules,publications,documentations,achievements,activity_logs"
		}
	}

	id := uuid.New().String()
	now := time.Now().UTC()

	_, err = h.DB.Exec(`INSERT INTO users (id, name, email, password_hash, role, module_access, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, input.Name, input.Email, string(hash), input.Role, input.ModuleAccess, input.Status, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menyimpan akun pengguna: " + err.Error()})
		return
	}

	cu := GetContextUser(c)
	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "users", id, "CREATE", fmt.Sprintf("Menambahkan akun pengguna: %s (%s, %s)", input.Name, input.Email, input.Role), "Global")

	c.JSON(http.StatusCreated, models.APIResponse{
		Data:    models.User{ID: id, Name: input.Name, Email: input.Email, Role: input.Role, ModuleAccess: input.ModuleAccess, Status: input.Status, CreatedAt: now, UpdatedAt: now},
		Message: "Pengguna berhasil ditambahkan.",
	})
}

func (h *UserHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input UserUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Format data tidak valid."})
		return
	}

	cu := GetContextUser(c)
	// If current user is trying to deactivate or change their own role to non-admin
	if cu.ID == id {
		if input.Status == "inactive" {
			c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Anda tidak dapat menonaktifkan akun Anda sendiri."})
			return
		}
		if input.Role != models.RoleSuperAdmin {
			c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Anda tidak dapat menurunkan peran akun Anda sendiri dari Super Admin."})
			return
		}
	}

	now := time.Now().UTC()
	var err error
	if input.Password != "" {
		hash, errHash := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if errHash != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal memproses kata sandi baru."})
			return
		}
		_, err = h.DB.Exec(`UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, module_access = ?, status = ?, updated_at = ?
			WHERE id = ?`, input.Name, input.Email, string(hash), input.Role, input.ModuleAccess, input.Status, now, id)
	} else {
		_, err = h.DB.Exec(`UPDATE users SET name = ?, email = ?, role = ?, module_access = ?, status = ?, updated_at = ?
			WHERE id = ?`, input.Name, input.Email, input.Role, input.ModuleAccess, input.Status, now, id)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal memperbarui data pengguna: " + err.Error()})
		return
	}

	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "users", id, "UPDATE", fmt.Sprintf("Memperbarui data pengguna: %s (%s)", input.Name, input.Email), "Global")

	c.JSON(http.StatusOK, models.APIResponse{
		Data:    models.User{ID: id, Name: input.Name, Email: input.Email, Role: input.Role, ModuleAccess: input.ModuleAccess, Status: input.Status, UpdatedAt: now},
		Message: "Data pengguna berhasil diperbarui.",
	})
}

func (h *UserHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	cu := GetContextUser(c)

	if cu.ID == id {
		c.JSON(http.StatusBadRequest, models.APIResponse{Error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk."})
		return
	}

	// Verify target user exists and check if it is the last active Super Admin
	var targetRole, targetName, targetStatus string
	err := h.DB.QueryRow("SELECT role, name, status FROM users WHERE id = ?", id).Scan(&targetRole, &targetName, &targetStatus)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.APIResponse{Error: "Pengguna tidak ditemukan."})
		return
	}

	if targetRole == models.RoleSuperAdmin && targetStatus == "active" {
		var activeAdminCount int
		_ = h.DB.QueryRow("SELECT COUNT(*) FROM users WHERE role = ? AND status = 'active'", models.RoleSuperAdmin).Scan(&activeAdminCount)
		if activeAdminCount <= 1 {
			c.JSON(http.StatusBadRequest, models.APIResponse{
				Error: "Tidak dapat menghapus Super Admin terakhir yang masih aktif demi keamanan sistem.",
			})
			return
		}
	}

	_, err = h.DB.Exec("DELETE FROM users WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{Error: "Gagal menghapus pengguna: " + err.Error()})
		return
	}

	_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "users", id, "DELETE", fmt.Sprintf("Menghapus akun pengguna: %s", targetName), "Global")

	c.JSON(http.StatusOK, models.APIResponse{Message: "Pengguna berhasil dihapus."})
}
