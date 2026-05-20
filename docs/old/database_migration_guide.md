# Veritabanı PostgreSQL'e Taşıma Rehberi

Bu belge, Yaşca Dental Clinic projesinin yerel SQLite veritabanından PostgreSQL veritabanına taşınma sürecini ve diğer ekip üyelerinin projeyi kendi bilgisayarlarında (Local PostgreSQL) nasıl çalıştıracaklarını açıklar.

## 1. Neler Yapıldı?

* **Paketler Kuruldu:** Django'nun PostgreSQL ile konuşabilmesi için `psycopg2-binary`, `.env` dosyalarını okuyabilmesi için `python-dotenv` ve bağlantı URI'lerini işleyebilmesi için `dj-database-url` paketleri projeye eklendi.
* **Settings Güncellendi:** `backend/core/settings.py` içerisindeki `DATABASES` ayarı, `dj_database_url` kullanacak şekilde yeniden yapılandırıldı. Artık veritabanı bağlantı metni (URL) doğrudan kod içine gömülü değildir; `.env` dosyasından okunmaktadır.

## 2. Karşılaşılan Önemli Hata ("Veri Bulunamadı") ve Çözümü

PostgreSQL'e geçiş yaptıktan veya test verilerini yükledikten sonra frontend'de **"Hasta Bulunamadı"** veya **"Henüz tedavi türü eklenmemiş"** gibi boş ekranlarla karşılaşabilirsiniz.
**Bunun sebebi veritabanı motoru veya bağlantısı değildir!**

Sistemin mimarisinde sıkı bir **veri izolasyonu (clinic tabanlı)** bulunmaktadır. Yani her hasta, her randevu ve her kullanıcı belli bir kliniğe (`clinic_id`) aittir.
Eğer veritabanında test verisi (seed) veya yeni bir `admin` kullanıcısı oluşturduğumuzda bu verilerin `clinic_id` alanı boş kalırsa (`None`), kullanıcı sisteme giriş yaptığında API kendi kliniğini filtrelemeye çalışır ve klinik atanmadığı için hiçbir veriyi göremez. Bu durumu çözmek için sistemdeki yöneticinin ve kayıtların aynı kliniğe atandığından emin olmak gerekir.

---

## 3. Ekip Üyelerinin Yapması Gerekenler (Kurulum Adımları)

Projeyi kendi bilgisayarınızdaki **Local PostgreSQL** ile çalıştırmak için şu adımları eksiksiz uygulamalısınız:

### Adım 1: PostgreSQL Kurulumu ve Veritabanı Oluşturma
Bilgisayarınızda PostgreSQL ve pgAdmin (veya DBeaver) yüklü olmalıdır. PostgreSQL içinde **`yascadb`** adında boş bir veritabanı oluşturun.

### Adım 2: .env Dosyası Oluşturma
Projeyi git üzerinden çektikten sonra `backend` klasörünün içerisine `.env` adında yeni bir dosya oluşturun ve içine şu satırı ekleyin:

```env
DATABASE_URL=postgresql://KULLANICI_ADI:SIFRE@localhost:5432/yascadb
```
*(Örnek: `postgresql://postgres:postgres123@localhost:5432/yascadb`. Kendi PostgreSQL şifrenizi girmeyi unutmayın!)*

### Adım 3: Migration ve Veritabanını Doldurma (Terminal)
VS Code terminalinde `backend` dizinindeyken sırasıyla şu komutları çalıştırın:

1. Paketleri güncelleyin: 
   ```bash
   pip install -r requirements.txt
   ```
2. Tabloları veritabanına uygulayın: 
   ```bash
   python manage.py migrate
   ```
3. Test verilerini (Tedavi türleri vb.) yükleyin: 
   ```bash
   python manage.py seed_demo_data
   ```

### Adım 4: Klinik ve Kullanıcı Ataması (Çok Önemli!)
Oluşturulan veya var olan admin kullanıcısının verileri görebilmesi için kliniğe bağlı olması gerekir. Bunun için Django shell'e girin:

```bash
python manage.py shell
```

Shell açıldığında şu kodları sırayla çalıştırın:
```python
from api.models import CustomUser, Clinic
# Kliniği seç
clinic = Clinic.objects.first() 

# Kendi kullanıcı adınızı seçin (Örn: admin)
user = CustomUser.objects.get(username="admin") 

# Kullanıcıyı kliniğe bağla ve kaydet
user.clinic = clinic
user.save()
print("Kullanıcı kliniğe bağlandı:", user.clinic.name)
exit()
```

Bunu yaptıktan sonra `python manage.py runserver` ile backend'i ve `npm run dev` ile frontend'i çalıştırdığınızda sistem **Local PostgreSQL** ile sorunsuz bir şekilde ayağa kalkacaktır!
