package handlers

import (
	"database/sql"
	"net/http"

	"humdok-backend/internal/config"
	"humdok-backend/internal/middleware"
	"humdok-backend/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB  *sql.DB
	Cfg *config.Config
}

func NewAuthHandler(db *sql.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{DB: db, Cfg: cfg}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Error: "Email dan password wajib diisi dengan format yang benar.",
		})
		return
	}

	var user models.User
	query := `SELECT id, name, email, password_hash, role, module_access, status, created_at, updated_at
		FROM users WHERE email = ?`

	err := h.DB.QueryRow(query, req.Email).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash,
		&user.Role, &user.ModuleAccess, &user.Status,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Kombinasi email atau password salah.",
		})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Terjadi kesalahan pada server.",
		})
		return
	}

	if user.Status != "active" {
		c.JSON(http.StatusForbidden, models.APIResponse{
			Error: "Akun Anda saat ini dinonaktifkan. Hubungi Super Admin.",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Error: "Kombinasi email atau password salah.",
		})
		return
	}

	token, err := middleware.GenerateToken(&user, h.Cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Error: "Gagal membuat sesi login.",
		})
		return
	}

	// Set HttpOnly cookie
	c.SetCookie("token", token, 3600*24, "/", "", false, true)

	// Log activity
	_ = middleware.LogAuditEntry(h.DB, &user.ID, user.Name, "users", user.ID, "LOGIN", "Pengguna berhasil masuk ke sistem", "Global")

	authUser := models.AuthUser{
		ID:           user.ID,
		Name:         user.Name,
		Email:        user.Email,
		Role:         user.Role,
		ModuleAccess: user.ModuleAccess,
		Status:       user.Status,
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: models.LoginResponse{
			Token: token,
			User:  authUser,
		},
		Message: "Login berhasil.",
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	cu := GetContextUser(c)
	if cu.ID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{Error: "Belum login."})
		return
	}

	var user models.User
	query := `SELECT id, name, email, role, module_access, status, created_at, updated_at
		FROM users WHERE id = ?`

	err := h.DB.QueryRow(query, cu.ID).Scan(
		&user.ID, &user.Name, &user.Email, &user.Role,
		&user.ModuleAccess, &user.Status, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{Error: "Data pengguna tidak ditemukan."})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: models.AuthUser{
			ID:           user.ID,
			Name:         user.Name,
			Email:        user.Email,
			Role:         user.Role,
			ModuleAccess: user.ModuleAccess,
			Status:       user.Status,
		},
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	cu := GetContextUser(c)
	if cu.ID != "" {
		_ = middleware.LogAuditEntry(h.DB, &cu.ID, cu.Name, "users", cu.ID, "LOGOUT", "Pengguna keluar dari sistem", "Global")
	}
	// Expire cookie
	c.SetCookie("token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, models.APIResponse{
		Message: "Logout berhasil.",
	})
}
