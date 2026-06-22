import os
from customers.models import Client, Domain

PRODUCTION_DOMAIN = os.environ.get('PRODUCTION_DOMAIN', 'localhost')

try:
    tenant, created = Client.objects.get_or_create(
        schema_name='public',
        defaults={'name': 'Yasca Dental SaaS', 'is_active': True}
    )
    if created:
        print('SaaS Ana Kiraci (Public) olusturuldu!')
    else:
        print('SaaS Ana Kiraci zaten mevcut.')

    # Localhost domain (geliştirme)
    Domain.objects.get_or_create(
        domain='localhost',
        defaults={'tenant': tenant, 'is_primary': True}
    )

    # Production domain (Railway / custom domain)
    if PRODUCTION_DOMAIN != 'localhost':
        Domain.objects.get_or_create(
            domain=PRODUCTION_DOMAIN,
            defaults={'tenant': tenant, 'is_primary': False}
        )

    print('Gerekli domainler olusturuldu!')
except Exception as e:
    print('Hata:', e)
