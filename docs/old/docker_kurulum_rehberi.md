# Yaşca Dental Clinic - Docker Kurulum ve Kullanım Rehberi 🐳

Bu belge, projenin **Docker** kullanılarak tüm ekip üyeleri tarafından aynı standartta, bilgisayara ek bir veritabanı veya sunucu kurulumu gerektirmeden nasıl ayağa kaldırılacağını açıklar.

## 1. Neden Docker Kullanıyoruz?
* Bilgisayarınıza PostgreSQL, Node.js veya farklı Python versiyonları kurmanıza gerek kalmaz.
* Frontend (React), Backend (Django) ve Veritabanı (PostgreSQL) tek bir komutla ayağa kalkar.
* Tüm ekip üyelerinde "Benim bilgisayarımda çalışıyordu, sende neden çalışmıyor?" sorunu ortadan kalkar.

---

## 2. İlk Kurulum ve Projeyi Çalıştırma

Projeyi çalıştırmak için bilgisayarınızda **Docker Desktop**'ın yüklü ve açık olması yeterlidir.

### Sistemi Ayağa Kaldırmak
Terminalinizi (VS Code terminali vb.) projenin ana klasöründe ( `docker-compose.yml` dosyasının olduğu dizin) açın ve şu komutu girin:

```bash
docker-compose up --build
```

Bu komut şunları otomatik olarak yapar:
1. `yascadb` adında taze bir PostgreSQL veritabanı kurar.
2. Backend (Django) sunucusunu başlatır ve tabloları otomatik oluşturur.
3. Frontend (React/Vite) sunucusunu başlatır.

Sistem başladığında web sitesine **`http://localhost:5173`** adresinden erişebilirsiniz.

---

## 3. İlk Veritabanı Ayarları (Tamamen Otomatik!)

Sistem ilk kez çalıştırıldığında veritabanı otomatik olarak hazırlanır. Sizin ekstra bir komut çalıştırmanıza gerek yoktur:
1. **Veritabanı Tabloları** otomatik olarak oluşturulur.
2. **56 Farklı Tedavi Türü** ve varsayılan klinik otomatik olarak veritabanına eklenir.
3. Giriş yapabileceğiniz varsayılan yönetici hesabı oluşturulur.

Sistem ayağa kalkar kalkmaz tarayıcınızdan giriş yapabilirsiniz:
* **Kullanıcı Adı:** `admin`
* **Şifre:** `admin123`

*(Not: Eğer kendiniz ek bir superuser (yönetici) oluşturmak isterseniz `docker-compose exec backend python manage.py createsuperuser` komutunu kullanabilirsiniz.)*

---

## 4. Sisteme Dışarıdan Veritabanı Bağlantısı

Veritabanındaki tabloları doğrudan pgAdmin, DBeaver veya DataGrip gibi bir programla manuel incelemek isterseniz, şu bilgilerle yeni bir sunucu (Server) tanımlayarak bağlanabilirsiniz:

* **Sunucu Adı (Name):** `Yasca Docker` (veya dilediğiniz bir isim)
* **Host:** `localhost`
* **Port:** `5432`
* **Kullanıcı Adı:** `postgres`
* **Şifre:** `postgres123`
* **Veritabanı Adı:** `yascadb`

---

## 5. Olası Sorunlar ve Çözümleri

### Port 5432 Çakışması (Yerel PostgreSQL Hatası)
Eğer bilgisayarınızda önceden kurulmuş yerel bir PostgreSQL veritabanı varsa, Docker veritabanı ile çakışabilir ve `localhost:5432` portuna bağlanamayabilirsiniz.

**Çözümü (Windows):**
1. Windows Arama çubuğuna **Hizmetler** (Services) yazıp uygulamayı açın.
2. Listeden **`postgresql-x64-xx`** (örneğin `postgresql-x64-15` veya `postgresql-x64-16`) hizmetini bulun.
3. Üzerine sağ tıklayıp **Durdur (Stop)** seçeneğini seçin. 
4. Docker Desktop uygulamasını açıp konteynerlerinizi yeniden başlatın.

---


## 6. Sistemi Kapatmak

Çalışan projeyi durdurmak için `docker-compose up` komutunu çalıştırdığınız terminalde `CTRL + C` tuşlarına basabilirsiniz.

Eğer sistemi arka planda çalışan konteynerleriyle birlikte tamamen kapatmak isterseniz:
```bash
docker-compose down
```
*Not: `down` komutu verilerinizi (hastalar, randevular) silmez. Verileriniz Docker volume (`postgres_data`) içinde güvenle saklanır.*
