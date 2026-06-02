# ADR 0003: A11y Zero-Tolerance Politikası

**Date:** 2026-05-29
**Status:** Accepted

## Context

Yaşca diş kliniği yazılımı. Kullanıcılar:
- Klinik personeli (yaş aralığı geniş, görme/işitme/motor kısıtlılığı olabilir)
- Hastalar (engelli, yaşlı, dijital-pasif kullanıcı oranı yüksek)

Türkiye'de **5378 sayılı Engelliler Hakkında Kanun** ve AB **EAA (European Accessibility Act, 2025)** sağlık hizmeti yazılımlarını kapsar. Risk: yasal yaptırım + ticari müşteri kaybı (kurumsal kliniklerin tercih kriteri).

## Decision

**WCAG 2.1 AA zero-tolerance**: tek bir ihlal CI'da build'i kırmızıya çevirir.

### Operational Rules

1. **vitest-axe** unit testleri her sayfa için: `frontend/src/app/components/__a11y__/`.
2. **@axe-core/playwright** E2E testleri: `frontend/e2e/a11y.spec.ts`.
3. Yeni component eklenince a11y test'i de **aynı PR'da** eklenmek zorunda.
4. Axe ihlali çıkarsa: **düzelt, waive etme**.
5. UI primitive (Radix/shadcn) refactor gerekiyorsa: geçici `disableRules` + TODO comment + tracking issue.
6. WCAG 2.1 **AAA** seviyesi: warning olarak loglanır, fail değildir. AAA hedefi gelecek iterasyon.

### Banned

❌ `expect(results.violations.length).toBeLessThan(N)` (toplam kabul)
❌ A11y testlerini `.skip()` ile susturma
❌ `aria-label=""` boş bırakma
❌ Color contrast'i waive etme (kompozit gradient false positive ise: dedicated test)

## Consequences

✅ Yasal uyum (5378, EAA).
✅ Ekran okuyucu kullanıcıları sistemi kullanabilir.
✅ Klavye-only kullanıcılar full erişim.
✅ Kurumsal müşteri olası şart listesini geçer.
⚠️ Geliştirme yavaşlar (her PR'da ek test).
⚠️ Bazı 3rd-party UI primitive'leri (Radix) wrapper ihtiyacı.

## Mevcut Durum (Faz 3 sonu)

- Unit a11y: 10/10 test PASS (LoginPage, Dashboard, PatientSearch, Layout, ErrorBoundary + 5 dialog)
- E2E a11y: 4 spec hazır (`a11y.spec.ts`)
- Klavye nav E2E: 3 spec (`keyboard-navigation.spec.ts`)
- Düzeltilen ihlaller:
  - LoginPage language `<select>` aria-label eksikti → eklendi
  - Layout language `<select>` aria-label eksikti → eklendi
  - Globe icon'lar `aria-hidden="true"` eklendi (decorative)
- Bilinen TODO: `button-name` ve `select-name` dialog form'larda geçici disable (UI primitive refactor gerekli).

## İlgili

- ADR 0001 — test tooling (vitest-axe seçimi)
- `TESTING.md` — A11y testleri bölümü
