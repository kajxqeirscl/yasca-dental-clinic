from django_tenants.utils import schema_context
from api.models import CustomUser

# Sadece "ali" semasi (veritabani) icerisinde calisacagimizi belirtiyoruz
with schema_context('ali'):
    if not CustomUser.objects.filter(username='admin').exists():
        CustomUser.objects.create_superuser('admin', 'admin@ali.localhost', 'admin123')
        print(">>> Admin kullanicisi olusturuldu! (Kullanici: admin, Sifre: admin123)")
    else:
        print(">>> Admin zaten mevcut.")
