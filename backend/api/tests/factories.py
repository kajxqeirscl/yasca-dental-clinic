"""
factory_boy model factories for Yaşca tests.
Import these in any test module that needs ORM objects.
"""
import factory
from factory.django import DjangoModelFactory
from django.utils import timezone

from api.models import (
    CustomUser,
    Patient,
    Anamnesis,
    Appointment,
    Treatment,
    TreatmentType,
    ClinicSettings,
    Payment,
)


class CustomUserFactory(DjangoModelFactory):
    class Meta:
        model = CustomUser
        skip_postgeneration_save = True

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@test.com")
    first_name = factory.Faker("first_name", locale="tr_TR")
    last_name = factory.Faker("last_name", locale="tr_TR")
    role = CustomUser.Role.ASSISTANT

    @factory.post_generation
    def password(obj, create, extracted, **kwargs):  # noqa: N805
        raw = extracted or "testpass123!"
        obj.set_password(raw)
        if create:
            obj.save(update_fields=["password"])


class AdminUserFactory(CustomUserFactory):
    class Meta:
        model = CustomUser
        skip_postgeneration_save = True
    role = CustomUser.Role.ADMIN


class DoctorUserFactory(CustomUserFactory):
    class Meta:
        model = CustomUser
        skip_postgeneration_save = True
    role = CustomUser.Role.DOCTOR


class AssistantUserFactory(CustomUserFactory):
    class Meta:
        model = CustomUser
        skip_postgeneration_save = True
    role = CustomUser.Role.ASSISTANT




class PatientFactory(DjangoModelFactory):
    class Meta:
        model = Patient

    first_name = factory.Faker("first_name", locale="tr_TR")
    last_name = factory.Faker("last_name", locale="tr_TR")
    phone = factory.Sequence(lambda n: f"0555{n:07d}")
    tckn = ""
    birth_date = None


class AnamnesisFactory(DjangoModelFactory):
    class Meta:
        model = Anamnesis

    patient = factory.SubFactory(PatientFactory)
    medical_history = factory.Faker("sentence", locale="tr_TR")
    allergies = ""


class TreatmentTypeFactory(DjangoModelFactory):
    class Meta:
        model = TreatmentType

    name = factory.Sequence(lambda n: f"Tedavi Türü {n}")
    default_price = factory.Faker(
        "pydecimal", left_digits=4, right_digits=2, positive=True
    )
    category = TreatmentType.Category.OTHER
    is_active = True


class AppointmentFactory(DjangoModelFactory):
    class Meta:
        model = Appointment

    patient = factory.SubFactory(PatientFactory)
    doctor = factory.SubFactory(DoctorUserFactory)
    date = factory.LazyFunction(lambda: timezone.localdate())
    time = "10:00:00"
    status = Appointment.Status.SCHEDULED
    notes = ""
    treatment = None


class TreatmentFactory(DjangoModelFactory):
    class Meta:
        model = Treatment

    patient = factory.SubFactory(PatientFactory)
    doctor = factory.SubFactory(DoctorUserFactory)
    treatment_type = None
    treatment_name = factory.Sequence(lambda n: f"İşlem {n}")
    tooth_number = ""
    status = Treatment.Status.COMPLETED
    date = factory.LazyFunction(lambda: timezone.localdate())


class PaymentFactory(DjangoModelFactory):
    class Meta:
        model = Payment

    patient = factory.SubFactory(PatientFactory)
    amount = factory.Faker(
        "pydecimal", left_digits=4, right_digits=2, positive=True
    )
    description = factory.Faker("sentence", locale="tr_TR")
    payment_date = factory.LazyFunction(lambda: timezone.localdate())
