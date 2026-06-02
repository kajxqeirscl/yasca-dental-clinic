<!--
PR Template — Yaşca Dental Clinic
Lütfen tüm kutuları işaretle. İşaretlenemeyen varsa açıklayın.
-->

## Özet

<!-- 1-3 cümlede ne yapıyor bu PR? Neden? -->

## Değişiklik Tipi

- [ ] 🐛 Bug fix (geriye uyumlu)
- [ ] ✨ Yeni özellik (geriye uyumlu)
- [ ] 💥 Breaking change (API/contract değişti)
- [ ] 📚 Sadece dokümantasyon
- [ ] 🧪 Sadece test
- [ ] ♻️ Refactor (davranış değişmedi)
- [ ] 🎨 UI/UX değişikliği
- [ ] 🔧 Build / CI / tooling

## Test Checklist

### Backend
- [ ] `cd backend && pytest -q` lokalde geçti
- [ ] Multi-tenant kod değiştiyse: `.\scripts\test-pg.ps1` ile PostgreSQL mode'da test edildi
- [ ] Yeni endpoint/serializer için unit test eklendi
- [ ] Coverage düşmedi (gate %78)

### Frontend
- [ ] `cd frontend && npm test` lokalde geçti
- [ ] Yeni component için `.test.tsx` eklendi
- [ ] Yeni component/sayfa için a11y test eklendi (`__a11y__/`)
- [ ] Coverage düşmedi (vitest threshold)

### E2E
- [ ] Kullanıcı akışı değiştiyse: ilgili `e2e/*.spec.ts` güncel
- [ ] (Opsiyonel) `npx playwright test` lokalde geçti

## A11y Kontrolü

- [ ] Yeni input → `<label>` veya `aria-label` var
- [ ] İcon-only button → `aria-label` var
- [ ] Decorative icon → `aria-hidden="true"` var
- [ ] Color contrast WCAG 2.1 AA (4.5:1 normal text)
- [ ] Klavye-only akış test edildi (Tab/Enter/Esc)

## Güvenlik / Multi-tenant

- [ ] Yeni query'ler tenant-scoped (gerekli filter var)
- [ ] Hassas veri (password, TCKN) log'lanmıyor
- [ ] SQL injection riski yok (parametrized queries)

## Breaking Change Açıklaması

<!-- Sadece breaking change varsa doldur -->

## Ekran Görüntüsü / Video

<!-- UI değişikliği varsa: before/after -->

## İlişkili Issue / PR

Closes #
