# Tedavi Türleri Yönetimi & Ödeme–Tedavi–Randevu Uygulama Planı

## Kullanıcı Kararları

| Soru | Karar |
|------|-------|
| Tedavi türü yönetimi nereye konulsun? | **Ayrı sayfa** (`/tedavi-turleri`) |
| Soft-delete mi hard-delete mi? | **Soft-delete** — hard-delete olmamalı. Logging sistemine uygun olmalı |
| Taksit desteği gerekli mi? | **Evet**, birden fazla ödeme tek bir tedaviye bağlanabilmeli |

---

## Kritik Bulgu: Logging/Audit Sistemi Yok

> [!CAUTION]
> Projede **hiçbir logging veya audit trail mekanizması bulunmuyor**:
> - `settings.py`'de `LOGGING` konfigürasyonu yok
> - Hiçbir dosyada `import logging` veya `logger` kullanımı yok
> - Audit trail modeli (kim, ne zaman, ne değiştirdi) yok
> - Tüm `ModelViewSet`'ler varsayılan `destroy()` kullanıyor — **hard-delete yapıyor**

### Hard-delete yapan endpointler (şu an):

| ViewSet | DELETE ile silinebilen | Sorun |
|---------|----------------------|-------|
| `AppointmentViewSet` | Randevular | Silinen randevunun kaydı tamamen kaybolur |
| `TreatmentViewSet` | Tedavi kayıtları | Hasta tedavi geçmişi geri döndürülemez şekilde silinir |
| `TreatmentTypeViewSet` | Tedavi türleri | `is_active` alanı var ama `destroy()` override edilmemiş — hard-delete yapıyor |
| `PaymentViewSet` | Ödeme kayıtları | Mali kayıtların silinmesi kabul edilemez |
| `DocumentViewSet` | Hasta dokümanları | Dosya + DB kaydı birlikte silinir |

---

## Uygulama Planı

### Faz 0: Audit Logging Altyapısı (Önkoşul)

#### [NEW] `backend/api/models.py` — `AuditLog` modeli
```python
class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "create", "Oluşturma"
        UPDATE = "update", "Güncelleme"
        DELETE = "delete", "Silme"
        SOFT_DELETE = "soft_delete", "Devre Dışı"

    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, null=True)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    model_name = models.CharField(max_length=100)  # "Treatment", "Payment" vb.
    object_id = models.IntegerField()
    object_repr = models.CharField(max_length=255)  # __str__ değeri
    changes = models.JSONField(default=dict, blank=True)  # {field: [old, new]}
    timestamp = models.DateTimeField(auto_now_add=True)
```

#### [MODIFY] `backend/core/settings.py` — Django LOGGING ekle
- Console ve dosya handler'ları ile temel Django logging konfigürasyonu

#### [MODIFY] Tüm ViewSet'ler — Soft-delete & Audit
Aşağıdaki ViewSet'lerde `perform_destroy` override edilecek:

- **`TreatmentTypeViewSet`**: `is_active = False` (soft-delete, alan zaten mevcut)
- **`AppointmentViewSet`**: Silmek yerine `status = "cancelled"` (alan zaten mevcut)
- **`TreatmentViewSet`**: `is_active` alanı eklenmeli, soft-delete
- **`PaymentViewSet`**: `is_active` alanı eklenmeli, soft-delete
- **`DocumentViewSet`**: `is_active` alanı eklenmeli, soft-delete (dosya korunur)

Her `perform_create`, `perform_update`, `perform_destroy` işleminde `AuditLog` kaydı oluşturulacak.

---

### Faz 1: Tedavi Türü Yönetim Sayfası

