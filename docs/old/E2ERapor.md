# 🧪 Yasca Dental Clinic — E2E Test Raporu

> **Son Çalıştırma:** 22 Mayıs 2026 — 67/67 test başarılı ✅  
> **Süre:** ~43 saniye  
> **Araç:** Playwright (Chromium)  
> **Base URL:** `http://standard.localhost:5173`

---

## 📊 Özet Tablo

| Dosya | Test Sayısı | Kapsam |
|---|---|---|
| `auth.spec.ts` | 14 | Kimlik doğrulama, çıkış, korumalı rotalar, menü yetkileri |
| `dashboard.spec.ts` | 4 | Dashboard kartları, randevu listesi, filtreler |
| `patients.spec.ts` | 16 | Hasta CRUD, arama, profil sekmeleri (6 sekme) |
| `appointments.spec.ts` | 11 | Takvim görünümleri, randevu diyaloğu, validasyon |
| `treatments-payments.spec.ts` | 6 | Tedavi geçmişi, ödeme özeti, diyaloglar |
| `settings.spec.ts` | 14 | Klinik ayarları, tedavi türleri, personel, audit log |
| `public.spec.ts` | 4 | SaaS landing, kayıt, tenant giriş sayfaları |
| **TOPLAM** | **67** | |

---

## 📁 Dosya Detayları

### 1. `auth.spec.ts` — Kimlik Doğrulama ve Navigasyon (14 test)

**Kapsanan API Endpoint'leri:**
- `POST /api/auth/token/` (Giriş)
- `GET /api/auth/me/` (Oturum bilgisi)
- `POST /api/auth/logout/` (Çıkış)

**Testler:**

| # | Test Adı | Açıklama |
|---|---|---|
| 1 | Geçersiz şifre ile giriş → hata mesajı | Yanlış kullanıcı/şifre ile giriş denendiğinde kırmızı hata kutusu görünmeli |
| 2 | Boş form ile giriş yapılamamalı | HTML5 required validasyonu formu engellemeli |
| 3 | Admin hesabı ile başarılı giriş | `tony / demo123!` ile giriş, ana sayfa yönlendirmesi |
| 4 | Doktor hesabı ile başarılı giriş | `dr_steve / demo123!` ile giriş |
| 5 | Asistan hesabı ile başarılı giriş | `asistan_peter / demo123!` ile giriş |
| 6 | Giriş yapmadan /randevular erişilemez | Korumalı rota → login sayfasına yönlendirme |
| 7 | Giriş yapmadan /hastalar erişilemez | Korumalı rota → login sayfasına yönlendirme |
| 8 | Giriş yapmadan /ayarlar erişilemez | Korumalı rota → login sayfasına yönlendirme |
| 9 | Güvenli çıkış (Logout) | Çıkış butonu → login ekranına dönüş |
| 10 | Çıkış sonrası korumalı sayfaya erişilemez | Logout sonrası /hastalar → login ekranı |
| 11 | Tüm ana menü linkleri görünür (admin) | Admin: /, /randevular, /hastalar, /tedavi-turleri, /ayarlar, /islem-gecmisi |
| 12 | Doktor İşlem Geçmişi linkini görememeli | Rol bazlı menü kısıtlaması |
| 13 | Asistan İşlem Geçmişi linkini görememeli | Rol bazlı menü kısıtlaması |
| 14 | Dil değiştirme dropdown görünür olmalı | i18n dil seçici elemanı |

---

### 2. `dashboard.spec.ts` — Ana Sayfa / Dashboard (4 test)

**Kapsanan API Endpoint'leri:**
- `GET /api/dashboard/today/` (Günlük özet)

**Testler:**

| # | Test Adı | Açıklama |
|---|---|---|
| 1 | Dashboard sayfası yüklenmeli ve özet kartları | Bugünkü Randevular, Bekleyen Hastalar, Toplam Hasta kartları |
| 2 | Bugünün randevu listesi görünmeli | "Bugünün Randevuları" kartı |
| 3 | Randevu filtre butonları çalışmalı | Tümü / Tamamlanan / Planlanan filtre butonları |
| 4 | Dashboard üzerinden yeni randevu diyaloğu | "Yeni Randevu Ekle" butonundan diyalog açılması |

---

### 3. `patients.spec.ts` — Hasta Yönetimi (16 test)

