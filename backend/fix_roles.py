from django_tenants.utils import schema_context
from api.models import CustomUser

# Mevcut tum schemalardaki superuser'larin rolunu admin yap
for schema in ['ali', 'acibadem']:
    try:
        with schema_context(schema):
            updated = CustomUser.objects.filter(is_superuser=True).exclude(role='admin').update(role='admin')
            print(f"[{schema}] {updated} kullanici admin rolune guncellendi.")
    except Exception as e:
        print(f"[{schema}] Hata: {e}")
