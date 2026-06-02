from customers.models import Client, Domain

try:
    tenant, created = Client.objects.get_or_create(
        schema_name='public',
        defaults={'name': 'Yasca Dental SaaS', 'is_active': True}
    )
    if created:
        print('SaaS Ana Kiraci (Public) olusturuldu!')
    else:
        print('SaaS Ana Kiraci zaten mevcut.')

    # Localhost domain
    Domain.objects.get_or_create(
        domain='localhost',
        defaults={'tenant': tenant, 'is_primary': True}
    )
    
    # Render production domain
    Domain.objects.get_or_create(
        domain='yasca-dental-clinic.onrender.com',
        defaults={'tenant': tenant, 'is_primary': False}
    )
    
    print('Gerekli domainler olusturuldu!')
except Exception as e:
    print('Hata:', e)
