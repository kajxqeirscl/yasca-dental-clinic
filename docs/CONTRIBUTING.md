# Katkı Rehberi — Yaşca Dental Clinic

## PR Süreci

1. **Branch oluştur**: `feat/foo-bar`, `fix/issue-123`, `test/dialog-coverage` gibi prefix kullan.
2. **Commit mesajı**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`.
3. **Test ekle**: Yeni feature → unit + (gerekirse) E2E. Bug fix → regression test.
4. **PR aç**: Template şablonunu doldur (`.github/PULL_REQUEST_TEMPLATE.md`).
5. **CI yeşil olmalı**: SQLite + PostgreSQL matrix + a11y + lint.
6. **Code review**: En az 1 onay gerekir.
7. **Squash & merge**: Final commit Conventional Commits formatında olmalı.

## Code Review Checklist

### Test gereksinimleri
- [ ] Yeni feature için unit test var
- [ ] Multi-tenant kod değişiyorsa: PostgreSQL mode'da test edildi (`.\scripts\test-pg.ps1`)
- [ ] Dialog/page değiştiyse: a11y test güncel
- [ ] Coverage düşmedi (`vitest.config.ts` threshold)
- [ ] Tests Türkçe description, İngilizce class/function

### Kod kalitesi
- [ ] Lint geçti (`eslint --max-warnings 0`)
- [ ] TypeScript hatası yok (`npx tsc --noEmit`)
- [ ] Magic number/string yok
- [ ] Console.log/print kalmadı

### Güvenlik
- [ ] Multi-tenant query doğru filter'lanmış mı (clinic_id, user_id)
- [ ] Hassas alan log'lanmıyor (password, TCKN)
- [ ] SQL injection riski yok (parametrized query)

### A11y
- [ ] Yeni input → label var
- [ ] Yeni button (icon-only) → `aria-label` var
- [ ] Color contrast WCAG 2.1 AA (4.5:1 normal, 3:1 large)
- [ ] Klavye nav: Tab order mantıklı, Esc/Enter çalışır

## Commit Mesaj Örnekleri

```
feat(appointments): conflict detection için saat slot validation ekle
fix(auth): X-Tenant header refresh isteğinde kayboluyordu
test(dialog): AppointmentDialog edge case'leri için 8 yeni test
docs(testing): PostgreSQL mode walkthrough ekle
refactor(api): patient serializer nested anamnesis logic'i sadeleştir
chore(deps): vitest 4.1.5 → 4.2.0
```

## Banned Practices

❌ `git commit --no-verify` (pre-commit hook bypass)
❌ Coverage threshold düşürme
❌ A11y violation waive etme (UI fix gerekiyorsa: TODO + tracking issue)
❌ `@pytest.mark.skip` reason'sız
❌ Console.log/print/debugger kalmış kod
❌ TypeScript `any` (gerekirse: `unknown` veya proper type)

## Hızlı Komutlar

```powershell
# Tüm test'ler yeşil mi?
cd backend; pytest -q
cd frontend; npm test

# PG mode (multi-tenant değişikliği için):
cd backend; .\scripts\test-pg.ps1

# A11y kontrolü:
cd frontend; npm test -- __a11y__

# Coverage durumu:
cd frontend; npm run test:coverage
```
