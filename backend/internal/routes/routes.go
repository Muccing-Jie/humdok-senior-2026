package routes

import (
	"database/sql"
	"net/http"

	"humdok-backend/internal/config"
	"humdok-backend/internal/handlers"
	"humdok-backend/internal/middleware"
	"humdok-backend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(db *sql.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// CORS Setup
	corsConfig := cors.DefaultConfig()
	origins := []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	if cfg.CorsOrigin != "" && cfg.CorsOrigin != "http://localhost:3000" && cfg.CorsOrigin != "http://127.0.0.1:3000" {
		origins = append(origins, cfg.CorsOrigin)
	}
	corsConfig.AllowOrigins = origins
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Accept", "X-Requested-With"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	r.Use(cors.New(corsConfig))

	// Health check endpoint
	r.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "app": "HUMAS & PUBDOK MANAGEMENT UKM SENIOR PNUP", "version": "1.0.0"})
	})

	// Handlers
	authHandler := handlers.NewAuthHandler(db, cfg)
	dashboardHandler := handlers.NewDashboardHandler(db)
	boardMemberHandler := handlers.NewBoardMemberHandler(db)
	workProgramHandler := handlers.NewWorkProgramHandler(db)
	eventHandler := handlers.NewEventHandler(db)
	scheduleHandler := handlers.NewScheduleHandler(db)
	pubHandler := handlers.NewPublicationHandler(db)
	docHandler := handlers.NewDocumentationHandler(db)
	achHandler := handlers.NewAchievementHandler(db)
	userHandler := handlers.NewUserHandler(db)
	activityLogHandler := handlers.NewActivityLogHandler(db)

	api := r.Group("/api/v1")

	// Public Auth routes
	api.POST("/auth/login", authHandler.Login)

	// Authenticated routes
	authGroup := api.Group("")
	authGroup.Use(middleware.AuthMiddleware(cfg))
	{
		// Auth profile & logout
		authGroup.GET("/auth/me", authHandler.Me)
		authGroup.POST("/auth/logout", authHandler.Logout)

		// Dashboard
		authGroup.GET("/dashboard", dashboardHandler.GetSummary)

		// Activity Logs (Read-only for all roles with scoped results)
		authGroup.GET("/activity-logs", activityLogHandler.List)

		// Board Members (Pengurus)
		authGroup.GET("/board-members", boardMemberHandler.List)
		authGroup.GET("/board-members/:id", boardMemberHandler.GetByID)
		{
			// Mutating routes restricted to Super Admin and Humas
			humasOrAdmin := authGroup.Group("/board-members")
			humasOrAdmin.Use(middleware.RequireRole(models.RoleSuperAdmin, models.RoleHumas))
			humasOrAdmin.POST("", boardMemberHandler.Create)
			humasOrAdmin.PUT("/:id", boardMemberHandler.Update)
			humasOrAdmin.DELETE("/:id", boardMemberHandler.Delete)
		}

		// Work Programs (Program Kerja)
		authGroup.GET("/work-programs", workProgramHandler.List)
		authGroup.GET("/work-programs/:id", workProgramHandler.GetByID)
		authGroup.POST("/work-programs", workProgramHandler.Create)
		authGroup.PUT("/work-programs/:id", workProgramHandler.Update)
		authGroup.DELETE("/work-programs/:id", workProgramHandler.Delete)

		// Events (Kegiatan)
		authGroup.GET("/events", eventHandler.List)
		authGroup.GET("/events/:id", eventHandler.GetByID)
		{
			// Mutating routes restricted to Super Admin and Humas (Pubdok only reads)
			eventMutate := authGroup.Group("/events")
			eventMutate.Use(middleware.RequireRole(models.RoleSuperAdmin, models.RoleHumas))
			eventMutate.POST("", eventHandler.Create)
			eventMutate.PUT("/:id", eventHandler.Update)
			eventMutate.DELETE("/:id", eventHandler.Delete)
		}

		// Schedules (Kalender Kegiatan & Checklist)
		authGroup.GET("/schedules", scheduleHandler.List)
		authGroup.GET("/schedules/:id", scheduleHandler.GetByID)
		authGroup.POST("/schedules", scheduleHandler.Create)
		authGroup.PUT("/schedules/:id", scheduleHandler.Update)
		authGroup.PATCH("/schedules/:id/toggle", scheduleHandler.Toggle)
		authGroup.DELETE("/schedules/:id", scheduleHandler.Delete)

		// Publications (Khusus Pubdok & Super Admin)
		pubdokPubs := authGroup.Group("/publications")
		pubdokPubs.Use(middleware.RequireRole(models.RoleSuperAdmin, models.RolePubdok))
		{
			pubdokPubs.GET("", pubHandler.List)
			pubdokPubs.GET("/:id", pubHandler.GetByID)
			pubdokPubs.POST("", pubHandler.Create)
			pubdokPubs.PUT("/:id", pubHandler.Update)
			pubdokPubs.DELETE("/:id", pubHandler.Delete)
		}

		// Documentations (Khusus Pubdok & Super Admin)
		pubdokDocs := authGroup.Group("/documentations")
		pubdokDocs.Use(middleware.RequireRole(models.RoleSuperAdmin, models.RolePubdok))
		{
			pubdokDocs.GET("", docHandler.List)
			pubdokDocs.GET("/:id", docHandler.GetByID)
			pubdokDocs.POST("", docHandler.Create)
			pubdokDocs.PUT("/:id", docHandler.Update)
			pubdokDocs.DELETE("/:id", docHandler.Delete)
		}

		// Achievements (Khusus Pubdok & Super Admin)
		pubdokAchs := authGroup.Group("/achievements")
		pubdokAchs.Use(middleware.RequireRole(models.RoleSuperAdmin, models.RolePubdok))
		{
			pubdokAchs.GET("", achHandler.List)
			pubdokAchs.GET("/:id", achHandler.GetByID)
			pubdokAchs.POST("", achHandler.Create)
			pubdokAchs.PUT("/:id", achHandler.Update)
			pubdokAchs.DELETE("/:id", achHandler.Delete)
		}

		// Users & Access (Khusus Super Admin)
		adminUsers := authGroup.Group("/users")
		adminUsers.Use(middleware.RequireRole(models.RoleSuperAdmin))
		{
			adminUsers.GET("", userHandler.List)
			adminUsers.GET("/:id", userHandler.GetByID)
			adminUsers.POST("", userHandler.Create)
			adminUsers.PUT("/:id", userHandler.Update)
			adminUsers.DELETE("/:id", userHandler.Delete)
		}
	}

	return r
}
