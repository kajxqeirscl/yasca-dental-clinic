---
marp: true
theme: default
paginate: true
header: 'Yaşca Dental Clinic — Test Stratejisi'
footer: 'Cihan Kurtbey · 2026'
---

<!-- _class: lead -->

# Yaşca Dental Clinic

## Kapsamlı Test Stratejisi ve Kalite Güvencesi

Multi-tenant SaaS Sağlık Yazılımı

**Cihan Kurtbey** · 2026


---

## Sunum Akışı

1. **Proje Tanıtımı** — Yaşca nedir, neden test bu kadar kritik?
2. **Temel Kavramlar** — Test türleri sıfırdan
3. **Test Stratejisi** — Test piramidi neden böyle?
4. **Kullanılan Teknolojiler** — Her aracı tek tek tanıyalım
5. **Backend Testing** — pytest, factory-boy, django-tenants
6. **Frontend Testing** — Vitest, MSW, Testing Library
7. **E2E Testing** — Playwright ile gerçek tarayıcı
8. **Erişilebilirlik (A11y)** — WCAG 2.1 AA zero-tolerance
9. **Multi-tenant Test Zorlukları** — Schema isolation
10. **Mutation Testing** — Coverage rakamları neden yalan söyler?
11. **CI/CD ve Quality Gates** — Otomatik kalite kapıları
12. **Sonuçlar ve Öğrenilen Dersler**

---

## 1. Proje Tanıtımı — Yaşca Nedir?

**Yaşca**, açık kaynaklı, **çok-kiracılı (multi-tenant)** bir diş kliniği
yönetim platformudur.

### "Multi-tenant" ne demek?

Tek bir yazılım kurulumu, **birden fazla ayrı kliniğe** aynı anda hizmet
verir. Her klinik (kiracı/tenant) sistemde vardır ama:

- A kliniği **asla** B kliniğinin hastasını göremez
- Her kliniğin verisi fiziksel olarak **ayrı bir bölmede** durur

> Benzer mantık: aynı apartman binası (yazılım), ama her dairenin (klinik)
> kapısı ayrı ve kimse komşusunun içini göremiyor. Bu izolasyonu
> sağlamak, bu projenin en kritik ve en çok test edilen kısmı.

---

## Teknoloji Yığını

| Katman | Teknoloji | Ne işe yarar? |
|--------|-----------|---------------|
| **Backend** | Django 5.2 + DRF | İş mantığı + REST API sunucusu |
| **Multi-tenant** | django-tenants | Her kliniğe ayrı DB bölmesi (schema) |
| **Frontend** | React 18 + TypeScript | Kullanıcının gördüğü arayüz |
| **Build** | Vite + Tailwind | Hızlı derleme + hazır CSS stilleri |
| **Veritabanı** | PostgreSQL | Klinik başına ayrı "schema" |
| **Yayın** | Docker + Render | Taşınabilir paket + bulut sunucu |