**Kapsanan API Endpoint'leri:**
- `GET /api/patients/` (Liste + arama)
- `POST /api/patients/` (Yeni hasta)
- `GET /api/patients/:id/` (Detay)
- `PUT /api/patients/:id/` (Güncelleme)
- `GET /api/treatments/?patient=` (Hasta tedavileri)
- `GET /api/payments/?patient=` (Hasta ödemeleri)
- `GET /api/appointments/?patient=` (Hasta randevuları)
- `GET /api/documents/?patient=` (Hasta dokümanları)

**Testler:**

| # | Test Adı | Açıklama |
|---|---|---|
| 1 | Hasta listesi sayfası açılmalı | "Hasta Yönetimi" başlığı ve "Yeni Hasta Ekle" butonu |
| 2 | Hasta tablosu sütun başlıkları doğru olmalı | Ad Soyad, Telefon sütunları |
| 3 | Hasta arama çalışmalı | İsim ile arama sonuçlarının filtrelenmesi |
| 4 | Boş arama sonucu kontrolü | Bulunamayan arama → boş tablo veya mesaj |
| 5 | Yeni hasta kaydı oluşturulmalı | Ad, soyad, telefon, TC ile kayıt |
| 6 | Eksik alanlarla hasta kaydedilemez | Validasyon hata mesajı kontrolü |
| 7 | Hasta detay sayfasına navigasyon | "Detay" butonundan profil sayfasına geçiş |
| 8 | Profil Bilgileri sekmesi | Telefon ve TC alanları görünürlüğü |
| 9 | Anamnez sekmesi açılmalı | Tıbbi geçmiş ve alerji alanları |
| 10 | Anamnez verileri düzenlenebilmeli | Alerji alanına yazı + "Değişiklikleri Kaydet" butonu |
| 11 | Tedavi Geçmişi sekmesi | "Yeni Tedavi Ekle" butonu görünürlüğü |
| 12 | Ödemeler sekmesi ve özet kartları | Toplam Tedavi Tutarı, Toplam Ödenen, Kalan Borç |
| 13 | Dokümanlar sekmesi | "Belge Yükle" alanı görünürlüğü |
| 14 | Diş Şeması sekmesi | DentalChart bileşeni render kontrolü |
| 15 | Hasta bilgileri güncellenebilmeli | Genel notlar alanı + kaydet butonu aktifliği |

---

### 4. `appointments.spec.ts` — Randevu Yönetimi (11 test)

**Kapsanan API Endpoint'leri:**
- `GET /api/appointments/` (Liste + tarih/hasta filtre)
- `POST /api/appointments/` (Yeni randevu)
- `GET /api/doctors/` (Doktor listesi)

**Testler:**

| # | Test Adı | Açıklama |
|---|---|---|
| 1 | Takvim sayfası yüklenmeli | "Randevu Takvimi" başlığı, "Yeni Randevu" butonu |
| 2 | Günlük görünüme geçilmeli | "Günlük" butonu → Bugün butonu |
| 3 | Haftalık görünüme geçilmeli | "Haftalık" butonu → Saat sütunu |
| 4 | Önceki/sonraki navigasyonu | İleri/geri + Bugün butonları |
| 5 | Boş slota tıklayınca diyalog açılmalı | Tablo hücresine tıklama → "Yeni Randevu Ekle" diyaloğu |
| 6 | "Yeni Randevu" butonu ile diyalog | Hasta arama, doktor, notlar alanları |
| 7 | Tarih ve saat alanları görünmeli | date input ve saat select elemanı |
| 8 | Eksik alanlarla randevu kaydedilememeli | Validasyon hata mesajı kontrolü |
| 9 | Hasta arama autocomplete çalışmalı | "Mustafa" yazınca dropdown önerisi |
| 10 | İptal butonu diyaloğu kapatmalı | İptal → diyalog kapanması |

---

### 5. `treatments-payments.spec.ts` — Tedavi ve Ödeme (6 test)

**Kapsanan API Endpoint'leri:**
- `GET /api/treatments/?patient=` (Hasta tedavileri)
- `POST /api/treatments/` (Yeni tedavi)
- `GET /api/payments/?patient=` (Hasta ödemeleri)
- `POST /api/payments/` (Yeni ödeme)

**Testler:**

