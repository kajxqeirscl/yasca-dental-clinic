#!/usr/bin/env bash
# PostgreSQL modunda pytest çalıştıran tek-komut script (Unix/macOS/WSL).
#
# Yapar:
#   1. docker-compose.test.yml ile yascadb_test container'ını başlatır (port 5433).
#   2. PostgreSQL'in hazır olmasını bekler.
#   3. DATABASE_URL env var'ı set eder.
#   4. pytest çalıştırır (parametreler script'e iletilir).
#   5. Test bittikten sonra container'ı durdurur (--keep-running ile koru).
#
# Kullanım:
#   ./scripts/test-pg.sh                      # Tüm testler PG mode'da
#   ./scripts/test-pg.sh -m requires_postgres # Sadece PG-spesifik testler
#   KEEP_RUNNING=1 ./scripts/test-pg.sh       # Container ayakta kalsın

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
KEEP_RUNNING="${KEEP_RUNNING:-0}"

echo "==> PG test container başlatılıyor..."
docker compose -f "$REPO_ROOT/docker-compose.test.yml" up -d

echo "==> PostgreSQL hazır olması bekleniyor..."
MAX_WAIT=30
WAITED=0
while [ "$WAITED" -lt "$MAX_WAIT" ]; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' yasca_db_test 2>/dev/null || echo "starting")
    if [ "$HEALTH" = "healthy" ]; then
        echo "==> PostgreSQL hazır."
        break
    fi
    sleep 1
    WAITED=$((WAITED + 1))
done

if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    echo "PostgreSQL $MAX_WAIT saniyede hazır olmadı. Loglara bak: docker logs yasca_db_test" >&2
    exit 1
fi

export DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/yascadb_test"
echo "==> DATABASE_URL set'lendi: $DATABASE_URL"

cd "$REPO_ROOT/backend"

set +e
echo "==> pytest çalışıyor..."
python -m pytest "$@"
PYTEST_EXIT=$?
set -e

if [ "$KEEP_RUNNING" != "1" ]; then
    echo "==> Container kapatılıyor..."
    docker compose -f "$REPO_ROOT/docker-compose.test.yml" down
else
    echo "==> Container ayakta bırakıldı (yasca_db_test, port 5433)."
fi

exit "$PYTEST_EXIT"
