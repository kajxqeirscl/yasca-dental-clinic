import os
import django
from datetime import datetime, timedelta, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import CustomUser, Patient, Appointment

# Clear existing
Appointment.objects.all().delete()
Patient.objects.all().delete()
CustomUser.objects.all().delete()

# Create doctor
doctor = CustomUser.objects.create(username='testdoctor', role=CustomUser.Role.DOCTOR, is_active=True)
patient = Patient.objects.create(first_name='Test', last_name='Patient', phone='1234567890')

# Create appointments for Monday 2026-06-22 from 09:00 to 20:00 every 15 mins
date = datetime(2026, 6, 22)
for hour in range(9, 21):
    for minute in [0, 15, 30, 45]:
        Appointment.objects.create(
            doctor=doctor,
            patient=patient,
            date=date.date(),
            time=time(hour, minute),
            status=Appointment.Status.SCHEDULED,
        )

print(f"Created {Appointment.objects.count()} appointments.")