### Temel Özellikler
- Çoklu klinik yönetimi (her klinik izole DB schema'sında)
- Hasta, randevu, tedavi, ödeme yönetimi
- Dental şema (FDI diş numaralandırma sistemi)
- Rol-bazlı yetki (Admin / Doktor / Asistan)
- Audit log (KVKK uyumluluğu için kim ne yaptı kaydı)
- Türkçe / İngilizce dil desteği (i18n)

---

## Neden Test Bu Kadar Kritik?

### Sağlık Yazılımı + Multi-tenant SaaS = Yüksek Risk

| Olası Hata | Gerçek Hayattaki Sonucu |
|------------|--------------------------|
| Cross-tenant veri sızıntısı | Bir klinik diğerinin hastasını görür → KVKK ihlali |
| Form doğrulama hatası | Yanlış TCKN/telefon → yanlış hasta kaydı |
| A11y (erişilebilirlik) eksikliği | Engelli kullanıcı sistemi kullanamaz → yasal yaptırım |
| Auth/RBAC bug | Asistan, sadece doktorun yapabileceği işlemi yapar |

### Asıl Hedef: "Yeşil Test = Güvenli Production"

Sadece **çok sayıda** test yazmak yetmez. Testlerin **doğru şeyleri**
kontrol ettiğinden emin olmamız gerekir. Bu sunum, "nasıl emin olduğumuzu"
anlatıyor.

---

## 2. Temel Kavramlar — Test Türleri Nedir?

Kod bilirsiniz ama testin 3 ana türü var; farkı bilmek şart:

### Unit Test (Birim Testi)
Tek bir fonksiyonu/bileşeni **izole** test eder. Veritabanı yok, ağ yok.
Sadece "şu girdiyi verince şu çıktıyı veriyor mu?" sorusunu sorar.
→ **Çok hızlı** (milisaniyeler), çok sayıda yazılır.

### Integration Test (Entegrasyon Testi)
Birkaç parça **birlikte** çalışırken test edilir. Örn. "API'ye istek
atınca veritabanına doğru kayıt düşüyor mu?" → Orta hız, orta sayı.

### E2E Test (End-to-End / Uçtan Uca)
Gerçek kullanıcı gibi davranır: tarayıcıyı açar, butona tıklar, formu
doldurur. **Tüm sistem** birlikte çalışır. → Yavaş ama en gerçekçi.

> Anahtar fikir: Bu üçü birbirinin yerine geçmez, **birbirini tamamlar.**

---

## 3. Test Stratejisi — Test Piramidi

```
            /\
           /E2E\         %10  Playwright, gerçek tarayıcı + backend
          /------\
         /Integ.  \      %20  pytest + APIClient (DB var, ağ yok)
        /----------\
       /   Unit     \    %70  vitest + MSW / pytest isolated
      /______________\
```

### Bu Oran Neden Böyle?

Piramit, **hız ve maliyet** dengesidir:

- **Unit testler tabanda** çünkü hızlı (5–200ms) ve ucuz → bolca yazarız,
  her kod değişiminde saniyeler içinde çalışır.
- **E2E testler tepede** çünkü pahalı (5–30 saniye) ve kırılgan → sadece
  en kritik kullanıcı akışları için az sayıda yazarız.
- Ters piramit (çok E2E, az unit) yaparsanız: testler dakikalarca sürer,
  sık sık sebepsiz patlar (flaky), kimse çalıştırmak istemez.

### Yaşca'da Mevcut Durum

**403 test** = 148 backend (pytest) + 151 frontend (vitest)
+ 83 E2E (Playwright) + 21 multi-tenant izolasyon testi

---

## 4. Kullanılan Teknolojiler — Genel Bakış

Sıradaki slaytlarda her aracı **tek tek tanıtacağız.** Önce harita:

### Backend Test Araçları
- **pytest** — testleri yazıp çalıştıran ana motor
- **pytest-django** — pytest'i Django'ya bağlayan köprü
- **factory-boy + Faker** — sahte test verisi üreticisi
- **pytest-cov** — kodun ne kadarı test edildi ölçer (coverage)
- **mutmut** — testlerin gerçekten işe yarayıp yaramadığını ölçer

### Frontend Test Araçları
- **Vitest** — frontend'in test motoru
- **@testing-library/react** — bileşenleri kullanıcı gözüyle test eder
- **MSW** — backend'i taklit eden sahte API
- **Playwright** — gerçek tarayıcıyı sürüp E2E test yapar
- **vitest-axe / axe-core** — erişilebilirlik (a11y) denetçisi

> Sıradaki slaytlar: her birinin **ne olduğu ve neden seçildiği.**

---

## Araç #1 — pytest (Backend test motoru)

### Nedir?
Python testlerini yazıp çalıştıran araç. Python'un yerleşik `unittest`
kütüphanesinin daha modern ve daha az kod gerektiren alternatifi.

### Hangi sorunu çözer?
`unittest` ile her test için sınıf açmak, `self.assertEqual(...)` gibi
uzun metodlar yazmak gerekir. pytest bunu sadeleştirir:

```python
# unittest ile:           # pytest ile:
self.assertEqual(a, b)    assert a == b
```

### Öne çıkan özellikleri
- **Fixture**: Testten önce hazırlık yapan, sonra temizleyen yardımcılar
  (örn. her teste taze bir veritabanı verir).
- **Parametrize**: Aynı testi farklı girdilerle otomatik tekrar çalıştırır.
- **Marker**: Testleri etiketler (örn. `@pytest.mark.slow` → yavaş test).

### Neden seçtik?
Daha az "boilerplate" (tekrar eden kalıp kod), Django ekosisteminde
fiili standart, geniş eklenti desteği.

---

## Araç #2 — factory-boy + Faker (Sahte veri üretici)

### Sorun: Her teste manuel veri yazmak yorucu ve tekrarlı

```python
patient = Patient.objects.create(
    first_name="Ali", last_name="Yılmaz",
    phone="+905551234567", tckn="12345678901",
    # ... 10+ alan daha, her testte tekrar tekrar
)
```

### Çözüm: factory-boy ile "veri kalıbı" tanımlarsın, tek satırda üretirsin

```python
patient = PatientFactory()                 # Tüm alanlar otomatik dolu
patient = PatientFactory(first_name="Ali") # İstediğini override et
patients = PatientFactory.create_batch(5)  # 5 hasta birden
```

### Faker'ın rolü
Faker, **gerçekçi rastgele veri** üretir (isim, telefon, adres). `tr_TR`
locale ile **Türkçe** isimler üretebiliyoruz: "Ahmet", "Zeynep"...

### Kazanç
Test kodu **~%70 daha kısa**, daha okunaklı; bir alan eklenince tek bir
yerde (factory) güncellersin, yüzlerce testte değil.

---

## Araç #3 — pytest-django (Django ↔ pytest köprüsü)

### Nedir?
pytest tek başına Django'yu tanımaz. Bu eklenti ikisini birbirine bağlar.

### Ne sağlar?
- **`@pytest.mark.django_db`**: Bu etikete sahip testlere otomatik olarak
  **geçici, izole bir veritabanı** verir. Test bitince her şey geri alınır
  (rollback) → testler birbirini kirletmez.
- Django ayarlarını (`settings`) otomatik yükler.
- `client` fixture'ı ile sahte HTTP istekleri atmayı kolaylaştırır.

### Neden önemli?
Her test **temiz bir sayfadan** başlar. Bir testin bıraktığı çöp veri, bir
sonraki testi bozamaz. Bu "izolasyon" güvenilir testin temelidir.

```python
@pytest.mark.django_db   # ← Bu testin DB'ye ihtiyacı var
def test_patient_create():
    PatientFactory()
    assert Patient.objects.count() == 1   # Test sonrası otomatik temizlenir
```

---

## Araç #4 — pytest-cov (Coverage / kapsam ölçer)

### Coverage nedir?
"Test çalışırken kodun **yüzde kaçı** çalıştırıldı?" sorusunun cevabı.
Örn. %78 coverage → kodun %78'i en az bir kez bir testte çalışmış.

### Ne işe yarar?
**Hiç test edilmemiş** bölgeleri görünür kılar. Coverage raporunda
kırmızı satırlar = "bu kod hiçbir test tarafından çalıştırılmadı."

### Yaşca'da nasıl kullanıyoruz?
- HTML rapor: hangi satır test edildi renkli gösterir
- **Threshold (eşik) kapısı**: Coverage %78'in altına düşerse CI **kırmızı
  yanar**, kod birleştirilemez. Yani test silersen yakalanırsın.

```
--cov-fail-under=78   # backend coverage %78'in altına düşemez
```

### ⚠️ Önemli uyarı (10. bölümde derinleşeceğiz)
Yüksek coverage **iyi test** demek DEĞİLDİR. Sadece "kod çalıştırıldı"
der, "doğru kontrol edildi" demez. Bu yüzden mutation testing var.

---

## Araç #5 — Vitest (Frontend test motoru)

### Nedir?
Frontend (React/TypeScript) testlerini çalıştıran araç. Backend'deki
pytest'in frontend karşılığı diye düşünebilirsiniz.

### Neden Jest yerine Vitest?
Jest uzun yıllar standarttı, ama:
- Yaşca **Vite** ile derleniyor. Vitest, Vite'ın içine **doğal** entegre →
  ayrı yapılandırma derdi yok, aynı config'i paylaşır.
- **~3 kat daha hızlı** çalışır (özellikle "watch" modunda anlık geri bildirim).
- API'si Jest'e neredeyse birebir benzer → öğrenme maliyeti sıfıra yakın.

### Tipik kullanım
```typescript
describe('toplama fonksiyonu', () => {
  it('2 + 2 = 4 döner', () => {
    expect(topla(2, 2)).toBe(4);
  });
});
```

> `describe` = test grubu, `it` = tek test, `expect(...).toBe(...)` =
> doğrulama. Bu yapı neredeyse tüm modern frontend testlerinde ortaktır.

---

## Araç #6 — Testing Library (Kullanıcı odaklı test)

### Felsefesi: "Kullanıcı nasıl görüyorsa öyle test et"

Eski yaklaşım, bileşenin **iç yapısına** bağlanırdı (örn. "şu state
değişti mi?"). Sorun: iç yapıyı değiştirince testler kırılır, oysa
kullanıcı için hiçbir şey değişmemiştir.

### Testing Library bunun yerine ne yapar?
Ekranda **kullanıcının gördüğü şeyleri** sorgular:

```typescript
screen.getByRole('button', { name: /Kaydet/ })   // "Kaydet" butonu
screen.getByText(/11 haneli/)                     // ekrandaki uyarı yazısı
userEvent.click(...)                              // gerçek tıklama simülasyonu
```

### Neden iyi?
- Testler, **kullanıcı deneyimini** doğrular, kodun iç detayını değil.
- Bonus: `getByRole` kullanmak sizi **erişilebilir** kod yazmaya zorlar
  (çünkü ekran okuyucular da "role" üzerinden gezinir). A11y'ye köprü.

---

## Araç #7 — MSW (Mock Service Worker / Sahte API)

### Sorun
Frontend testinde gerçek backend'e istek atamayız: yavaş, kararsız, her
testte farklı veri döner. Ama bileşen API'den veri bekliyor. Ne yapacağız?

### MSW'nin çözümü
Ağ katmanını **araya girip yakalar** (intercept). Frontend gerçek bir
HTTP isteği atar sanır, ama isteği MSW yakalayıp **bizim belirlediğimiz
sahte cevabı** döndürür. Gerçek sunucuya hiç gidilmez.

```typescript
// Bu teste özel: "hasta listesi boş" senaryosunu zorla
server.use(
  http.get('/api/patients/', () =>
    HttpResponse.json({ count: 0, results: [] })
  )
);
```

### Neden manuel `fetch` mock'lamak yerine MSW?
- **Gerçekçi**: Kod, gerçekten ağ isteği atar; sadece cevabı sahtedir.
- **Tek kaynak**: Aynı sahte cevaplar hem testte hem geliştirme (dev)
  ortamında kullanılır → `src/mocks/handlers.ts`.
- **Deterministik**: Her test kendi izole verisini belirler, sürpriz yok.

---

## Araç #8 — Playwright (E2E / gerçek tarayıcı)

### Nedir?
Gerçek bir tarayıcıyı (Chrome, Firefox, Safari) **programla sürer**.
Sayfayı açar, butona tıklar, form doldurur — tıpkı bir kullanıcı gibi.

### Neden E2E'ye ihtiyacımız var?
Unit/integration testler parçaları doğrular ama şunu söyleyemez:
- "Login → Dashboard → Hasta ekle → Randevu oluştur" akışı **baştan sona**
  çalışıyor mu?
- Açılır pencere (dialog) gerçek tarayıcıda klavyeyle düzgün çalışıyor mu?
- Multi-tenant subdomain yönlendirmesi **gerçek** Chrome'da doğru mu?

→ Bu sorulara sadece gerçek tarayıcı cevap verebilir.

### Playwright'in güçlü yanları
- **Çoklu tarayıcı**: Chromium, Firefox, WebKit aynı testle
- **Trace viewer**: Test patlayınca adım adım kaydı geri oynatır → debug kolay
- **Auto-wait**: Eleman yüklenene kadar otomatik bekler → "flaky" (kararsız)
  test azalır
- **Cypress yerine neden?** Multi-tenant subdomain (ali.localhost gibi)
  senaryolarında Playwright çok daha esnek.

---

## 5. Backend Testing — Dosya Organizasyonu

```
backend/
├── api/tests/
│   ├── factories.py            # factory-boy veri kalıpları
│   ├── conftest.py             # Paylaşılan fixture'lar
│   ├── test_models.py          # Unit: model özellikleri
│   ├── test_serializers.py     # Unit: veri doğrulama
│   ├── test_views.py           # Integration: API istekleri
│   ├── test_middleware.py      # Unit: tenant çözümleme
│   ├── test_admin.py           # Smoke: admin paneli açılıyor mu
│   ├── test_mixins.py          # Unit: audit log mixin
│   └── test_tenant_isolation.py  # Sadece PG: schema izolasyonu
└── customers/tests/
    ├── test_models.py          # Client/Domain modelleri
    └── test_register.py        # Yeni klinik kayıt akışı
```

> **conftest.py** = pytest'in özel dosyası. İçindeki fixture'lar, alt
> klasördeki tüm testlere otomatik sunulur. "Ortak hazırlık" deposu.

**Toplam:** 148 SQLite + 21 PostgreSQL = **169 backend test**

---

## Backend Test Örneği — Bunu Birlikte Okuyalım

```python
@pytest.mark.django_db                       # 1) Bu teste izole DB ver
class TestTreatmentTypeRBAC:
    """F-013: Tedavi türü yönetimi sadece admin/doktor yapabilmeli."""

    def setup_method(self):                  # 2) Her testten önce çalışır
        self.admin = AdminUserFactory()      #    3 farklı rolde kullanıcı
        self.doctor = DoctorUserFactory()    #    factory ile tek satırda
        self.assistant = AssistantUserFactory()

    def test_create_allowed_for_doctor(self):
        res = auth_client(self.doctor).post(           # 3) Doktor olarak istek at
            "/api/treatment-types/",
            {"name": "Yeni", "default_price": "150"}, format="json")
        assert res.status_code == 201                  # 4) İzin verilmeli (201 = oluştu)

    def test_create_blocked_for_assistant(self):
        res = auth_client(self.assistant).post(...)
        assert res.status_code == 403                  # Asistan engellenmeli (403 = yasak)
```

> **RBAC** = Role-Based Access Control (rol bazlı yetki). Her endpoint için
> **5 senaryo** test ederiz: listele, admin oluştur, doktor oluştur,
> asistan oluştur (engellenir), asistan sil (engellenir).

---

## 6. Frontend Testing — Mimari Nasıl Çalışır?

```
Test
  └─ Component (React bileşeni)
       └─ fetchPatients()  ← MSW burada araya girer
            └─ HTTP isteği → MSW sahte cevabı döndürür
                 (gerçek backend'e HİÇ gidilmez)
```

### Bu akış neden değerli?
- **Hızlı**: Ağ gidiş-gelişi yok, testler milisaniyelerde biter.
- **Kararlı**: Backend çökse bile frontend testleri çalışır.
- **İzole**: Her test kendi senaryosunu (boş liste, hata, dolu liste)
  bağımsızca kurar.

```typescript
// Örnek: "hata durumunda kullanıcıya mesaj gösteriliyor mu?"
server.use(
  http.get('/api/patients/', () =>
    HttpResponse.json({ detail: 'Sunucu hatası' }, { status: 500 })
  )
);
// → Bileşen 500 alınca "bir hata oluştu" mesajı göstermeli, test bunu doğrular
```

---

## Frontend — Tekrarı Önleyen Yardımcılar

### Sorun: Her test aynı sarmalayıcı kodu istiyor
React bileşenleri tek başına çalışmaz; Router, Auth, dil sağlayıcıları ile
sarmalanmaları gerekir. Her testte bunu yazmak büyük tekrar:

```typescript
render(
  <MemoryRouter><AuthProvider><I18nextProvider i18n={i18n}>
    <MyComponent />
  </I18nextProvider></AuthProvider></MemoryRouter>
);
```

### Çözüm: `renderWithProviders` adında tek bir yardımcı

```typescript
renderWithProviders(<MyComponent />, { authenticated: true });
```

### Diğer yardımcılar
- **`factories.ts`** — `makePatient()`, `makeAppointment()` (frontend
  tarafının factory-boy'u; sahte veri üretir)
- **`setupTests.ts`** — Her testten önce MSW'yi başlatır, localStorage'ı
  temizler (test izolasyonu)
- **`vitest-axe matchers`** — `toHaveNoViolations()` ile a11y kontrolü

→ Sonuç: yeni test yazmanın maliyeti **dramatik düşer.**

---

## Frontend Component Test Örneği

```typescript
describe('PatientDialog — Doğrulama', () => {
  it('10 haneli TCKN reddedilmeli (TCKN 11 hane olmalı)', async () => {
    renderWithProviders(
      <PatientDialog isOpen onClose={vi.fn()}
        initialData={{
          first_name: 'X', last_name: 'Y',
          phone: '+905551234567',
          tckn: '1234567890',          // ← bilerek 10 hane (hatalı)
        }} />,
      { authenticated: true },
    );

    await userEvent.click(screen.getByRole('button', { name: /Kaydet/ }));

    await waitFor(() => {              // Asenkron sonucu bekle
      expect(screen.getByText(/11 haneli/)).toBeInTheDocument();  // uyarı çıkmalı
    });
  });
});
```

> Bu test **kullanıcı davranışını** taklit eder: formu doldur, Kaydet'e bas,
> doğru uyarı çıkıyor mu bak. Kodun iç detayına bağlı değil → sağlam test.

---

## Test Kapsamı — Frontend

| Bileşen | Test Sayısı | Coverage |
|---------|-------------|----------|
| AuthContext (oturum yönetimi) | 8 | %97 |
| API Service (sunucu iletişimi) | 22 | %42 |
| LoginPage | 6 | ~%80 |
| Dashboard | 5 | ~%75 |
| PatientSearch | 5 | ~%80 |
| Layout | 8 | ~%85 |
| ErrorBoundary (hata yakalayıcı) | 5 | %95 |
| **AppointmentDialog** | 9 | %85 |
| **PatientDialog** | 9 | %85 |
| **PaymentDialog** | 8 | %85 |
| **TreatmentAddDialog** | 7 | %80 |
| **AppointmentDetailDialog** | 6 | %80 |
| A11y testleri (10 sayfa) | 10 | (WCAG 2.1 AA) |

**Toplam:** 151 frontend unit test

---

## 7. E2E Testing — Playwright Suite'i

### 8 Spec Dosyası, 83 Test
> "Spec" = belirli bir özelliğin uçtan uca test edildiği dosya.

| Spec | Test | Neyi test eder? |
|------|------|------------------|
| auth.spec.ts | 14 | Login, RBAC, korumalı sayfalar |
| dashboard.spec.ts | 3 | İstatistikler, filtreleme |
| appointments.spec.ts | 10 | Randevu CRUD, çakışma kontrolü |
| patients.spec.ts | ~8 | Hasta arama, ekleme, detay |
| treatments-payments.spec.ts | ~10 | Tedavi/ödeme akışı |
| settings.spec.ts | 6 | Klinik ayarları yetkileri |
| public.spec.ts | 4 | Açılış sayfası, kayıt |
| **registration.spec.ts** | 3 | Yeni klinik kayıt akışı |
| **tenant-isolation.spec.ts** | 2 | Klinikler arası koruma |
| **subdomain-routing.spec.ts** | 4 | ali.localhost vs /app/ali |
| **a11y.spec.ts** | 4 | WCAG 2.1 AA gerçek tarayıcıda |
| **keyboard-navigation.spec.ts** | 3 | Sadece klavyeyle kullanım |

> **CRUD** = Create, Read, Update, Delete (oluştur/oku/güncelle/sil) —
> bir kaydın yaşam döngüsünün tamamı.

---

## E2E Örneği — Cross-Tenant Isolation (En Kritik Test)

```typescript
test('cross-tenant API isteği boş veya 4xx dönmeli', async ({ browser }) => {
  // 1) "Standard" kliniğine giriş yap, oturum anahtarını (JWT) al
  const page = await (await browser.newContext()).newPage();
  await loginAs(page, 'tony', 'demo123!');
  const accessToken = await page.evaluate(() =>
    localStorage.getItem('access_token'));

  // 2) AYNI anahtarla BAŞKA bir kliniğin (premium) verisini istemeyi dene
  const apiRequest = await request.newContext();
  const res = await apiRequest.get('http://premium.localhost:8000/api/patients/',
    { headers: { Authorization: `Bearer ${accessToken}` } });

  // 3) Doğru davranış: ya yetki reddi, ya da premium'un verisi GÖRÜNMEMELİ
  if (res.status() === 200) {
    const data = await res.json();
    expect(JSON.stringify(data)).not.toContain('Mustafa Öztürk'); // diğer klinik hastası
  } else {
    expect([401, 403, 404]).toContain(res.status());              // ya da erişim reddi
  }
});
```

> Bu test "A kliniğinin anahtarıyla B'nin verisine ulaşılamaz" güvencesini
> verir. Multi-tenant bir sağlık yazılımında **en önemli güvenlik testi.**

---

## 8. Erişilebilirlik (A11y) — Nedir, Neden Önemli?

### A11y = Accessibility (erişilebilirlik)
"11", a ile y arasındaki 11 harfin kısaltması. Görme/işitme/motor
kısıtlılığı olan kullanıcıların da yazılımı kullanabilmesi demek.

### WCAG 2.1 AA nedir?
Web Content Accessibility Guidelines — erişilebilirliğin **uluslararası
standardı.** "AA" orta-üst uyum seviyesidir (A < AA < AAA).

### Sağlık yazılımında neden kritik?
- Kullanıcılar **geniş yaş aralığında**, çeşitli kısıtlılıklarda olabilir
- **Türkiye**: 5378 sayılı Engelliler Hakkında Kanun
- **AB**: European Accessibility Act (2025'ten itibaren zorunlu)
- **Ticari**: Kurumsal müşteriler için tercih/şart kriteri

### Yaşca Politikası: Zero-Tolerance
> **Tek bir WCAG 2.1 AA ihlali bile = build kırmızı.**
> Düzeltmeden merge yok. İhlali "görmezden gelmek" (waive) YASAK.

---

## A11y'yi Nasıl Otomatik Test Ediyoruz?

### Araç: axe — erişilebilirlik kurallarını otomatik denetler
İnsan tek tek kontrol edemez. `axe`, sayfayı tarar ve WCAG ihlallerini
(eksik etiket, düşük kontrast, vb.) otomatik bulur.

### İki katmanda kullanıyoruz:

**Unit seviye (vitest-axe)** — bileşen izole render edilir
```typescript
const { container } = renderWithProviders(<LoginPage />);
const results = await axe(container, {
  runOnly: { type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }});
expect(results).toHaveNoViolations();   // tek ihlal bile testi patlatır
```

**E2E seviye (@axe-core/playwright)** — gerçek tarayıcıda
```typescript
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
expect(results.violations).toEqual([]);
```

### Ayrıca klavye navigasyonu testi
Tab sırası doğru mu? Esc dialog'u kapatıyor mu? Enter formu gönderiyor mu?

---

## A11y — Gerçekten Bulduğumuz ve Düzelttiğimiz İhlaller

İlk axe taramasında **şu somut ihlaller** çıktı (teoride değil, gerçekte):

| İhlal | Yer | Düzeltme |
|-------|-----|----------|
| Dil `<select>` etiketsiz (ekran okuyucu "neyin seçimi?" diyemez) | LoginPage | `aria-label="Dil seçimi"` eklendi |
| Aynı sorun | Layout | `aria-label="Dil seçimi"` eklendi |
| Dünya (globe) ikonu okuyucuyu yanıltıyor | LoginPage, Layout | `aria-hidden="true"` (okuyucudan gizle) |

### Sonuç
**0 WCAG 2.1 AA ihlali** — tüm sayfalar yeşil ✅

### Sürekli takip
- 10 unit a11y suite + 4 E2E spec
- `dialogs.a11y.test.tsx` — 5 dialog otomatik taranır
- `keyboard-navigation.spec.ts` — Tab/Enter/Esc kontrolü

---

## 9. Multi-tenant Test Zorlukları

### Temel sorun: django-tenants PostgreSQL gerektirir

Production'da her klinik **ayrı bir schema'da** (DB bölmesi). Sorgu
otomatik olarak sadece o kliniğin bölmesine bakar:

```python
# Production (PostgreSQL):
Patient.objects.all()   # → SADECE içinde bulunduğun kliniğin hastaları

# Test ortamı (SQLite):
Patient.objects.all()   # → TÜM hastalar (SQLite'da schema kavramı YOK)
```

### Neden test için SQLite istiyoruz?
SQLite tek dosyalık, kurulum gerektirmez, **çok hızlı** → geliştirici
makinesinde saniyeler içinde test çalışır. Ama schema'yı desteklemez.

### Çıkmaz
- Hız istiyoruz → SQLite (ama izolasyon yok)
- Gerçeklik istiyoruz → PostgreSQL (ama yavaş ve kurulum gerektirir)

→ Yaşca'nın çözümü: **Dual-Mode Strategy** (çift mod) →

---

## Dual-Mode Strategy — İki Modda Test

```
DATABASE_URL boş veya "sqlite" içeriyor
  ↓
SQLite modu (hızlı geliştirme)
  • Shim: schema değiştirme komutu → hiçbir şey yapmaz (no-op)
  • TENANT_APPS'i SHARED_APPS'e düzleştirir (schema yokmuş gibi)
  • Tenant middleware'i devre dışı bırakır

DATABASE_URL = "postgres://..."
  ↓
PostgreSQL modu (production'a birebir sadık)
  • Gerçek schema değiştirme aktif
  • Gerçek HeaderTenantMiddleware aktif
  • "requires_postgres" etiketli 21 izolasyon testi de çalışır
```

> **Shim** = araya konulan ince uyumluluk katmanı. Burada: "schema değiştir"
> komutunu SQLite'da sessizce yok sayar ki kod patlamadan çalışsın.

### Püf nokta
**Hem geliştirme hızı hem production gerçekliği** — birini diğerine feda
etmeden. Geliştirici hızlı SQLite ile çalışır; CI ikisini de doğrular.

---

## Dual-Mode — Kod Tarafı

### `backend/conftest.py`
```python
_db_url = os.environ.get("DATABASE_URL", "")
_is_sqlite_mode = not _db_url or "sqlite" in _db_url

if _is_sqlite_mode:                          # Sadece SQLite'da:
    BaseDatabaseWrapper.set_schema = _noop_set_schema   # schema komutunu sustur
```

### `backend/core/settings_test.py`
```python
if _use_sqlite_shim:
    SHARED_APPS = list(SHARED_APPS) + TENANT_APPS        # schema yokmuş gibi düzleştir
    MIDDLEWARE = [m for m in MIDDLEWARE
                  if m != "api.middleware.HeaderTenantMiddleware"]  # tenant ara katmanı kapat
# else: production ile birebir aynı yapılandırma
```

### CI Matrix — ikisini de zorunlu kıl
```yaml
strategy:
  matrix:
    db-mode: [sqlite, postgres]   # Her PR HER İKİ modda da yeşil olmalı
```

> **CI matrix** = aynı testleri farklı koşullarda (burada: iki DB modu)
> paralel çalıştırma. Biri geçip diğeri patlarsa merge engellenir.

---

## Tenant Isolation Test Suite — 21 Test

Sadece izolasyonu test etmek için ayrı bir disiplin oluşturduk:

**A) Schema İzolasyonu (6 test)** — her veri tipi için ayrı
- Patient, Appointment, Treatment, Payment, AuditLog, ClinicSettings
- "A'da oluşturulan kayıt B'den görünmüyor" doğrulaması

**B) Middleware Resolution (3 test)** — tenant nasıl belirleniyor
- X-Tenant header: geçerli / geçersiz / boş durumları

**C) Migration Shape (3 test)** — DB yapısı doğru mu
- TENANT_APPS public schema'da OLMAMALI, SHARED_APPS sadece public'te

**D) Cross-Tenant API (3 test)** — güvenlik
- A'nın oturum anahtarı (JWT) B'nin endpoint'inde çalışmamalı

