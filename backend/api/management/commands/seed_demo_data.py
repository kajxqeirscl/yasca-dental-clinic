import random
from datetime import timedelta, time

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from api.models import (
    Clinic, CustomUser, Patient, Appointment, TreatmentType, Treatment, Payment, ClinicSettings
)
from api.tests.factories import (
    ClinicFactory, AdminUserFactory, DoctorUserFactory, AssistantUserFactory,
    PatientFactory, AnamnesisFactory, TreatmentTypeFactory, AppointmentFactory,
    TreatmentFactory, PaymentFactory
)

class Command(BaseCommand):
    help = 'Seeds the database with realistic demo data for presentation'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Clearing existing data..."))
        # We don't necessarily need to clear here if they used flush, but let's be safe
        # CustomUser.objects.all().delete() # Flush handles this better.

        self.stdout.write("Generating Clinic...")
        clinic = ClinicFactory(name="Yaşca Dental Premium Klinik")
        
        # Ensure ClinicSettings exist for this clinic
        settings = ClinicSettings.get_settings(clinic)
        settings.work_start_time = time(9, 0)
        settings.work_end_time = time(18, 0)
        settings.work_days = [1, 2, 3, 4, 5, 6] # Mon-Sat
        settings.save()

        self.stdout.write("Generating Users...")
        # Create Demo Admin
        admin = AdminUserFactory(
            username="admin", 
            first_name="Sistem", 
            last_name="Yöneticisi", 
            clinic=clinic,
            is_staff=True,
            is_superuser=True
        )
        admin.set_password("demo123!")
        admin.save()

        # Create Demo Doctor
        doctor = DoctorUserFactory(
            username="dr_ahmet", 
            first_name="Ahmet", 
            last_name="Yılmaz", 
            clinic=clinic
        )
        doctor.set_password("demo123!")
        doctor.save()

        # Create Demo Assistant
        assistant = AssistantUserFactory(
            username="asistan_ayse", 
            first_name="Ayşe", 
            last_name="Kaya", 
            clinic=clinic
        )
        assistant.set_password("demo123!")
        assistant.save()

        self.stdout.write("Generating Treatment Types...")
        tt_names = [
            ("Kanal Tedavisi", 2500.00),
            ("Diş Çekimi", 800.00),
            ("Gömülü Diş Çekimi", 1500.00),
            ("İmplant", 12000.00),
            ("Zirkonyum Kaplama", 4500.00),
            ("Kompozit Dolgu", 1000.00),
            ("Diş Taşı Temizliği", 800.00),
        ]
        treatment_types = []
        for name, price in tt_names:
            tt = TreatmentTypeFactory(clinic=clinic, name=name, default_price=price)
            treatment_types.append(tt)

        self.stdout.write("Generating Patients and Anamnesis...")
        patients = []
        for _ in range(15):
            patient = PatientFactory(clinic=clinic)
            AnamnesisFactory(
                patient=patient, 
                allergies=random.choice(["", "Penisilin", "Lokal Anestezi", "Aspirin"]),
                chronic_diseases=random.choice(["", "Diyabet", "Hipertansiyon", "Astım"])
            )
            patients.append(patient)

        # Make sure our specific demo patient exists
        demo_patient = PatientFactory(clinic=clinic, first_name="Mustafa", last_name="Öztürk", phone="05559998877")
        AnamnesisFactory(patient=demo_patient, allergies="Penisilin", smoking="Günde 1 paket")
        patients.append(demo_patient)

        self.stdout.write("Generating Appointments...")
        today = timezone.localdate()
        
        # Today's appointments for dr_ahmet
        times = [
            (time(9, 0), Appointment.Status.COMPLETED),
            (time(10, 0), Appointment.Status.COMPLETED),
            (time(11, 0), Appointment.Status.COMPLETED),
            (time(13, 0), Appointment.Status.SCHEDULED),
            (time(14, 0), Appointment.Status.SCHEDULED),
            (time(15, 30), Appointment.Status.SCHEDULED),
            (time(16, 30), Appointment.Status.SCHEDULED),
        ]

        for idx, (t, status) in enumerate(times):
            p = random.choice(patients)
            AppointmentFactory(
                clinic=clinic,
                patient=p,
                doctor=doctor,
                date=today,
                time=t,
                status=status,
                treatment_type=random.choice(treatment_types).name
            )
            
            # If completed, add a treatment and maybe a payment
            if status == Appointment.Status.COMPLETED:
                tt = random.choice(treatment_types)
                TreatmentFactory(
                    clinic=clinic,
                    patient=p,
                    doctor=doctor,
                    treatment_type=tt,
                    treatment_name=tt.name,
                    tooth_number=str(random.randint(11, 48)),
                    status=Treatment.Status.COMPLETED,
                    date=today
                )
                if random.random() > 0.3: # 70% chance they paid
                    PaymentFactory(
                        clinic=clinic,
                        patient=p,
                        amount=tt.default_price,
                        description=f"{tt.name} Ödemesi",
                        payment_date=today
                    )

        # Generate some past appointments and history
        for _ in range(20):
            past_date = today - timedelta(days=random.randint(1, 30))
            p = random.choice(patients)
            tt = random.choice(treatment_types)
            
            AppointmentFactory(
                clinic=clinic,
                patient=p,
                doctor=doctor,
                date=past_date,
                time=time(random.randint(9, 17), random.choice([0, 30])),
                status=Appointment.Status.COMPLETED,
                treatment_type=tt.name
            )
            TreatmentFactory(
                clinic=clinic,
                patient=p,
                doctor=doctor,
                treatment_type=tt,
                treatment_name=tt.name,
                tooth_number=str(random.randint(11, 48)),
                status=Treatment.Status.COMPLETED,
                date=past_date
            )
            PaymentFactory(
                clinic=clinic,
                patient=p,
                amount=tt.default_price,
                description=f"{tt.name} Ödemesi",
                payment_date=past_date
            )


        self.stdout.write(self.style.SUCCESS("Successfully seeded demo data!"))
        self.stdout.write(self.style.SUCCESS("-" * 40))
        self.stdout.write(self.style.SUCCESS("DEMO ACCOUNTS (Password: demo123!)"))
        self.stdout.write(self.style.SUCCESS(f" Admin    : {admin.username}"))
        self.stdout.write(self.style.SUCCESS(f" Doctor   : {doctor.username}"))
        self.stdout.write(self.style.SUCCESS(f" Assistant: {assistant.username}"))
        self.stdout.write(self.style.SUCCESS("-" * 40))
