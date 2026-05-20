Write-Host "Mevcut veritabanı sıfırlanıyor (Docker üzerinden)..." -ForegroundColor Yellow
docker-compose exec backend python manage.py flush --no-input

Write-Host "Demo verileri için gerekli paketler kuruluyor (faker, factory-boy)..." -ForegroundColor Yellow
docker-compose exec backend pip install factory-boy faker

Write-Host "Örnek veriler oluşturuluyor..." -ForegroundColor Yellow
docker-compose exec backend python manage.py seed_demo_data

Write-Host "Demo verisi oluşturma işlemi tamamlandı." -ForegroundColor Green