**E) Negative Tests (2 test)** — saldırı denemeleri
- SQL injection, schema adı enjeksiyonu denemeleri engellenmeli

**F) Stress (3 test)** — sınır durumları
- İç içe context, rollback izolasyonu, paralel tenant

---

## 10. Mutation Testing — Coverage'ın Söylediği Yalan

### Şu kod ve teste bakın:
```python
def critical_function(x):
    if x > 10:
        return x * 2        # ← test buraya uğruyor
    return 0                # ← test buraya da uğruyor

def test_critical():
    critical_function(5)    # çağırıyor ama...
    critical_function(15)   # SONUCU KONTROL ETMİYOR (assert yok!)
```

**Coverage: %100** ✅ (her satır çalıştırıldı)
Ama tek bir `assert` yok → kod tamamen bozulsa bile test fark etmez!

### İşte sorun bu:
Coverage sadece "kod çalıştırıldı mı?" der. "**Sonuç doğru mu kontrol
edildi mi?**" sorusuna cevap VERMEZ. Yüksek coverage sahte güven verebilir.

---

## Mutation Testing Nasıl Çözer?

### Fikir: Koda kasıtlı hata (mutasyon) sok, test yakalıyor mu bak

Mutation aracının yaptığı 4 adım:

1. **Mutasyon yapar**: `if x > 10` satırını `if x >= 10` olarak değiştirir
   (kasıtlı küçük bozma → "mutant" oluşur)
