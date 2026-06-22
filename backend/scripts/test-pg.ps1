# PostgreSQL modunda pytest çalıştıran tek-komut script.
#
# Yapar:
#   1. docker-compose.test.yml ile yascadb_test container'ını başlatır (port 5433).
#   2. PostgreSQL'in hazır olmasını bekler.
#   3. DATABASE_URL env var'ı set eder.
#   4. pytest çalıştırır (parametreler script'e iletilir: ./test-pg.ps1 -m requires_postgres).
#   5. Test bittikten sonra container'ı durdurur (opsiyonel, -KeepRunning ile koru).
#
# Kullanım:
#   .\scripts\test-pg.ps1                         # Tüm testler PG mode'da
#   .\scripts\test-pg.ps1 -m requires_postgres    # Sadece PG-spesifik testler
#   .\scripts\test-pg.ps1 -KeepRunning            # Container ayakta kalsın

param(
    [switch]$KeepRunning = $false,
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$PytestArgs
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RepoRoot = Resolve-Path (Join-Path $ScriptRoot "..\..")

Write-Host "==> PG test container başlatılıyor..." -ForegroundColor Cyan
docker compose -f (Join-Path $RepoRoot "docker-compose.test.yml") up -d

Write-Host "==> PostgreSQL hazır olması bekleniyor..." -ForegroundColor Cyan
$maxWait = 30
$waited = 0
while ($waited -lt $maxWait) {
    $health = docker inspect --format='{{.State.Health.Status}}' yasca_db_test 2>$null
    if ($health -eq "healthy") {
        Write-Host "==> PostgreSQL hazır." -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
    $waited++
}
if ($waited -ge $maxWait) {
    Write-Error "PostgreSQL $maxWait saniyede hazır olmadı. Loglara bak: docker logs yasca_db_test"
    exit 1
}

$env:DATABASE_URL = "postgresql://postgres:postgres123@localhost:5433/yascadb_test"
Write-Host "==> DATABASE_URL set'lendi: $env:DATABASE_URL" -ForegroundColor Cyan

Push-Location (Join-Path $RepoRoot "backend")
try {
    Write-Host "==> pytest çalışıyor..." -ForegroundColor Cyan
    python -m pytest @PytestArgs
    $pytestExit = $LASTEXITCODE
}
finally {
    Pop-Location
}

if (-not $KeepRunning) {
    Write-Host "==> Container kapatılıyor..." -ForegroundColor Cyan
    docker compose -f (Join-Path $RepoRoot "docker-compose.test.yml") down
} else {
    Write-Host "==> Container ayakta bırakıldı (yasca_db_test, port 5433)." -ForegroundColor Yellow
}

exit $pytestExit
