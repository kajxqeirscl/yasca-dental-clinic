Set-Location backend
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Hata: venv bulunamadı. Lütfen önce backend kurulumunu tamamlayın." -ForegroundColor Red
    exit 1
}

Write-Host "Mevcut veritabanı sıfırlanıyor..." -ForegroundColor Yellow
python manage.py flush --no-input

Write-Host "Örnek veriler oluşturuluyor..." -ForegroundColor Yellow
python manage.py seed_demo_data

Write-Host "Demo verisi oluşturma işlemi tamamlandı." -ForegroundColor Green
Set-Location ..
