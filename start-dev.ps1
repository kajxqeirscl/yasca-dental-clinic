<#
.SYNOPSIS
Starts the Yaşca Dental development environment using Docker.
#>

Write-Host "Starting Yaşca Dental Development Environment with Docker..." -ForegroundColor Cyan

docker-compose up --build

Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
