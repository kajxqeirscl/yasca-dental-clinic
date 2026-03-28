<#
.SYNOPSIS
Starts the Yaşca Dental frontend and backend development servers in separate windows.
#>

Write-Host "Starting Yaşca Dental Development Servers..." -ForegroundColor Cyan

# Start Backend
Write-Host "Starting Backend (Django)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; python manage.py runserver" -WorkingDirectory $PSScriptRoot

# Start Frontend
Write-Host "Starting Frontend (React/Vite)..." -ForegroundColor Blue
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "npm run frontend" -WorkingDirectory $PSScriptRoot

Write-Host "Processes launched in separate windows." -ForegroundColor Yellow
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