| # | Test Adı | Açıklama |
|---|---|---|
| 1 | Tedavi geçmişi sekmesi açılmalı | "Yeni Tedavi Ekle" butonu görünürlüğü |
| 2 | Yeni tedavi ekleme diyaloğu | Dialog açılma kontrolü |
| 3 | Tedavi kartları listelenebilmeli | Demo data tedavileri veya boş mesaj |
| 4 | Ödemeler sekmesi ve özet kartları | Toplam Tedavi Tutarı, Ödenen, Kalan Borç |
| 5 | Yeni ödeme ekleme diyaloğu | Ödeme diyaloğu açılma kontrolü |
| 6 | Ödeme tutarları görünmeli | ₺ sembolünün sayfada bulunması |

---

### 6. `settings.spec.ts` — Ayarlar, Tedavi Türleri, Audit Log (14 test)

**Kapsanan API Endpoint'leri:**
- `GET /api/settings/clinic/` (Klinik ayarları okuma)
- `PUT /api/settings/clinic/` (Klinik ayarları güncelleme — sadece admin)
- `GET /api/treatment-types/` (Tedavi türleri listesi)
- `POST /api/treatment-types/` (Yeni tedavi türü)
- `GET /api/audit-logs/` (İşlem geçmişi — sadece admin)
- `GET /api/users/` (Personel listesi — sadece admin)

**Testler:**

| # | Test Adı | Açıklama |
|---|---|---|
| 1 | Admin ayarlar sayfası açılmalı | Başlangıç/bitiş saati select alanları |
| 2 | Çalışma saatleri değiştirilebilmeli | Açılış saati seçim kontrolü |
| 3 | Çalışma günleri toggle butonları | Pazartesi, Cumartesi, Pazar butonları |
| 4 | Doktor ayarları sadece görüntüleyebilmeli | "Sadece görüntüleme" badge'i |
| 5 | Admin Personel Yönetimi sekmesi | "Personel Yönetimi" sekmesine erişim |
| 6 | Tedavi türleri sayfası açılmalı | "Tedavi Türleri Yönetimi" başlığı |
| 7 | Tedavi türleri tablosu görünmeli | "Tedavi Adı" sütunu |
| 8 | Yeni tedavi türü diyaloğu | İsim ve fiyat alanları |
| 9 | Tedavi türü arama çalışmalı | "Kanal" aramasının filtrelemesi |
| 10 | Tedavi türü diyaloğunda iptal | İptal → diyalog kapanması |
| 11 | Admin İşlem Geçmişi erişimi | "İşlem Geçmişi" sayfası açılması |
| 12 | İşlem Geçmişi tablosu ve filtreleri | Arama filtresi görünürlüğü |
| 13 | Doktor İşlem Geçmişi göremez | Menüde link gizli |
| 14 | Asistan İşlem Geçmişi göremez | Menüde link gizli |

---

### 7. `public.spec.ts` — SaaS Public Sayfaları (4 test)

**Kapsanan API Endpoint'leri:**
- `GET /api/public/clinic-info/` (Herkese açık klinik bilgisi)

**Testler:**

| # | Test Adı | Açıklama |
|---|---|---|
| 1 | SaaS landing sayfası görünmeli | `localhost:5173` → h1 başlığı |
| 2 | Navbar linkleri çalışmalı | Nav linklerinin varlığı |
| 3 | Kayıt sayfasına navigasyon | `/register` rotası |
| 4 | Tenant giriş sayfasına navigasyon | `/login` rotası |

---

## 🔧 Yardımcı Dosya

### `helpers.ts` — Merkezi Login Fonksiyonu

Tüm test dosyaları tarafından paylaşılan `loginAs(page, username, password)` fonksiyonu.

**Veritabanı Kullanıcıları (standard.localhost tenant'ı):**

| Rol | Kullanıcı Adı | Şifre |
|---|---|---|
| Admin | `tony` | `demo123!` |
| Doktor | `dr_steve` | `demo123!` |
| Asistan | `asistan_peter` | `demo123!` |

---

## 🚀 Testleri Çalıştırma

```bash
# Tüm testler
npx playwright test

# Belirli bir dosya
npx playwright test auth.spec.ts

# HTML rapor ile
npx playwright test --reporter=html

# Görsel modda (tarayıcı açık)
npx playwright test --headed
```

> **Ön Koşul:** Backend (`python manage.py runserver`) ve Frontend (`npm run dev`) çalışır durumda olmalıdır.
