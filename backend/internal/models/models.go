package models

import "time"

// PaginationMeta standard metadata for paginated responses
type PaginationMeta struct {
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

// APIResponse standard wrapper
type APIResponse struct {
	Data    interface{}     `json:"data,omitempty"`
	Meta    *PaginationMeta `json:"meta,omitempty"`
	Message string          `json:"message,omitempty"`
	Error   string          `json:"error,omitempty"`
}

// User role constants
const (
	RoleSuperAdmin = "Super Admin"
	RoleHumas      = "Divisi Humas"
	RolePubdok     = "Divisi Pubdok"
)

// Division constants
const (
	DivisionHumas  = "Humas"
	DivisionPubdok = "Pubdok"
	DivisionGlobal = "Global"
)

// User Model
type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	ModuleAccess string    `json:"module_access"`
	Status       string    `json:"status"` // active, inactive
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// BoardMember Model (Pengurus)
type BoardMember struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	SNR       string    `json:"snr"`
	Position  string    `json:"position"`
	Level     string    `json:"level"`
	Division  string    `json:"division"`
	Contact   string    `json:"contact"`
	Period    string    `json:"period"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// WorkProgram Model (Program Kerja)
type WorkProgram struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	PicID       *string   `json:"pic_id"`
	PicName     string    `json:"pic_name"`
	TargetText  string    `json:"target_text"`
	ProgressPct int       `json:"progress_pct"` // 0 - 100
	Status      string    `json:"status"`       // Terlaksana, Berjalan, Belum Terlaksana
	Division    string    `json:"division"`     // Humas, Pubdok
	Period      string    `json:"period"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Event Model (Kegiatan)
type Event struct {
	ID                 string    `json:"id"`
	Name               string    `json:"name"`
	Unit               string    `json:"unit"`
	EventType          string    `json:"event_type"`
	EventDate          string    `json:"event_date"`
	Contact            string    `json:"contact"`
	Status             string    `json:"status"` // Terlaksana, Belum Terlaksana
	Period             string    `json:"period"`
	HasDocumentation   bool      `json:"has_documentation"`
	DocumentationCount int       `json:"documentation_count"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// Schedule Model (Kalender / Agenda / Tugas)
type Schedule struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	PicID        *string   `json:"pic_id"`
	PicName      string    `json:"pic_name"`
	Stage        string    `json:"stage"`
	DeadlineDate string    `json:"deadline_date"`
	IsDone       bool      `json:"is_done"`
	Status       string    `json:"status"`   // Selesai, Dalam Proses, Belum Dimulai
	Category     string    `json:"category"` // rapat, publikasi, tugas, kegiatan
	Division     string    `json:"division"` // Humas, Pubdok
	Period       string    `json:"period"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Publication Model (Jadwal & Hasil Publikasi)
type Publication struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Platform    string    `json:"platform"` // Instagram, TikTok, YouTube, etc.
	PublishDate string    `json:"publish_date"`
	PostURL     string    `json:"post_url"`
	Status      string    `json:"status"` // Tayang, Produksi, Ide Konten
	Views       int       `json:"views"`
	Likes       int       `json:"likes"`
	Period      string    `json:"period"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Documentation Model (Dokumentasi)
type Documentation struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	EventID   string    `json:"event_id"`
	EventName string    `json:"event_name"`
	FileType  string    `json:"file_type"` // Foto, Video, Foto & Video
	DocDate   string    `json:"doc_date"`
	DriveURL  string    `json:"drive_url"`
	Status    string    `json:"status"` // Lengkap, Proses Upload, Arsip
	Period    string    `json:"period"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Achievement Model (Database Prestasi)
type Achievement struct {
	ID             string    `json:"id"`
	Unit           string    `json:"unit"`
	EventName      string    `json:"event_name"`
	RankTitle      string    `json:"rank_title"`
	EventDate      string    `json:"event_date"`
	ResultCategory string    `json:"result_category"` // Juara, Partisipasi
	Period         string    `json:"period"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// ActivityLog Model (Log Aktivitas)
type ActivityLog struct {
	ID          string    `json:"id"`
	ActorUserID *string   `json:"actor_user_id"`
	UserName    string    `json:"user_name"`
	TableName   string    `json:"table_name"`
	DataID      string    `json:"data_id"`
	ActionType  string    `json:"action_type"` // CREATE, UPDATE, DELETE, TOGGLE
	Description string    `json:"description"`
	Division    string    `json:"division"` // Humas, Pubdok, Global
	CreatedAt   time.Time `json:"created_at"`
}

// DashboardSummary model for dashboard stats aggregation
type DashboardSummary struct {
	Scope                 string             `json:"scope"`
	Period                string             `json:"period"`
	TotalWorkPrograms     int                `json:"total_work_programs"`
	HumasWorkPrograms     int                `json:"humas_work_programs"`
	PubdokWorkPrograms    int                `json:"pubdok_work_programs"`
	AvgProgramAchievement float64            `json:"avg_program_achievement"`
	HumasAvgAchievement   float64            `json:"humas_avg_achievement"`
	PubdokAvgAchievement  float64            `json:"pubdok_avg_achievement"`
	TotalEvents           int                `json:"total_events"`
	CompletedEvents       int                `json:"completed_events"`
	PendingEvents         int                `json:"pending_events"`
	EventCompletionPct    float64            `json:"event_completion_pct"`
	TotalSchedules        int                `json:"total_schedules"`
	DoneSchedules         int                `json:"done_schedules"`
	PendingSchedules      int                `json:"pending_schedules"`
	UpcomingEvents        []Event            `json:"upcoming_events"`
	UpcomingTasks         []Schedule         `json:"upcoming_tasks"`
	ProgramStats          []WorkProgram      `json:"program_stats"`
	UnitEventsSummary     map[string]int     `json:"unit_events_summary"`
	StatusCounts          map[string]int     `json:"status_counts"`
}

// LoginRequest and AuthPayload
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthUser struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Role         string `json:"role"`
	ModuleAccess string `json:"module_access"`
	Status       string `json:"status"`
}

type LoginResponse struct {
	Token string   `json:"token"`
	User  AuthUser `json:"user"`
}
