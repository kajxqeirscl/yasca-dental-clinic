"""
Diş kliniği tedavi türleri seed scripti.
Çalıştır: python seed_treatment_types.py
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import TreatmentType

TREATMENTS = [
    # Muayene & Teşhis
    ("Muayene", 0),
    ("Kontrol Muayenesi", 0),
    ("Röntgen (Periapikal)", 150),
    ("Röntgen (Panoramik)", 400),
    ("Röntgen (Sefalometrik)", 400),
    ("3D CBCT Tomografi", 1500),
    # Koruyucu
    ("Diş Temizliği (Tartar)", 500),
    ("Diş Beyazlatma (Ofis)", 2500),
    ("Flor Uygulaması", 300),
    ("Fissür Örtücü", 400),
    # Dolgular
    ("Amalgam Dolgu", 500),
    ("Kompozit Dolgu (1 Yüz)", 600),
    ("Kompozit Dolgu (2 Yüz)", 800),
    ("Kompozit Dolgu (3 Yüz)", 1000),
    ("Cam İyonomer Dolgu", 450),
    ("İnley / Onley", 3000),
    # Kanal Tedavisi
    ("Kanal Tedavisi (Ön Diş)", 1500),
    ("Kanal Tedavisi (Küçük Azı)", 2000),
    ("Kanal Tedavisi (Büyük Azı)", 2500),
    ("Kanal Tedavisi Yenileme", 3000),
    ("Apikoektomi", 3500),
    # Protez
    ("Metal Destekli Porselen Kron", 4000),
    ("Tam Seramik (Zirkonyum) Kron", 6000),
    ("Implant Üstü Kron", 7000),
    ("Sabit Köprü (per üye)", 4000),
    ("Tam Protez (Üst / Alt)", 8000),
    ("Bölümlü Protez", 5000),
    ("Overdenture Protez", 9000),
    # İmplant
    ("İmplant Cerrahisi", 15000),
    ("Alveol Kemiği Grefti (Greftleme)", 8000),
    ("Sinüs Lifting", 10000),
    ("Membran Uygulaması (GBR)", 6000),
    # Çekim
    ("Diş Çekimi (Basit)", 500),
    ("Diş Çekimi (Cerrahi)", 1500),
    ("Gömük 20'lik Diş Çekimi", 3000),
    ("Kök Ucu Rezeksiyonu", 4000),
    # Periodontoloji (Diş Eti)
    ("Diş Eti Tedavisi (Küretaj)", 1000),
    ("Gingivektomi / Gingivoplasti", 2000),
    ("Flep Operasyonu", 5000),
    ("Serbest Dişeti Grefti", 4000),
    # Ortodonti
    ("Metal Braket Tedavisi", 20000),
    ("Seramik Braket Tedavisi", 25000),
    ("Şeffaf Plak (Aligner) Tedavisi", 30000),
    ("Retainer (Pekiştirme Apareyi)", 2000),
    # Pedodonti
    ("Çocuk Muayenesi", 0),
    ("Süt Dişi Çekimi", 300),
    ("Süt Dişi Kanal Tedavisi", 800),
    ("Yer Tutucu Aparey", 1500),
    # Kozmetik / Estetik
    ("Laminat Veneer (Porselen)", 7000),
    ("Kompozit Veneer", 2500),
    ("Diastema Kapatma", 1500),
    ("Diş Şekillendirme (Kontürleme)", 500),
    # Diğer
    ("Lokal Anestezi", 150),
    ("Ağız Koruyucu", 1500),
    ("Bruksizm Plağı (Gece Koruyucu)", 2000),
    ("TME Splint Tedavisi", 3000),
]

from api.models import Clinic

# İlk kliniği bul veya oluştur
clinic, _ = Clinic.objects.get_or_create(
    name="Yaşca Dental Klinik",
    defaults={"address": "", "phone": ""},
)

created = 0
for name, price in TREATMENTS:
    obj, is_new = TreatmentType.objects.get_or_create(
        name=name,
        clinic=clinic,
        defaults={"default_price": price, "is_active": True},
    )
    if is_new:
        created += 1

# Klinige bağlı olmayan eski kayıtları da güncelle
orphans = TreatmentType.objects.filter(clinic__isnull=True).update(clinic=clinic)
if orphans:
    print(f"  {orphans} klinike bağlı olmayan kayıt güncellendi.")

total = TreatmentType.objects.filter(clinic=clinic).count()
print(f"Tamamlandı: {created} yeni tedavi türü eklendi, klinik toplam {total} kayıt.")
