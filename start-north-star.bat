@echo off
REM Double-clickable wrapper around start-north-star.ps1.
REM Uses PowerShell's -ExecutionPolicy Bypass scoped to this single process
REM only — it does not change your system's execution policy.

setlocal
set SCRIPT_DIR=%~dp0

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%start-north-star.ps1"

if errorlevel 1 (
  echo.
  echo North Star did not start cleanly. Scroll up for details.
  pause
)
