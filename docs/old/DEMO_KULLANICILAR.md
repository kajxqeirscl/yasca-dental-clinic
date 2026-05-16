# Demo Kullanıcı Bilgileri

`python manage.py seed_demo_data` komutu çalıştırıldığında oluşturulan test hesapları.

> **Uyarı:** Bu hesaplar yalnızca geliştirme/sunum amaçlıdır. Üretim ortamında kullanılmamalıdır.

## Veritabanı

- **Geliştirme:** SQLite — `backend/db.sqlite3`
- **Üretim (planlanan):** PostgreSQL (bkz. [YAPILACAKLAR_LISTESI.txt](YAPILACAKLAR_LISTESI.txt) madde 88)

## Hesaplar

Tüm hesaplar için ortak şifre: **`demo123!`**

| Rol       | Kullanıcı Adı   | Açıklama                          |
|-----------|------------------|-----------------------------------|
| Yönetici  | `admin`          | Tam yetkili admin kullanıcısı     |
| Doktor    | `dr_ahmet`       | Hekim rolü, klinik işlemleri      |
| Asistan   | `asistan_ayse`   | Asistan rolü, sınırlı yetki       |

## Erişim Adresleri

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Admin Panel:** http://localhost:8000/admin/

## Verileri Yenileme

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py flush --no-input
python manage.py seed_demo_data
```
