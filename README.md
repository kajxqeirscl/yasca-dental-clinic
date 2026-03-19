# Yaşca: Diş Kliniği Yönetim Sistemi

Yaşca, diş hekimliği kliniklerinin operasyonel iş akışlarını dijitalleştirmek, veri güvenliğini sağlamak ve klinik verimliliğini artırmak amacıyla geliştirilmiş, açık kaynaklı (FOSS) ve modern bir web uygulamasıdır.

## Kurulum ve Calistirma

### Gereksinimler
- Node.js: v20.18.0 veya uzeri
- npm: v10 veya uzeri

### Frontend Gelistirme Ortami
Sistemin arayuzunu calistırmak icin ana dizin (root) uzerinden asagidaki adimlar izlenmelidir:

1. Bağımlılıkların Yuklenmesi:
```powershell
npm run install:all
```

2. Uygulamanın Baslatılması:
```powershell
npm run frontend
```
Uygulama varsayılan olarak http://localhost:5173 adresinde calismaktadir.

### Teknik Notlar
- Stil yonetimi: Tailwind CSS v4 (Vite Engine)
- Path Aliasing: src klasoru icin @/ alias yapısı tanımlanmıstır.
- Ikon kütüphanesi: Lucide-React

## Google Drive
Projenin analiz, tasarım ve raporlama süreçlerine ait tüm yaşayan dokümanlar Google Drive üzerinde tutulmaktadır:
- [Proje Ortak Drive Klasörü](https://drive.google.com/drive/folders/1MIkAUt22XlOlq_ApWenSi2XKufBu_92k)

## Proje Hakkında
Bu proje, yüksek lisans/abonelik maliyetleri ve karmaşık arayüzler gibi sektörel sorunlara "Radikal Basitlik" felsefesiyle çözüm sunmayı hedefler. Sadece klinik personeli (Hekim, Asistan, Yönetici) tarafından kullanılır.

### Kullanılan Teknolojiler (Tech Stack)
- **Frontend:** React.js 
- **Backend:** Python, Django REST Framework
- **Database:** PostgreSQL
- **DevOps:** Docker (Planlanan)

## Proje Yapısı (Monorepo)
- `/frontend`: React.js tabanlı kullanıcı arayüzü (SPA).
- `/backend`: Django tabanlı RESTful API servisleri.
- `/docs`: Dokümantasyon bilgilendirmeleri.

## Katılımcılar
- **Yaman Halloum**
- **Ali Üre**
- **Cihan Kurtbey**
- **Şükrü Yeşilmen**