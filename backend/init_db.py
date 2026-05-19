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

# 2. Run seeding logic if TreatmentType table is empty
if TreatmentType.objects.filter(clinic=clinic).count() == 0:
    print("- Seeding treatment types...")
    import seed_treatment_types
    print("- Default treatment types seeded.")
else:
    print("- Treatment types already seeded.")

# 3. Ensure admin user exists and is linked to the clinic
user, created = CustomUser.objects.get_or_create(
    username="admin",
    defaults={
        "email": "admin@admin.com",
        "is_superuser": True,
        "is_staff": True,
        "clinic": clinic,
    }
)

if created:
    user.set_password("admin123")
    user.save()
    print("- Admin user 'admin' created with password 'admin123'.")
else:
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
