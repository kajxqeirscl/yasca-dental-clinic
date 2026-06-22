<#
.SYNOPSIS
Starts the Yaşca Dental development environment using Docker.
#>

Write-Host "Starting Yaşca Dental Development Environment..." -ForegroundColor Cyan

$CurrentPath = (Get-Location).Path

Write-Host "1. Starting Backend and Database (Docker) in a new window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$CurrentPath`"; Write-Host '--- BACKEND & DATABASE LOGS ---' -ForegroundColor Cyan; docker-compose up --build"

Write-Host "2. Installing Frontend Dependencies..." -ForegroundColor Yellow
npm install --prefix frontend

Write-Host "3. Starting Frontend Natively in a new window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$CurrentPath`"; Write-Host '--- FRONTEND LOGS ---' -ForegroundColor Cyan; npm run dev --prefix frontend"

Write-Host "==========================================" -ForegroundColor Green
Write-Host " Environment started in separate windows! " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Backend API  : http://localhost:8000"
Write-Host "Frontend App : http://localhost:5173"
