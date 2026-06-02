# Faz 9 — İleri Düzey Test Disiplinleri

Bu doküman, Faz 9'da kurulan beş ileri test pratiğini, **ne işe yaradıklarını**
ve **nasıl çalıştırılacaklarını** açıklar. Hepsi kuruldu ve CI'a bağlandı;
gerçek koşum gerektiren adımlar aşağıda açıkça işaretlendi.

| # | Disiplin | Araç | Tetik | Bloke eder mi? |
|---|----------|------|-------|----------------|
| 1 | Visual regression | Playwright `toHaveScreenshot` | PR | Baseline varsa evet |
| 2 | Performance budget | Lighthouse CI | PR | Evet (`error` assertion'ları) |
| 3 | Contract testing | Pact (consumer+provider) | PR | Consumer evet, provider henüz hayır |
| 4 | Load testing | Locust | Manuel | Hayır |
| 5 | Mutation %85 | Stryker + mutmut | Haftalık cron | Hayır (raporlar) |

---

## 1. Visual Regression (Playwright)

**Sorun:** Fonksiyonel testler "buton çalışıyor mu?" der ama "doğru görünüyor
mu?" diyemez. CSS/layout bozulması sessizce geçer.

**Çözüm:** Sayfanın ekran görüntüsünü onaylı baseline ile piksel piksel
karşılaştırır.

**Dosyalar:** `frontend/playwright.visual.config.ts`,
`frontend/e2e-visual/visual.spec.ts`,
baseline'lar → `frontend/e2e-visual/__screenshots__/<platform>/...`

```powershell
cd frontend
npm run test:visual:update   # İLK koşum: baseline üretir (commit edilmeli)
npm run test:visual          # Sonraki koşumlar: karşılaştırır
```

> ⚠️ **Gerçek koşum gerekir:** Baseline görüntüler henüz üretilmedi. Font
> rendering OS'a bağlı olduğu için baseline **Linux'ta (CI)** üretilip
> commit'lenmeli. `visual-regression.yml` workflow'unu `update_baseline=true`
> ile manuel tetikleyip artifact'tan inip commit'leyin. Yerel Windows
> baseline'ı CI'da patlar.

---

## 2. Performance Budget (Lighthouse CI)

**Sorun:** Eklenen kod siteyi sessizce yavaşlatır; kimse fark etmez.

**Çözüm:** Her PR'da Lighthouse çalışır; `lighthouserc.json`'daki bütçe
(`error` assertion'ları) aşılırsa job FAIL.

**Dosyalar:** `frontend/lighthouserc.json`, `.github/workflows/lighthouse.yml`

**Bütçe (`error` = bloke eder):**
- Performance score ≥ 0.8, Accessibility ≥ 0.9
- LCP ≤ 2.5s, CLS ≤ 0.1

```powershell
cd frontend
npm install --no-save @lhci/cli   # ana lockfile'ı bozmamak için --no-save
npm run build
npm run lhci
```

> ⚠️ **Gerçek koşum gerekir:** `@lhci/cli` ana `package.json`'a eklenmedi
> (lockfile/`npm ci` uyumu için). CI ve yerel kullanımda `--no-save` ile kurulur.

---

## 3. Contract Testing (Pact)

**Sorun:** Frontend "API şu alanları döndürür" varsayar; backend sessizce bir
alanı değiştirir → frontend production'da patlar, kimse önceden yakalayamaz.

**Çözüm (Consumer-Driven):**
1. **Consumer** (frontend) beklentisini bir pact dosyasına döker.
2. **Provider** (backend) bu sözleşmeye uyup uymadığını gerçek istekle doğrular.

**Dosyalar:**
`frontend/pact/consumer/patients.pact.test.ts`,
`frontend/vitest.pact.config.ts` (MSW çakışmasını önlemek için ayrı config),
`backend/contracts/verify_provider.py`,
`.github/workflows/contract-tests.yml`

```powershell
# 1) Consumer — pact dosyası üretir (frontend/pacts/)
cd frontend
npm install --no-save @pact-foundation/pact
npm run test:pact

# 2) Provider — backend ayakta + seed'li olmalı (PostgreSQL modu)
cd ../backend
pip install pact-python
# (ayrı terminalde) python manage.py runserver
$env:PACT_VERIFY_TOKEN = "<standard tenant admin access token>"
python contracts/verify_provider.py
```

> ⚠️ **Provider doğrulaması gerçek koşum gerektirir:** Sözleşmedeki örnek
> token sahtedir; gerçek backend onu reddeder. Verification sırasında geçerli
> bir token `PACT_VERIFY_TOKEN` ile enjekte edilir (detay script başlığında).
> CI'da provider job'ı şimdilik `continue-on-error: true` — raporlar ama
> merge'i bloke etmez. Olgunlaştıkça required check'e çevrilebilir.

---

## 4. Load Testing (Locust)

**Sorun:** Sistem 1 kullanıcıyla çalışır; ya aynı anda 500 klinik istek atarsa?

**Çözüm:** Locust yüzlerce sahte kullanıcıyı sisteme saldırtır. Her sanal
kullanıcı rastgele bir tenant seçip `X-Tenant` header'ı ile istek atar →
hem yük hem schema-switching maliyeti ölçülür.

**Dosyalar:** `backend/loadtests/locustfile.py`, `.github/workflows/load-test.yml`

```powershell
cd backend
pip install locust
# Backend PostgreSQL modunda + seed'li ayakta olmalı, sonra:

# İnteraktif (http://localhost:8089):
locust -f loadtests/locustfile.py --host http://localhost:8000

# Headless: 50 kullanıcı, 5/sn spawn, 1 dakika:
locust -f loadtests/locustfile.py --host http://localhost:8000 `
       --headless -u 50 -r 5 -t 1m --csv loadtests/results
```

> Ana CI'da **değil** (pahalı/ortam-bağımlı). `load-test.yml` ile manuel
> tetiklenir; kullanıcı sayısı/süre input olarak verilir, sonuç CSV'leri
> artifact olur.

---

## 5. Mutation Score'u %85'e Çekmek

**Sorun:** Yüksek coverage "kod çalıştırıldı" der ama "sonuç doğru kontrol
edildi" demez (bkz. PRESENTATION.md, Bölüm 10).

**Çözüm:** Koda kasıtlı hata (mutant) sokulur; test patlamazsa o mutant
"hayatta kaldı" = test boşluğu. Faz 9 hedefi kritik modüllerde %85 taban.

**Dosyalar:** `frontend/stryker.conf.json` (YENİ — önceden config'siz çağrılıyordu),
`backend/setup.cfg` `[mutmut]`, `.github/workflows/mutation.yml`

```powershell
# Frontend (Stryker):
cd frontend
npm install --no-save @stryker-mutator/core @stryker-mutator/vitest-runner
npm run test:mutation        # reports/mutation/index.html üretir

# Backend (mutmut):
cd backend
mutmut run
mutmut results               # özet
mutmut show <id>             # hayatta kalan mutant'ı incele
```

> ⚠️ **İteratif, uzun süren gerçek koşum gerektirir:** Ölçülen skoru %85'e
> çıkarmak; mutmut/Stryker'ı çalıştırıp hayatta kalan her mutant için yeni
> test yazmak demektir. Bu oturumda **config + hedefler** kuruldu (Stryker
> `thresholds.high=85`); skoru fiilen %85'e taşımak ayrı bir test-yazma turu.
> `break` eşiği şimdilik 60; testler güçlendikçe kademeli 85'e çıkarılacak.

---

## Özet: Bu oturumda ne YAPILDI, ne GERÇEK KOŞUM bekliyor

**Yapıldı (kuruldu + CI'a bağlandı + doğrulandı):**
- 5 disiplinin tüm config/test/script dosyaları
- 4 yeni GitHub Actions workflow + mevcut mutation.yml'in eksik Stryker config'i
- `package.json` script'leri, `requirements-dev.txt` bağımlılıkları, `.gitignore`
- Python dosyaları `py_compile` ile, JSON'lar parse ile doğrulandı

**Gerçek koşum bekliyor (ortam/paket/iterasyon gerektirir):**
- Visual baseline görüntülerin CI'da üretilip commit'lenmesi
- Lighthouse/Pact/Stryker'ın ilk tam koşumu (paket kurulumu sonrası)
- Mutation score'un fiilen %85'e çıkarılması (iteratif test yazımı)
