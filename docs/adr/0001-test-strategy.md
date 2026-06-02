# ADR 0001: Test Stratejisi — Tooling Seçimi

**Date:** 2026-05-29
**Status:** Accepted

## Context

Yaşca SaaS dental clinic — Django backend, React frontend, multi-tenant. Test stack seçilmesi gerekiyor.

## Decision

### Backend
- **pytest + pytest-django**: factory-boy, fixture, parametrize.
- **factory-boy + Faker** (tr_TR locale): test data üretimi.
- **pytest-cov**: coverage gate.
- **django-tenants test cases**: multi-tenant izolasyon.

### Frontend Unit
- **Vitest**: Vite ekosistemi ile native uyum, Jest'ten ~3x hızlı.
- **@testing-library/react + user-event**: kullanıcı-odaklı sorgu.
- **MSW (Mock Service Worker)**: API mock, network bypass.
- **vitest-axe**: a11y unit check (Faz 3).

### E2E
- **Playwright**: çoklu browser, trace viewer, interactive UI mode.
- **@axe-core/playwright**: E2E a11y (Faz 3).

### Yan Alınmayan Yollar
- ❌ Jest: Vite ile config karmaşık, vitest kadar hızlı değil.
- ❌ Cypress: Multi-tenant subdomain test'i için Playwright daha esnek.
- ❌ Mock fetch manuel: MSW network-layer mock için endüstri standardı.

## Consequences

✅ Hızlı feedback (Vite + Vitest).
✅ Test'ler API contract'ı koruyor (MSW network-layer interception).
✅ E2E browser-specific davranışları yakalıyor (focus trap, klavye).
⚠️ Vitest 4.x yeni, ekosistem bazı kütüphanelerle uyumsuz olabilir (jest-axe değil vitest-axe gerekti).
⚠️ Playwright Linux Docker'da Windows lokalden farklı font rendering — visual regression yok.

## Notlar

- Test pyramid hedefi: 70/20/10. Detay: `TEST_PYRAMID.md`.
- Naming convention: Türkçe description, İngilizce class. Detay: `TESTING.md`.
