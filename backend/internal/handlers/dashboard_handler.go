package handlers

import (
	"database/sql"
	"math"
	"net/http"

	"humdok-backend/internal/models"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	DB *sql.DB
}

func NewDashboardHandler(db *sql.DB) *DashboardHandler {
	return &DashboardHandler{DB: db}
}

func (h *DashboardHandler) GetSummary(c *gin.Context) {
	division := c.DefaultQuery("division", "")
	period := c.DefaultQuery("period", "2026")

	summary := models.DashboardSummary{
		Scope:             division,
		Period:            period,
		UnitEventsSummary: make(map[string]int),
		StatusCounts:      make(map[string]int),
	}

	// 1. Work Program Counts & Averages
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM work_programs WHERE period = ?", period).Scan(&summary.TotalWorkPrograms)
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM work_programs WHERE division = 'Humas' AND period = ?", period).Scan(&summary.HumasWorkPrograms)
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM work_programs WHERE division = 'Pubdok' AND period = ?", period).Scan(&summary.PubdokWorkPrograms)

	var avgAll, avgHumas, avgPubdok sql.NullFloat64
	_ = h.DB.QueryRow("SELECT AVG(progress_pct) FROM work_programs WHERE period = ?", period).Scan(&avgAll)
	_ = h.DB.QueryRow("SELECT AVG(progress_pct) FROM work_programs WHERE division = 'Humas' AND period = ?", period).Scan(&avgHumas)
	_ = h.DB.QueryRow("SELECT AVG(progress_pct) FROM work_programs WHERE division = 'Pubdok' AND period = ?", period).Scan(&avgPubdok)

	if avgAll.Valid {
		summary.AvgProgramAchievement = math.Round(avgAll.Float64)
	}
	if avgHumas.Valid {
		summary.HumasAvgAchievement = math.Round(avgHumas.Float64)
	}
	if avgPubdok.Valid {
		summary.PubdokAvgAchievement = math.Round(avgPubdok.Float64)
	}

	// 2. Events Counts
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM events WHERE period = ?", period).Scan(&summary.TotalEvents)
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM events WHERE status = 'Terlaksana' AND period = ?", period).Scan(&summary.CompletedEvents)
	_ = h.DB.QueryRow("SELECT COUNT(*) FROM events WHERE status != 'Terlaksana' AND period = ?", period).Scan(&summary.PendingEvents)

	if summary.TotalEvents > 0 {
		pct := (float64(summary.CompletedEvents) / float64(summary.TotalEvents)) * 100.0
		summary.EventCompletionPct = math.Round(pct)
	}

	// 3. Schedules Counts
	scheduleFilterQuery := "SELECT COUNT(*) FROM schedules WHERE period = ?"
	scheduleArgs := []interface{}{period}
	if division != "" && division != "Global" {
		scheduleFilterQuery += " AND division = ?"
		scheduleArgs = append(scheduleArgs, division)
	}
	_ = h.DB.QueryRow(scheduleFilterQuery, scheduleArgs...).Scan(&summary.TotalSchedules)

	doneQuery := scheduleFilterQuery + " AND is_done = 1"
	_ = h.DB.QueryRow(doneQuery, scheduleArgs...).Scan(&summary.DoneSchedules)
	summary.PendingSchedules = summary.TotalSchedules - summary.DoneSchedules

	// 4. Upcoming Events (limit 5)
	eventRows, err := h.DB.Query(`SELECT id, name, unit, event_type, event_date, contact, status, period, created_at, updated_at
		FROM events WHERE period = ? ORDER BY CASE WHEN status = 'Belum Terlaksana' THEN 0 ELSE 1 END, event_date ASC LIMIT 5`, period)
	if err == nil {
		defer eventRows.Close()
		for eventRows.Next() {
			var ev models.Event
			if err := eventRows.Scan(&ev.ID, &ev.Name, &ev.Unit, &ev.EventType, &ev.EventDate, &ev.Contact, &ev.Status, &ev.Period, &ev.CreatedAt, &ev.UpdatedAt); err == nil {
				summary.UpcomingEvents = append(summary.UpcomingEvents, ev)
			}
		}
	}

	// 5. Upcoming Tasks / Schedules (limit 5)
	taskQuery := `SELECT id, title, pic_id, pic_name, stage, deadline_date, is_done, status, category, division, period, created_at, updated_at
		FROM schedules WHERE period = ?`
	taskArgs := []interface{}{period}
	if division != "" && division != "Global" {
		taskQuery += " AND division = ?"
		taskArgs = append(taskArgs, division)
	}
	taskQuery += " ORDER BY is_done ASC, deadline_date ASC LIMIT 5"

	taskRows, err := h.DB.Query(taskQuery, taskArgs...)
	if err == nil {
		defer taskRows.Close()
		for taskRows.Next() {
			var sc models.Schedule
			var picID sql.NullString
			if err := taskRows.Scan(&sc.ID, &sc.Title, &picID, &sc.PicName, &sc.Stage, &sc.DeadlineDate, &sc.IsDone, &sc.Status, &sc.Category, &sc.Division, &sc.Period, &sc.CreatedAt, &sc.UpdatedAt); err == nil {
				if picID.Valid {
					sc.PicID = &picID.String
				}
				summary.UpcomingTasks = append(summary.UpcomingTasks, sc)
			}
		}
	}

	// 6. Program Stats List (filtered by division if specified)
	prokerQuery := `SELECT id, name, pic_id, pic_name, target_text, progress_pct, status, division, period, created_at, updated_at
		FROM work_programs WHERE period = ?`
	prokerArgs := []interface{}{period}
	if division != "" && division != "Global" {
		prokerQuery += " AND division = ?"
		prokerArgs = append(prokerArgs, division)
	}
	prokerQuery += " ORDER BY division ASC, progress_pct DESC"

	pRows, err := h.DB.Query(prokerQuery, prokerArgs...)
	if err == nil {
		defer pRows.Close()
		for pRows.Next() {
			var wp models.WorkProgram
			var picID sql.NullString
			if err := pRows.Scan(&wp.ID, &wp.Name, &picID, &wp.PicName, &wp.TargetText, &wp.ProgressPct, &wp.Status, &wp.Division, &wp.Period, &wp.CreatedAt, &wp.UpdatedAt); err == nil {
				if picID.Valid {
					wp.PicID = &picID.String
				}
				summary.ProgramStats = append(summary.ProgramStats, wp)
			}
		}
	}

	// 7. Unit Events breakdown
	unitRows, err := h.DB.Query(`SELECT unit, COUNT(*) FROM events WHERE period = ? GROUP BY unit`, period)
	if err == nil {
		defer unitRows.Close()
		for unitRows.Next() {
			var unit string
			var count int
			if err := unitRows.Scan(&unit, &count); err == nil {
				summary.UnitEventsSummary[unit] = count
			}
		}
	}

	// 8. Work Program Status Counts
	statusQuery := `SELECT status, COUNT(*) FROM work_programs WHERE period = ?`
	statusArgs := []interface{}{period}
	if division != "" && division != "Global" {
		statusQuery += " AND division = ?"
		statusArgs = append(statusArgs, division)
	}
	statusQuery += " GROUP BY status"

	stRows, err := h.DB.Query(statusQuery, statusArgs...)
	if err == nil {
		defer stRows.Close()
		for stRows.Next() {
			var st string
			var count int
			if err := stRows.Scan(&st, &count); err == nil {
				summary.StatusCounts[st] = count
			}
		}
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Data: summary,
	})
}
