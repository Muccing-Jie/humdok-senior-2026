package tests

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"humdok-backend/internal/config"
	"humdok-backend/internal/database"
	"humdok-backend/internal/models"
	"humdok-backend/internal/routes"

	"github.com/gin-gonic/gin"
)

func setupTestEnvironment(t *testing.T) (*gin.Engine, *sql.DB) {
	gin.SetMode(gin.TestMode)
	_ = os.Remove("test_humdok.db")

	cfg := &config.Config{
		Port:           "8081",
		DBDriver:       "sqlite",
		DBPath:         "test_humdok.db",
		JWTSecret:      "test-secret-key-senior-2026",
		Period:         "2026",
		AdminEmail:     "admin@humdok.local",
		AdminPassword:  "admin123",
		HumasEmail:     "div_humas@humdok.local",
		HumasPassword:  "humas123",
		PubdokEmail:    "div_pubdok@humdok.local",
		PubdokPassword: "pubdok123",
	}

	db, err := database.InitDB(cfg)
	if err != nil {
		t.Fatalf("Failed to init DB: %v", err)
	}

	if err := database.RunMigrations(db); err != nil {
		t.Fatalf("Failed migrations: %v", err)
	}

	if err := database.SeedDatabase(db, cfg); err != nil {
		t.Fatalf("Failed seeding: %v", err)
	}

	r := routes.SetupRouter(db, cfg)
	return r, db
}

func loginHelper(t *testing.T, r *gin.Engine, email, password string) string {
	payload := models.LoginRequest{Email: email, Password: password}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Login failed for %s with code %d: %s", email, w.Code, w.Body.String())
	}

	var resp struct {
		Data models.LoginResponse `json:"data"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	return resp.Data.Token
}

func TestDashboardStats(t *testing.T) {
	r, db := setupTestEnvironment(t)
	defer db.Close()
	defer os.Remove("test_humdok.db")

	token := loginHelper(t, r, "admin@humdok.local", "admin123")

	req, _ := http.NewRequest("GET", "/api/v1/dashboard?period=2026", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Data models.DashboardSummary `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal dashboard response: %v", err)
	}

	summary := resp.Data
	// Verify exact requirements:
	// Total Proker: 7 (Humas: 2, Pubdok: 5)
	if summary.TotalWorkPrograms != 7 {
		t.Errorf("Expected 7 total work programs, got %d", summary.TotalWorkPrograms)
	}
	if summary.HumasWorkPrograms != 2 {
		t.Errorf("Expected 2 Humas work programs, got %d", summary.HumasWorkPrograms)
	}
	if summary.PubdokWorkPrograms != 5 {
		t.Errorf("Expected 5 Pubdok work programs, got %d", summary.PubdokWorkPrograms)
	}

	// Humas Avg = 55%, Pubdok Avg = 45%
	if summary.HumasAvgAchievement != 55 {
		t.Errorf("Expected Humas avg achievement 55, got %v", summary.HumasAvgAchievement)
	}
	if summary.PubdokAvgAchievement != 45 {
		t.Errorf("Expected Pubdok avg achievement 45, got %v", summary.PubdokAvgAchievement)
	}

	// Total Events = 16 (Completed: 10, Pending: 6, Pct: 63%)
	if summary.TotalEvents != 16 {
		t.Errorf("Expected 16 events, got %d", summary.TotalEvents)
	}
	if summary.CompletedEvents != 10 {
		t.Errorf("Expected 10 completed events, got %d", summary.CompletedEvents)
	}
	if summary.PendingEvents != 6 {
		t.Errorf("Expected 6 pending events, got %d", summary.PendingEvents)
	}
	if summary.EventCompletionPct != 63 {
		t.Errorf("Expected 63%% event completion, got %v", summary.EventCompletionPct)
	}
}

