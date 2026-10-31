@echo off
title HUMDOK MANAGEMENT - UKM SENIOR PNUP
echo ==============================================================
echo  HUMAS ^& PUBDOK MANAGEMENT — UKM SENIOR PNUP (Periode 2026)
echo  Menjalankan Decoupled Client-Server (Go Gin + Next.js React)
echo ==============================================================

start "Backend Server (Go Gin)" cmd /k "%~dp0start-backend.bat"
timeout /t 2 >nul
start "Frontend App (Next.js)" cmd /k "%~dp0start-frontend.bat"

echo.
echo Aplikasi sedang dijalankan:
echo - Backend API : http://localhost:8080/api/v1
echo - Frontend UI : http://localhost:3000
echo.
echo Buka browser pada http://localhost:3000 untuk masuk.
echo Akun Demo:
echo   - Super Admin: admin@humdok.local / admin123
echo   - Divisi Humas: div_humas@humdok.local / humas123
echo   - Divisi Pubdok: div_pubdok@humdok.local / pubdok123
echo.
pause
