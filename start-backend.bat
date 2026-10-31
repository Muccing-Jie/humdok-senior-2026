@echo off
title HUMDOK MANAGEMENT - Backend Server
echo Starting Go Gin Backend on http://localhost:8080...
cd /d "%~dp0backend"
set PATH=%~dp0..\tools\go\bin;%PATH%
server.exe
pause
