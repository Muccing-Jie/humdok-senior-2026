package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"humdok-backend/internal/config"
	"humdok-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID       string `json:"user_id"`
	Email        string `json:"email"`
	Name         string `json:"name"`
	Role         string `json:"role"`
	ModuleAccess string `json:"module_access"`
	jwt.RegisteredClaims
}

func GenerateToken(user *models.User, cfg *config.Config) (string, error) {
	claims := Claims{
		UserID:       user.ID,
		Email:        user.Email,
		Name:         user.Name,
		Role:         user.Role,
		ModuleAccess: user.ModuleAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "humdok-management",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}

func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		// 1. Try Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}

		// 2. Try Cookie if header not found
		if tokenString == "" {
			if cookie, err := c.Cookie("token"); err == nil && cookie != "" {
				tokenString = cookie
			}
		}

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Akses ditolak: token autentikasi tidak ditemukan. Silakan login kembali.",
			})
			c.Abort()
			return
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("metode enkripsi token tidak valid")
			}
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Sesi Anda telah kedaluwarsa atau token tidak valid. Silakan login ulang.",
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Error: "Klaim token tidak valid.",
			})
			c.Abort()
			return
		}

		// Store user in context
		c.Set("user_id", claims.UserID)
		c.Set("user_name", claims.Name)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("module_access", claims.ModuleAccess)

		c.Next()
	}
}

// RequireRole checks if user has one of allowed roles
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusForbidden, models.APIResponse{
				Error: "Otorisasi gagal: peran pengguna tidak ditemukan.",
			})
			c.Abort()
			return
		}

		userRole := roleVal.(string)
		for _, allowed := range allowedRoles {
			if userRole == allowed {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, models.APIResponse{
			Error: "Akses ditolak: Anda tidak memiliki izin untuk mengakses modul ini.",
		})
		c.Abort()
	}
}
