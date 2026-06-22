import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import CustomUser, Clinic, TreatmentType

print("Checking database initialization...")

# 1. Ensure clinic is created
clinic, clinic_created = Clinic.objects.get_or_create(
    name="Yaşca Dental Klinik",
    defaults={"address": "Merkez Mah.", "phone": "05555555555"},
)
if clinic_created:
    print("- Created default clinic: 'Yaşca Dental Klinik'")

# 2. Skip seeding by default to avoid clutter
# If you want to seed, you can run `python manage.py seed_demo_data` manually.
# if TreatmentType.objects.filter(clinic=clinic).count() == 0:
#     import seed_treatment_types

# 3. Ensure admin user exists and is linked to the clinic
user, created = CustomUser.objects.get_or_create(
    username="admin",
    defaults={
        "email": "admin@admin.com",
        "is_superuser": True,
        "is_staff": True,
        "role": CustomUser.Role.ADMIN, # FIXED: Explicitly set role to Admin
        "clinic": clinic,
    }
)

if created:
    user.set_password("admin123")
    user.save()
    print("- Admin user 'admin' created with password 'admin123'.")
else:
    # Update existing user role just in case they were created as assistant
    if user.role != CustomUser.Role.ADMIN:
        user.role = CustomUser.Role.ADMIN
        user.save()
        print("- Updated existing admin user role to Admin.")
        
    if not user.clinic:
        user.clinic = clinic
        user.save()
        print("- Linked existing admin user to the clinic.")
    print("- Admin user already exists.")

# 4. Make sure orphans (if any) are linked to the clinic
orphans = TreatmentType.objects.filter(clinic__isnull=True).update(clinic=clinic)
if orphans:
    print(f"- Linked {orphans} orphaned treatment types to the clinic.")

print("Database initialization completed successfully!")
