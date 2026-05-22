import os
import django
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from customers.models import Client, Domain
from django_tenants.utils import tenant_context
from api.models import CustomUser

def create_tenant_and_users():
    try:
        # 1. Create Public Tenant if not exists
        public_tenant, created = Client.objects.get_or_create(
            schema_name='public',
            defaults={'name': 'Public SaaS', 'is_active': True}
        )
        if created:
            Domain.objects.get_or_create(
                domain='localhost',
                tenant=public_tenant,
                is_primary=True
            )
            print(">>> Created public tenant.")

        # 2. Create standard.localhost tenant
        tenant, created = Client.objects.get_or_create(
            schema_name='standard',
            defaults={'name': 'Standard Dental Clinic', 'is_active': True}
        )
        if created:
            Domain.objects.get_or_create(
                domain='standard.localhost',
                tenant=tenant,
                is_primary=True
            )
            print(">>> Created 'standard' tenant.")
        
        # 3. Create users under 'standard' tenant context
        with tenant_context(tenant):
            # Admin User
            tony, created = CustomUser.objects.get_or_create(
                username='tony',
                defaults={
                    'email': 'tony@standard.com',
                    'is_superuser': True,
                    'is_staff': True,
                    'role': 'admin'
                }
            )
            if created:
                tony.set_password('demo123!')
                tony.save()

            # Doctor User
            steve, created = CustomUser.objects.get_or_create(
                username='dr_steve',
                defaults={
                    'email': 'steve@standard.com',
                    'role': 'doctor'
                }
            )
            if created:
                steve.set_password('demo123!')
                steve.save()

            # Assistant User
            peter, created = CustomUser.objects.get_or_create(
                username='asistan_peter',
                defaults={
                    'email': 'peter@standard.com',
                    'role': 'assistant'
                }
            )
            if created:
                peter.set_password('demo123!')
                peter.save()
                
            print(">>> Created CI users: tony (admin), dr_steve (doctor), asistan_peter (assistant).")
            
    except Exception as e:
        print("Error during CI setup:", e)
        sys.exit(1)

if __name__ == '__main__':
    create_tenant_and_users()