#### [MODIFY] `frontend/src/app/services/api.ts`
- `createTreatmentType(data)` — POST
- `updateTreatmentType(id, data)` — PATCH
- `deleteTreatmentType(id)` — DELETE (backend'de soft-delete)

#### [NEW] `frontend/src/app/components/TreatmentTypesPage.tsx`
Ayrı bir sayfa (`/tedavi-turleri`):
- Tedavi türlerini tablo halinde listeleme (ad, varsayılan fiyat, durum)
- Ekleme dialog'u (ad + fiyat)
- Satır içi düzenleme veya dialog ile düzenleme
- Devre dışı bırakma butonu (soft-delete, konfirmasyon ile)
- `role === 'assistant'` ise düzenleme butonları gizlenir, sadece görüntüleme

#### [MODIFY] `frontend/src/app/App.tsx` — Route ekleme
```tsx
<Route path="/tedavi-turleri" element={<TreatmentTypesPage />} />
```

#### [MODIFY] `frontend/src/app/components/Layout.tsx` — Navigasyon
```tsx
{ path: '/tedavi-turleri', label: 'Tedavi Türleri', icon: Stethoscope, adminOnly: false }
```

---

### Faz 2: Ödeme–Tedavi İlişkisi & Taksit Desteği

#### [MODIFY] `backend/api/models.py`

**`Treatment` modeline ekleme:**
```python
price = models.DecimalField("Uygulanan Fiyat", max_digits=10, decimal_places=2, default=0)
is_active = models.BooleanField("Aktif", default=True)
```
- Tedavi oluşturulurken `TreatmentType.default_price` otomatik atanır
- Doktor farklı fiyat girebilir

**`Payment` modeline ekleme:**
```python
treatment = models.ForeignKey(
    Treatment, on_delete=models.SET_NULL,
    null=True, blank=True,
    related_name="payments",
)
is_active = models.BooleanField("Aktif", default=True)
```

#### [MODIFY] `frontend/src/app/components/PaymentDialog.tsx`
- Tedavi seçme dropdown'u (hastanın tedavileri listelenir)
- Seçili tedavinin kalan borcunu gösterme
- Tedavi seçimi opsiyonel (genel ödeme de yapılabilir)

#### [MODIFY] `frontend/src/app/components/PatientProfile.tsx` — Ödemeler tabı
- Bakiye özeti: `Toplam Tedavi Maliyeti – Toplam Ödemeler = Kalan Borç`
- Tedavi bazında ödeme durumu gösterimi
- Taksit geçmişi (bir tedaviye bağlı birden fazla ödeme)

#### [MODIFY] `frontend/src/app/components/TreatmentAddDialog.tsx`
- Fiyat alanı ekleme (TreatmentType seçildiğinde `default_price` otomatik dolar, değiştirilebilir)

---

### Faz 3: Randevu–Tedavi Türü Tutarlılığı (İsteğe Bağlı)

#### [MODIFY] `Appointment` modeli
- `treatment_type` → `CharField`'dan `ForeignKey(TreatmentType)` haline getirme
- Migration'da veri dönüşümü gerekir
- Frontend'de randevu formlarında tedavi türü dropdown'a geçiş

---

## Yetkilendirme Kuralları

| İşlem | Admin | Hekim | Asistan |
|-------|-------|-------|---------|
| Tedavi türü listeleme | ✅ | ✅ | ✅ |
| Tedavi türü ekleme/düzenleme/silme | ✅ | ✅ | ❌ |
| Tedavi kaydı ekleme (mevcut türlerden) | ✅ | ✅ | ✅ |
| Ödeme kaydı ekleme | ✅ | ✅ | ✅ |
| Randevu ekleme | ✅ | ✅ | ✅ |
| Audit log görüntüleme | ✅ | ❌ | ❌ |

---

## Verification Plan

### Automated Tests
- Tüm ViewSet'lerde DELETE çağrısının hard-delete yerine soft-delete yapmasını doğrulama
- AuditLog kaydının create/update/delete işlemlerinde oluştuğunu doğrulama
- Asistan ile `POST /treatment-types/` → `403`
- Asistan ile `POST /treatments/` → `201`
- Taksit: Aynı tedaviye birden fazla ödeme bağlanabilmeli
- Bakiye hesabı doğrulama

### Manual Verification
- Tedavi türü yönetim sayfasının rol bazında çalışmasını doğrulama
- Ödeme-tedavi ilişkisi ve bakiye gösteriminin doğruluğunu kontrol
- Silinen kayıtların `is_active=False` olarak soft-delete edildiğini DB'den kontrol