2. **Testleri çalıştırır**
3. **Sorar**: Bir test bu bozukluk yüzünden patladı mı?
   - **Evet** → mutant "öldürüldü" 👍 (testin gerçekten işe yarıyor)
   - **Hayır** → mutant "hayatta kaldı" 👎 (test bu hatayı yakalayamıyor)
4. **Rapor**: Hayatta kalan mutantlar = **test boşlukların**

### Mutation Score
"Öldürülen mutant / toplam mutant" oranı. **Coverage'dan çok daha dürüst**
bir kalite ölçüsü; testlerin gerçek yakalama gücünü gösterir.

---

## Yaşca Mutation Setup

### Backend (mutmut)
```ini
[mutmut]
paths_to_mutate=api/middleware.py,api/mixins.py,api/serializers.py,customers/views.py
runner=pytest -x --tb=no -q
```
> En kritik dosyalara odaklanırız (middleware, doğrulama) — tüm kodu
> mutasyona sokmak çok yavaş olurdu.

### Frontend (Stryker — JS/TS mutation aracı)
```json
{
  "mutate": ["src/app/services/api.ts", "src/app/hooks/**",
             "src/app/components/AppointmentDialog.tsx"],
  "thresholds": { "high": 80, "low": 60, "break": 60 }
}
```

