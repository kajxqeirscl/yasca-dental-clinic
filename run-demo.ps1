Write-Host "Generating multi-tenant SaaS demo data..." -ForegroundColor Yellow

docker-compose run --rm backend sh -c "python manage.py seed_demo_data"

Write-Host "Demo data generation completed successfully." -ForegroundColor Green
Write-Host "Check the README.md for the list of generated clinics and users." -ForegroundColor Cyan
