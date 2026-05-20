Write-Host "Veritabanı sıfırlanıyor ve örnek veriler oluşturuluyor..." -ForegroundColor Yellow

docker-compose run --rm backend sh -c "python manage.py flush --no-input && pip install factory-boy faker && python manage.py seed_demo_data"

Write-Host "Demo verisi oluşturma işlemi tamamlandı." -ForegroundColor Green
