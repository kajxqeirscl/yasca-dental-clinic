# ADR 0002: Multi-tenant İzolasyon Stratejisi

**Date:** 2026-05-29
**Status:** Accepted

## Context

SaaS sağlık yazılımı. Her klinik (tenant) verisini diğer kliniklerden tamamen izole tutmalı (KVKK + GDPR + ticari gizlilik).

3 alternatif değerlendirildi:

1. **Row-level FK (`clinic_id` her tabloda)**: Tek schema, query'ler `WHERE clinic_id = ?` filtre ile.
2. **PostgreSQL Row-Level Security (RLS)**: DB-level policy, her query otomatik filtre.
3. **Schema-per-tenant (django-tenants)**: Her tenant kendi PostgreSQL schema'sında.

## Decision

**Schema-per-tenant (django-tenants).**

### Neden?

| | FK | RLS | Schema |
|---|---|---|---|
| Veri sızıntı riski | Yüksek (developer hatası) | Düşük | Çok düşük |
| Query performansı | Index gerekir | Policy overhead | İzole |
| Migration | Tek | Tek | Tenant başına |
| Backup/restore (tek klinik) | Zor | Zor | Kolay (schema dump) |
| Debug | Tek schema, karışık | Karışık | Net |
| KVKK "veri silme hakkı" | DELETE WHERE | DELETE WHERE | DROP SCHEMA |

Sağlık verisi için **veri sızıntı riski** en kritik metrik. Schema isolation developer hatasına karşı en güçlü koruma.

### Trade-off'lar

⚠️ Migration karmaşıklığı: `migrate_schemas --tenant` her tenant'ta ayrı çalışır. Çözüm: helper script, CI'da paralelleştir.
⚠️ Cross-tenant query yok: Reporting/analytics için ayrı bir aggregation layer (gelecek).
⚠️ SQLite test ortamı uyumsuz: Faz 1'de dual-mode shim çözümü (bkz `core/settings_test.py`, `conftest.py`).

## Consequences

✅ Cross-tenant veri sızıntısı **schema seviyesinde** imkansız.
✅ Tenant-spesifik backup/restore.
✅ Schema rename = klinik adı değişikliği.
❌ Test ortamında shim gerekir (Faz 1'de çözüldü).
❌ Migration deploy süresi tenant sayısına lineer.

## Test Implikasyonu

- Cross-tenant isolation testleri zorunlu: `backend/api/tests/test_tenant_isolation.py`
- PostgreSQL test mode'unda 25-30 test, `FastTenantTestCase` kullanır.
- SQLite mode shim'i izolasyonu test edemez — bu kısıtlama açık şekilde belgelenmiş.

## İlgili

- ADR 0001 — test tooling
- `backend/core/settings.py` SHARED_APPS / TENANT_APPS yapılandırma
- `backend/api/middleware.py` HeaderTenantMiddleware
