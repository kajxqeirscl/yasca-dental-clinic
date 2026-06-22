from customers.models import Client, Domain

try:
    # Kliniği oluşturuyoruz (schema_name veritabanındaki fiziksel bölümün adıdır)
    tenant = Client(schema_name='ali', name='Ali Dis Klinigi', is_active=True)
    tenant.save()  # Bu save metodu arka planda migrate komutlarını kendi kendine çalıştıracak
    
    # Oluşan kliniğe alt alan adı (subdomain) atıyoruz
    domain = Domain(domain='ali.localhost', tenant=tenant, is_primary=True)
    domain.save()
    
    print('>>> Harika! Ali Dis Klinigi basariyla sisteme eklendi ve izolasyonu saglandi.')
except Exception as e:
    print('Hata:', e)
