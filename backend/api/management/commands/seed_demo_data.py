import random
from datetime import timedelta, time

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django_tenants.utils import schema_context

from customers.models import Client, Domain
from api.models import (
    CustomUser, Patient, Appointment, TreatmentType, Treatment, Payment, ClinicSettings
)
from api.tests.factories import (
    AdminUserFactory, DoctorUserFactory, AssistantUserFactory,
    PatientFactory, AnamnesisFactory, TreatmentTypeFactory, AppointmentFactory,
    TreatmentFactory, PaymentFactory
)

class Command(BaseCommand):
    help = 'Seeds the database with realistic demo data across multiple tenants for presentation'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting Demo Data Generation..."))

        # Step 1: Ensure public tenant exists
        public_tenant, created = Client.objects.get_or_create(
            schema_name='public',
            defaults={'name': 'Yasca Dental SaaS', 'is_active': True}
        )
        Domain.objects.get_or_create(
            domain='localhost',
            defaults={'tenant': public_tenant, 'is_primary': True}
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created Public SaaS Tenant."))
        else:
            self.stdout.write("Public SaaS Tenant already exists.")

        # Define Demo Clinics
        clinics_data = [
            {
                'schema_name': 'standard', 
                'name': 'Stark Standard Clinic', 
                'domain': 'standard.localhost',
                'admin': ('tony', 'Tony', 'Stark'),
                'doctor': ('dr_steve', 'Steve', 'Rogers'),
                'assistant': ('asistan_peter', 'Peter', 'Parker')
            },
            {
                'schema_name': 'premium', 
                'name': 'Yıldız Premium Kliniği', 
                'domain': 'premium.localhost',
                'admin': ('kemal', 'Kemal', 'Yıldız'),
                'doctor': ('dr_ahmet', 'Ahmet', 'Kaya'),
                'assistant': ('asistan_ayse', 'Ayşe', 'Demir')
            },
        ]

        from django.db import connection

        for clinic_data in clinics_data:
            self.stdout.write(f"\n--- Setting up {clinic_data['name']} ---")
            
            schema_name = clinic_data['schema_name']
            # Delete domain first, then client
            Domain.objects.filter(tenant__schema_name=schema_name).delete()
            Client.objects.filter(schema_name=schema_name).delete()
            
            # Manually drop schema CASCADE to guarantee a clean slate
            with connection.cursor() as cursor:
                cursor.execute(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE")
            
            tenant = Client.objects.create(
                schema_name=schema_name,
                name=clinic_data['name'],
                is_active=True
            )
            Domain.objects.create(
                domain=clinic_data['domain'],
                tenant=tenant,
                is_primary=True
            )
            self.stdout.write(self.style.SUCCESS(f"Created Tenant: {clinic_data['name']}"))

            # Step 3: Seed data within the tenant's schema
            with schema_context(tenant.schema_name):
                self._seed_tenant_data(tenant, clinic_data)

        self.stdout.write(self.style.SUCCESS("\n" + "=" * 40))
        self.stdout.write(self.style.SUCCESS("Successfully generated all demo data!"))
        self.stdout.write(self.style.SUCCESS("=" * 40))

    @transaction.atomic
    def _seed_tenant_data(self, tenant, clinic_data):
        # Prevent double seeding if users exist
        if CustomUser.objects.exists():
            self.stdout.write(self.style.WARNING("Data already seeded for this tenant. Skipping generation."))
            return

        self.stdout.write("Configuring Clinic Settings...")
        settings = ClinicSettings.get_settings()
        settings.work_start_time = time(9, 0)
        settings.work_end_time = time(18, 0)
        settings.work_days = [1, 2, 3, 4, 5, 6] # Mon-Sat
        settings.save()

        self.stdout.write("Generating Users...")
        admin = AdminUserFactory(
            username=clinic_data['admin'][0], 
            first_name=clinic_data['admin'][1], 
            last_name=clinic_data['admin'][2], 
            is_staff=True, 
            is_superuser=True
        )
        admin.set_password("demo123!")
        admin.save()

        doctor = DoctorUserFactory(
            username=clinic_data['doctor'][0], 
            first_name=clinic_data['doctor'][1], 
            last_name=clinic_data['doctor'][2]
        )
        doctor.set_password("demo123!")
        doctor.save()

        assistant = AssistantUserFactory(
            username=clinic_data['assistant'][0], 
            first_name=clinic_data['assistant'][1], 
            last_name=clinic_data['assistant'][2]
        )
        assistant.set_password("demo123!")
        assistant.save()

        self.stdout.write("Generating Treatment Types...")
        tt_data = [
            ("Kanal Tedavisi",     2500.00, TreatmentType.Category.CANAL),
            ("Diş Çekimi",          800.00, TreatmentType.Category.EXTRACTION),
            ("Gömülü Diş Çekimi", 1500.00, TreatmentType.Category.EXTRACTION),
            ("İmplant",           12000.00, TreatmentType.Category.IMPLANT),
            ("Zirkonyum Kaplama",  4500.00, TreatmentType.Category.CROWN),
            ("Kompozit Dolgu",     1000.00, TreatmentType.Category.FILLING),
            ("Diş Taşı Temizliği",  800.00, TreatmentType.Category.DETARTRAJ),
        ]
        treatment_types = []
        for name, price, category in tt_data:
            tt = TreatmentTypeFactory(name=name, default_price=price, category=category)
            treatment_types.append(tt)

        self.stdout.write("Generating Patients and Anamnesis...")
        patients = []
        for _ in range(15):
            patient = PatientFactory()
            AnamnesisFactory(
                patient=patient, 
                allergies=random.choice(["", "Penisilin", "Lokal Anestezi", "Aspirin"]),
                chronic_diseases=random.choice(["", "Diyabet", "Hipertansiyon", "Astım"])
            )
            patients.append(patient)

        # Demo specific patient
        demo_patient = PatientFactory(first_name="Mustafa", last_name="Öztürk", phone="05559998877")
        AnamnesisFactory(patient=demo_patient, allergies="Penisilin", smoking="Günde 1 paket")
        patients.append(demo_patient)

        self.stdout.write("Generating Appointments & Treatments...")
        today = timezone.localdate()
        
        times = [
            (time(9, 0), Appointment.Status.COMPLETED),
            (time(10, 0), Appointment.Status.COMPLETED),
            (time(11, 0), Appointment.Status.COMPLETED),
            (time(13, 0), Appointment.Status.SCHEDULED),
            (time(14, 0), Appointment.Status.SCHEDULED),
            (time(15, 30), Appointment.Status.SCHEDULED),
            (time(16, 30), Appointment.Status.SCHEDULED),
        ]

        for t, status in times:
            p = random.choice(patients)
            tt = random.choice(treatment_types)
            AppointmentFactory(
                patient=p,
                doctor=doctor,
                date=today,
                time=t,
                status=status,
                treatment_type=tt
            )
            
            # Treatments are generated for both scheduled and completed appointments
            treatment_status = Treatment.Status.COMPLETED if status == Appointment.Status.COMPLETED else Treatment.Status.PLANNED
            treatment = TreatmentFactory(
                patient=p,
                doctor=doctor,
                treatment_type=tt,
                treatment_name=tt.name,
                tooth_number=str(random.randint(11, 48)),
                status=treatment_status,
                price=tt.default_price,
                date=today
            )
            
            # Payments are only for completed treatments
            if treatment_status == Treatment.Status.COMPLETED and random.random() > 0.3:
                PaymentFactory(
                    patient=p,
                    treatment=treatment,
                    amount=tt.default_price,
                    description=f"{tt.name} Ödemesi",
                    payment_date=today
                )

        # Generate some past history
        for _ in range(20):
            past_date = today - timedelta(days=random.randint(1, 30))
            p = random.choice(patients)
            tt = random.choice(treatment_types)
            
            AppointmentFactory(
                patient=p,
                doctor=doctor,
                date=past_date,
                time=time(random.randint(9, 17), random.choice([0, 30])),
                status=Appointment.Status.COMPLETED,
                treatment_type=tt
            )
            treatment = TreatmentFactory(
                patient=p,
                doctor=doctor,
                treatment_type=tt,
                treatment_name=tt.name,
                tooth_number=str(random.randint(11, 48)),
                status=Treatment.Status.COMPLETED,
                price=tt.default_price,
                date=past_date
            )
            
            rand = random.random()
            if rand > 0.3:
                PaymentFactory(
                    patient=p,
                    treatment=treatment,
                    amount=tt.default_price,
                    description=f"{tt.name} Ödemesi",
                    payment_date=past_date
                )
            elif rand > 0.1:
                partial = float(tt.default_price) * random.choice([0.5, 0.25])
                PaymentFactory(
                    patient=p,
                    treatment=treatment,
                    amount=partial,
                    description=f"{tt.name} - 1. Taksit",
                    payment_date=past_date
                )

        self.stdout.write(self.style.SUCCESS(f"Seeded Demo Data for {tenant.name}"))
