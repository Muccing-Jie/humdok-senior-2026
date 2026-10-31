@echo off
title HUMDOK MANAGEMENT - Next.js Frontend
echo Starting Next.js Frontend on http://localhost:3000...
cd /d "%~dp0frontend"
set PATH=%~dp0..\tools\node-v20.18.0-win-x64;%PATH%
npm start
pause
