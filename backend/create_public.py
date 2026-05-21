from customers.models import Client, Domain

try:
    tenant = Client(schema_name='public', name='Yasca Dental SaaS', is_active=True)
    tenant.save()
    domain = Domain(domain='localhost', tenant=tenant, is_primary=True)
    domain.save()
    print('SaaS Ana Kiraci (Public) olusturuldu!')
except Exception as e:
    print('Hata:', e)
