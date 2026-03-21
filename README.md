# Yaşca: Diş Kliniği Yönetim Sistemi

Yaşca, diş hekimliği kliniklerinin operasyonel iş akışlarını dijitalleştirmek, veri güvenliğini sağlamak ve klinik verimliliğini artırmak amacıyla geliştirilmiş, açık kaynaklı (FOSS) ve modern bir web uygulamasıdır.

## Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js:** v20.18.0 veya üzeri
- **npm:** v10 veya üzeri
- **Python:** 3.10 veya üzeri (backend için)

---

### 1. Backend Kurulumu

Backend API servisini çalıştırmak için:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

`createsuperuser` komutu admin kullanıcısı oluşturur (kullanıcı adı, e-posta, şifre girin). Admin paneli için bu hesap gereklidir.

**Backend çalıştırma:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```
- API: http://localhost:8000
- Admin panel: http://localhost:8000/admin/

---

### 2. Frontend Kurulumu

Ana dizinden:

```powershell
npm run install:all
```

**Frontend çalıştırma:**
```powershell
npm run frontend
```
- Uygulama: http://localhost:5173

---

### 3. Tam Sistem Çalıştırma

Her iki servisi de aynı anda çalıştırmak için **iki ayrı terminal** açın:

| Terminal 1 (Backend)        | Terminal 2 (Frontend) |
|-----------------------------|------------------------|
| `cd backend`                | `npm run frontend`     |
| `.\venv\Scripts\Activate.ps1` |                        |
| `python manage.py runserver` |                        |

---

### Teknik Notlar
- Stil yönetimi: Tailwind CSS v4 (Vite Engine)
- Path Aliasing: `src` klasörü için `@/` alias yapısı tanımlıdır.
- Ikon kütüphanesi: Lucide-React

## Google Drive
Projenin analiz, tasarım ve raporlama süreçlerine ait tüm yaşayan dokümanlar Google Drive üzerinde tutulmaktadır:
- [Proje Ortak Drive Klasörü](https://drive.google.com/drive/folders/1MIkAUt22XlOlq_ApWenSi2XKufBu_92k)

## Proje Hakkında
Bu proje, yüksek lisans/abonelik maliyetleri ve karmaşık arayüzler gibi sektörel sorunlara "Radikal Basitlik" felsefesiyle çözüm sunmayı hedefler. Sadece klinik personeli (Hekim, Asistan, Yönetici) tarafından kullanılır.

### Kullanılan Teknolojiler (Tech Stack)
- **Frontend:** React.js
- **Backend:** Python, Django REST Framework
- **Database:** SQLite (geliştirme) / PostgreSQL (üretim)
- **DevOps:** Docker (planlanan)

## Proje Yapısı (Monorepo)
- `/frontend`: React.js tabanlı kullanıcı arayüzü (SPA).
- `/backend`: Django tabanlı RESTful API servisleri.
- `/docs`: Dokümantasyon bilgilendirmeleri.

## Katılımcılar
- **Yaman Halloum**
- **Ali Üre**
- **Cihan Kurtbey**
- **Şükrü Yeşilmen**