func TestRBACEnforcement(t *testing.T) {
	r, db := setupTestEnvironment(t)
	defer db.Close()
	defer os.Remove("test_humdok.db")

	humasToken := loginHelper(t, r, "div_humas@humdok.local", "humas123")
	pubdokToken := loginHelper(t, r, "div_pubdok@humdok.local", "pubdok123")

	// 1. Humas should NOT be allowed to access Publications
	reqPub, _ := http.NewRequest("GET", "/api/v1/publications", nil)
	reqPub.Header.Set("Authorization", "Bearer "+humasToken)
	wPub := httptest.NewRecorder()
	r.ServeHTTP(wPub, reqPub)
	if wPub.Code != http.StatusForbidden {
		t.Errorf("Expected Humas accessing publications to be 403 Forbidden, got %d", wPub.Code)
	}

	// 2. Pubdok should NOT be allowed to create events
	eventPayload := `{"name":"Event Baru","unit":"Basket","event_type":"Lomba","event_date":"2026-05-01","contact":"081234567","status":"Belum Terlaksana"}`
	reqEv, _ := http.NewRequest("POST", "/api/v1/events", bytes.NewBufferString(eventPayload))
	reqEv.Header.Set("Content-Type", "application/json")
	reqEv.Header.Set("Authorization", "Bearer "+pubdokToken)
	wEv := httptest.NewRecorder()
	r.ServeHTTP(wEv, reqEv)
	if wEv.Code != http.StatusForbidden {
		t.Errorf("Expected Pubdok creating event to be 403 Forbidden, got %d", wEv.Code)
	}

	// 3. Neither Humas nor Pubdok can access /api/v1/users
	reqUsers, _ := http.NewRequest("GET", "/api/v1/users", nil)
	reqUsers.Header.Set("Authorization", "Bearer "+humasToken)
	wUsers := httptest.NewRecorder()
	r.ServeHTTP(wUsers, reqUsers)
	if wUsers.Code != http.StatusForbidden {
		t.Errorf("Expected Humas accessing users to be 403 Forbidden, got %d", wUsers.Code)
	}
}

func TestEventDocumentationRestrict(t *testing.T) {
	r, db := setupTestEnvironment(t)
	defer db.Close()
	defer os.Remove("test_humdok.db")

	adminToken := loginHelper(t, r, "admin@humdok.local", "admin123")

	// Try to delete event "ev-004" (Phinisi Basketball Competition 2026) which has documentation "doc-001"
	req, _ := http.NewRequest("DELETE", "/api/v1/events/ev-004", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Must be 409 Conflict due to ON DELETE RESTRICT
	if w.Code != http.StatusConflict {
		t.Errorf("Expected 409 Conflict when deleting event with documentation, got %d: %s", w.Code, w.Body.String())
	}
}

func TestBoardMembers55Dataset(t *testing.T) {
	r, db := setupTestEnvironment(t)
	defer db.Close()
	defer os.Remove("test_humdok.db")

	adminToken := loginHelper(t, r, "admin@humdok.local", "admin123")

	// 1. Fetch all members with page_size=100
	req, _ := http.NewRequest("GET", "/api/v1/board-members?page=1&page_size=100", nil)
	req.Header.Set("Authorization", "Bearer "+adminToken)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Data []models.BoardMember `json:"data"`
		Meta models.PaginationMeta `json:"meta"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal board members: %v", err)
	}

	if resp.Meta.Total != 55 {
		t.Errorf("Expected total 55 board members, got %d", resp.Meta.Total)
	}
	if len(resp.Data) != 55 {
		t.Errorf("Expected 55 items in data, got %d", len(resp.Data))
	}

	// 2. Filter Staf Ahli (9)
	reqSA, _ := http.NewRequest("GET", "/api/v1/board-members?level=Staf+Ahli&page_size=100", nil)
	reqSA.Header.Set("Authorization", "Bearer "+adminToken)
	wSA := httptest.NewRecorder()
	r.ServeHTTP(wSA, reqSA)
	var respSA struct {
		Meta models.PaginationMeta `json:"meta"`
	}
	_ = json.Unmarshal(wSA.Body.Bytes(), &respSA)
	if respSA.Meta.Total != 9 {
		t.Errorf("Expected 9 Staf Ahli, got %d", respSA.Meta.Total)
	}

	// 3. Filter Pengurus Harian (17)
	reqPH, _ := http.NewRequest("GET", "/api/v1/board-members?level=Pengurus+Harian&page_size=100", nil)
	reqPH.Header.Set("Authorization", "Bearer "+adminToken)
	wPH := httptest.NewRecorder()
	r.ServeHTTP(wPH, reqPH)
	var respPH struct {
		Meta models.PaginationMeta `json:"meta"`
	}
	_ = json.Unmarshal(wPH.Body.Bytes(), &respPH)
	if respPH.Meta.Total != 17 {
		t.Errorf("Expected 17 Pengurus Harian, got %d", respPH.Meta.Total)
	}

	// 4. Filter Anggota Pengurus Harian (29)
	reqAPH, _ := http.NewRequest("GET", "/api/v1/board-members?level=Anggota+Pengurus+Harian&page_size=100", nil)
	reqAPH.Header.Set("Authorization", "Bearer "+adminToken)
	wAPH := httptest.NewRecorder()
	r.ServeHTTP(wAPH, reqAPH)
	var respAPH struct {
		Meta models.PaginationMeta `json:"meta"`
	}
	_ = json.Unmarshal(wAPH.Body.Bytes(), &respAPH)
	if respAPH.Meta.Total != 29 {
		t.Errorf("Expected 29 Anggota Pengurus Harian, got %d", respAPH.Meta.Total)
	}
}

