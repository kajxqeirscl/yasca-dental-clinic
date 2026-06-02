# Test Pyramid — Yaşca Dental Clinic

## Hedef Oran

```
            /\
           /E2E\         10%  — Playwright (browser, real backend)
          /------\
         /Integ.  \      20%  — APIClient/vitest+MSW (no real DB/network)
        /----------\
       /   Unit     \    70%  — pytest unit / vitest component (isolated)
      /______________\
```

Sağlık yazılımı + multi-tenant kompleksitesi → unit ağırlıklı piramit.
E2E pahalı ve yavaş, ama izolasyon doğrulaması için zorunlu.

## Mevcut Durum (otomatik güncellenecek)

> Bu bölüm `scripts/test-metrics.py` tarafından her main push'tan sonra otomatik güncellenir (Faz 8).

| Katman | Sayı | % | Hedef % | Durum |
|---|---|---|---|---|
| Backend unit (pytest) | 148 | 49% | 70% | ✅ İyi |
| Frontend unit (vitest) | 151 | 50% | 70% | ✅ İyi |
| E2E (Playwright) | 76 | ~25% | 10% | ⚠️ Çok fazla |

**Not**: E2E sayısı şu an piramidin üstüne göre yüksek — Faz 2'de eklenen deep dialog testleri unit oranını yükseltti. Zamanla denge sağlanacak.

## Neden Bu Oran?

### Unit (%70 hedef)
- En hızlı: ~5-200ms / test
- En izole: Mock'lar deterministik
- TDD döngüsünde en sık çalışan
- Coverage hedeflerine ulaşmanın ana yolu

### Integration (%20 hedef)
- API contract doğrulaması (serializer, view, permission)
- MSW ile network'siz frontend integration
- ~100-2000ms / test
- DB tabanlı ama tek tenant

### E2E (%10 hedef)
- Cross-system flow (multi-tenant register, login → dashboard → CRUD)
- Browser-specific (Radix portal, focus trap, klavye)
- ~5-30s / test
- En pahalı, en az dayanıklı (flaky riski)

## Anti-pattern: "Tersine Piramit"

```
       ______________
      \    E2E       /  ← çok yüksek
       \____________/
        \  Integ.  /
         \________/
          \ Unit /        ← çok az
           \____/
```

Yaşamak için: E2E pahalı, yavaş, flaky. Coverage yetersiz. Bug feedback geç gelir. Bu projede **kabul edilemez**.

## Migrasyon Stratejisi

E2E'den unit'e taşıma:
1. E2E test'in hangi davranışı doğruladığını belirle
2. Aynı davranışı unit/integration katmanında MSW ile test edebilir misin? → ✅ E2E'yi sil, unit yaz.
3. Sadece browser-spesifik (focus, scroll, klavye) ise → E2E'de kal.

## Hedef Sayılar (Plan Sonu)

| Katman | Şu an | Hedef |
|---|---|---|
| Backend unit | 148 | 180 (+32 PG isolation) |
| Frontend unit | 151 | 200 (+50 dialog deep, +12 a11y) |
| E2E | 76 | 80 (+4 a11y) |
| **Toplam** | **375** | **460** |

## İzleme

- Coverage: Codecov dashboard
- Mutation score: Stryker dashboard (Faz 5 sonu)
- Test count: bu dosya (Faz 8 sonu otomatik)
- Slow test budget: `--durations=20` her CI run'da raporlanır