### Hedefler
| Modül | Mutation Score Hedefi |
|-------|------------------------|
| middleware.py | ≥ %85 |
| serializers.py | ≥ %80 |
| api.ts (frontend) | ≥ %80 |
| Dialog'lar | ≥ %75 |

> **Haftalık cron** ile çalışır (her PR'da değil, çünkü yavaş). Skor
> düşerse otomatik GitHub issue açılır.

---

## 11. CI/CD Pipeline — Otomatik Kalite Kapıları

### CI/CD nedir?
**CI** (Continuous Integration): her kod değişiminde testleri otomatik
çalıştırma. **CD** (Continuous Delivery): geçen kodu otomatik yayına
hazırlama. Amaç: bozuk kodun production'a sızmasını **makineyle** engellemek.

### `.github/workflows/ci.yml` — Her PR'da çalışır
```
┌─────────────────────────────────────────────────┐
│ Backend Matrix                                   │
│   SQLite modu (hızlı, 148 test)                  │
│   PostgreSQL modu (gerçekçi, +21 izolasyon)      │
├─────────────────────────────────────────────────┤
│ Frontend Tests (vitest + coverage eşiği)         │
├─────────────────────────────────────────────────┤
│ A11y Tests (WCAG 2.1 AA — sıfır tolerans)        │
├─────────────────────────────────────────────────┤
│ E2E Tests (Playwright, gerçek DB + UI)           │
└─────────────────────────────────────────────────┘
```

**Hepsi yeşil olmadan merge YOK** (GitHub "required checks" ile zorunlu).

---

## Pre-commit Hook'ları — Husky

### "Hook" nedir?
Git'in belirli anlarda (commit öncesi, push öncesi) **otomatik çalıştırdığı
script.** Husky, bunları kurmayı kolaylaştıran araç.

### Amaç: Bozuk kod commit'e bile giremesin (CI'a kalmadan, daha erken yakala)

```
git commit
  ↓
.husky/commit-msg     → Commit mesajı formatı doğru mu?
  ↓
.husky/pre-commit     → lint-staged (eslint + prettier: stil/hata kontrol)
  ↓
git push
  ↓
.husky/pre-push       → Tüm test suite'i çalıştır
```

### Conventional Commits zorunluluğu
Commit mesajları belirli formatta olmalı (otomatik changelog/sürüm için):

❌ `git commit -m "düzeltme"`
✅ `git commit -m "fix(auth): X-Tenant header refresh'te kayboluyor"`

### `--no-verify` YASAK
Hook'ları atlamak yok. Acil durumda PR açıklamasında gerekçe yazılır.

---

## Flaky ve Yavaş Test Yönetimi

### "Flaky test" nedir?
Aynı kodla bazen geçen, bazen sebepsiz patlayan test. En sinsi sorun:
ekibin teste güvenini öldürür ("yine patladı, boşver geç" → gerçek bug kaçar).

Tipik sebepleri: yarış durumu (race condition), tarih/saat mock'lanmaması,
ağ zamanlaması.

### Yaşca Politikası
```python
@pytest.mark.flaky    # En fazla 3 deneme, biri geçerse OK
def test_something(): ...
```
- Hafta sonu cron'la flaky tespiti çalışır → GitHub issue açılır
- **1 hafta** içinde düzeltilmezse → karantinaya alınır
- **2 hafta** içinde hâlâ flaky ise → silinir (güvenilmez test, hiç testten kötü)

### Slow Test Budget (yavaşlık bütçesi)
| Tür | Üst sınır |
|-----|-----------|
| Unit | ≤ 200ms |
| Integration | ≤ 2s |
| E2E | ≤ 30s |

Aşan testler `@pytest.mark.slow` ile ayrı job'da çalışır → günlük döngüyü yavaşlatmaz.

---

## Test Metrikleri Dashboard

### `scripts/test-metrics.py` otomatik üretir
```
[*] Test sayilari toplaniyor...
  Backend (pytest):     169
  Frontend (vitest):    151
  E2E (Playwright):     83
  TOPLAM:               403
```

### `docs/TEST_METRICS.md` otomatik güncellenir
Her main push'tan sonra:
1. Script çalışır → güncel sayıları toplar
2. Markdown rapor üretir
3. Otomatik PR açar → review + merge

> Amaç: "kaç testimiz var, piramit sağlıklı mı?" sorusunun cevabı **elle
> güncellenen, eskiyen bir doküman değil**, otomatik ve hep güncel olsun.

### Rapor içeriği
- Katman bazlı test sayıları
- Piramit görselleştirmesi
- Hedef vs mevcut oran + piramit sağlık durumu

---

## Dokümantasyon Suite

> Tek bir README yetmez. Dokümantasyonu **birinci sınıf çıktı** sayıyoruz.

```
docs/
├── TESTING.md           # Test rehberi (5 dk'da nasıl çalıştırılır)
├── CONTRIBUTING.md      # PR süreci, code review kuralları
├── TEST_PYRAMID.md      # Piramit hedefi ve gerekçesi
├── TEST_METRICS.md      # OTOMATİK üretilen güncel metrikler
└── adr/
    ├── 0001-test-strategy.md
    ├── 0002-multi-tenant-isolation.md
    └── 0003-a11y-zero-tolerance.md
```

### ADR nedir? (Architecture Decision Record)
"Şu kararı **neden** aldık?" sorusunun kalıcı kaydı. Örn. "neden Jest değil
Vitest?" 6 ay sonra biri sorduğunda cevap dokümante.

### PR Template (her PR'da kontrol listesi)
☐ Backend testler yazıldı ☐ Multi-tenant değiştiyse PG modunda test edildi
☐ A11y test eklendi ☐ Coverage düşmedi ☐ Lint geçti

---

## 12. Sayısal Sonuçlar

### Test Sayıları (Başlangıç → Sonuç)
| | Başlangıç | Sonuç |
|---|-----------|-------|
| Backend test | 0 çalışan (77 kırık!) | **169** |
| Frontend unit | 23 | **151** |
| Frontend E2E | 67 | **83** |
| A11y unit | 0 | **10** |
| A11y E2E | 0 | **4** |
| Tenant isolation | 0 | **21** |
| **TOPLAM** | **~90** | **403** |

### Coverage
| | Başlangıç | Sonuç |
|---|-----------|-------|
| Backend lines | %55 | **%78** |
| Frontend lines | %5 | **%57** |
| Frontend branches | %3 | **%46** |

---

## Kalite Gate'leri — Merge İçin Geçilmesi Şart

### CI Required Checks (zorunlu kontroller)
✅ Backend SQLite tests (148 PASS)
✅ Backend PostgreSQL tests (148 + 21 PG-only)
✅ Frontend lint (0 uyarı)
✅ Frontend type-check (`tsc --noEmit` — tip hatası yok)
✅ Frontend tests + coverage eşiği
✅ A11y tests (0 WCAG 2.1 AA ihlali)
✅ E2E tests (Playwright)

### Threshold'lar (asla altına düşülemez)
```typescript
thresholds: { lines: 54, functions: 38, branches: 45, statements: 54 }
```
```yaml
--cov-fail-under=78   # backend
```

> Bu sayılar bir kez geçilince **taban** olur. Yeni kod coverage'ı düşürürse
> CI patlar → kalite zamanla yukarı gider, asla geriye gitmez.

---

## 13. Öğrenilen Dersler

**1. Coverage rakamı yalan söyleyebilir.**
%80 coverage olsa bile mutation score düşükse testler aslında zayıf.

**2. Test ortamı production'a benzemeli.**
SQLite hızlı ama gerçeklik yok. Dual-mode strateji bu yüzden şart oldu.

**3. A11y sonradan eklenmez, baştan tasarlanır.**
Baştan WCAG 2.1 AA hedeflemek, sonradan refactor'dan çok daha ucuz.

**4. "Smoke test" gerçek test değildir.**
"Sayfa açılıyor mu?" yetmez. Doğrulama, hata yolu, sınır durumları şart.

**5. Pre-commit hook hayat kurtarır.**
Bozuk kod commit'e giremezse, CI'da bile uğraşmazsın — daha erken yakalanır.

**6. Factory pattern test kodunu kısaltır.**
factory-boy + frontend factory'ler → **~%70 daha az tekrar kod.**

**7. Multi-tenant test ayrı bir disiplindir.**
Schema-per-tenant testlerinin kendi araçları, etiketleri, modları var.

---

## Yapılan Pre-existing Bug Fix

### Tespit edilen sorun
Devraldığımız test suite'inde **77 backend test kırıktı** (hiç çalışmıyordu):

- `ClinicFactory` import ediliyordu ama tanımı **yoktu**
- `clinic=...` parametresi geçiliyordu ama modelde böyle bir alan **yoktu**
  (django-tenants geçişinde temizlenmemiş eski kod)

### Çözüm
- 6 dosya temizlendi (conftest, factories, 4 test dosyası)
- `clinic=` referansları kaldırıldı
- `TestMultiTenancyIsolation` sınıfı E2E katmanına taşındı
- Boş placeholder testler silindi

### Sonuç
**77 ölü test → 148 yaşayan test** (PostgreSQL modunda +21 daha)

> Ders: Çalışmayan test, test değildir. Önce mevcut suite'i ayağa kaldırdık.

---

## Geliştirilecek Alanlar (Yol Haritası)

### Şu an sağlam olanlar
✅ Multi-tenant isolation testleri
✅ A11y zero-tolerance
✅ Dual-mode test stratejisi
✅ CI matrix (SQLite + PG)
✅ Pre-commit gate

### Sonraki adımlar (Faz 9+)
- 🔜 **Visual regression** — ekran görüntüsü farkı (tasarım bozulmasını yakalar)
- 🔜 **Performance budget** — Lighthouse CI ile sayfa hızı eşiği
- 🔜 **Contract testing** — Pact ile frontend/backend sözleşmesi doğrulama
- 🔜 **Load testing** — Locust ile çok-tenant yük altında davranış
- 🔜 Mutation score'u kademeli **%85'e** çıkarmak

---

## Demo (İsteğe Bağlı) — Komutlar

**Backend SQLite testler (hızlı):**
```powershell
cd backend
pytest -q
# 148 passed, 21 skipped in 3.82s
```

**Backend PostgreSQL modu (gerçekçi):**
```powershell
cd backend
.\scripts\test-pg.ps1
# Docker container başlatır, 169 test çalıştırır
```

**Frontend testler:**
```powershell
cd frontend
npm run test:coverage
# 151 tests passed, coverage HTML üretir
```

**A11y testler:**
```powershell
cd frontend
npm test -- __a11y__
# 10 a11y testi, 0 violation
```

---

## Sayısal Özet — Tek Slide

```
┌────────────────────────────────────────────┐
│                                            │
│         YAŞCA TEST İSTATİSTİKLERİ          │
│                                            │
│  📊 Toplam Test:          403             │
│                                            │
│  🐍 Backend (pytest):     169             │
│  ⚛️  Frontend (vitest):   151             │
│  🌐 E2E (Playwright):     83              │
│                                            │
│  ♿ A11y Violation:        0 (WCAG 2.1 AA)│
│                                            │
│  📈 Backend Coverage:     %78             │
│  📈 Frontend Coverage:    %57             │
│                                            │
│  🔧 CI Required Checks:   7               │
│  📚 Dokümantasyon:        7 dosya         │
│                                            │
│  🚀 PR'dan Production'a:  ~5 dakika       │
│                                            │
└────────────────────────────────────────────┘
```

---

<!-- _class: lead -->

# Teşekkürler

## Sorular?

**Proje:** github.com/yaman-halloum/yasca-dental-clinic
**Dokümantasyon:** `docs/TESTING.md`

### İlgili Belgeler
- ADR-0001: Test stratejisi
- ADR-0002: Multi-tenant isolation
- ADR-0003: A11y zero-tolerance

### Katkıda Bulunanlar
Yaman Halloum · Ali Üre · **Cihan Kurtbey** · Şükrü Yeşilmen
