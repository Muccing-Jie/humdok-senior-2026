package handlers

import (
	"database/sql"
	"math"
	"strconv"
	"strings"

	"humdok-backend/internal/models"

	"github.com/gin-gonic/gin"
)

type UserContextInfo struct {
	ID           string
	Name         string
	Email        string
	Role         string
	ModuleAccess string
}

func GetContextUser(c *gin.Context) *UserContextInfo {
	userID, _ := c.Get("user_id")
	userName, _ := c.Get("user_name")
	userEmail, _ := c.Get("user_email")
	userRole, _ := c.Get("user_role")
	moduleAccess, _ := c.Get("module_access")

	return &UserContextInfo{
		ID:           getString(userID),
		Name:         getString(userName),
		Email:        getString(userEmail),
		Role:         getString(userRole),
		ModuleAccess: getString(moduleAccess),
	}
}

func getString(val interface{}) string {
	if s, ok := val.(string); ok {
		return s
	}
	return ""
}

func ParsePagination(c *gin.Context) (page int, pageSize int, offset int) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err = strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if err != nil || pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	offset = (page - 1) * pageSize
	return page, pageSize, offset
}

func BuildPaginationMeta(page, pageSize int, total int64) *models.PaginationMeta {
	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages < 1 {
		totalPages = 1
	}
	return &models.PaginationMeta{
		Page:       page,
		PageSize:   pageSize,
		Total:      total,
		TotalPages: totalPages,
	}
}

// ValidateSortColumn ensures sort query cannot cause SQL injection by strictly matching whitelist
func ValidateSortColumn(sortField string, whitelist []string, defaultCol string) string {
	sortField = strings.ToLower(strings.TrimSpace(sortField))
	for _, col := range whitelist {
		if strings.ToLower(col) == sortField {
			return col
		}
	}
	return defaultCol
}

func ValidateSortDir(dir string) string {
	dir = strings.ToUpper(strings.TrimSpace(dir))
	if dir == "DESC" {
		return "DESC"
	}
	return "ASC"
}

func NullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}
