import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
try:
    django.setup()
except Exception:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()

from customers.models import Client
from django_tenants.utils import schema_context
from api.models import Patient

total_count = 0

for client in Client.objects.all():
    with schema_context(client.schema_name):
        count = 0
        for p in Patient.objects.all():
            if not p.phone:
                continue

            original = p.phone
            cleaned = re.sub(r'\D', '', p.phone)
            
            if cleaned.startswith('05'):
                cleaned = '+90' + cleaned[1:]
            elif cleaned.startswith('5') and len(cleaned) == 10:
                cleaned = '+90' + cleaned
            elif cleaned.startswith('905'):
                cleaned = '+' + cleaned
            else:
                if cleaned and not p.phone.startswith('+'):
                    if len(cleaned) == 10:
                        cleaned = '+90' + cleaned
                    elif len(cleaned) == 11 and cleaned.startswith('0'):
                        cleaned = '+90' + cleaned[1:]
                    else:
                        cleaned = '+90' + cleaned
                elif p.phone.startswith('+'):
                    cleaned = '+' + cleaned

            if cleaned != original:
                p.phone = cleaned
                p.save(update_fields=['phone'])
                count += 1
        print(f"Schema {client.schema_name}: Migrated {count} phone numbers.")
        total_count += count

print(f"All phone numbers migrated successfully. Total updated across all tenants: {total_count}")
