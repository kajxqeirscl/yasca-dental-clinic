from rest_framework import serializers
from .models import (
    Patient,
    Anamnesis,
    Appointment,
    Treatment,
    TreatmentType,
    ClinicSettings,
    Payment,
    CustomUser,
    Document,
)


class PatientListSerializer(serializers.ModelSerializer):
    """Hasta listesi için kısa serializer."""

    full_name = serializers.ReadOnlyField()
    last_visit = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = ["id", "first_name", "last_name", "full_name", "phone", "tckn", "last_visit"]

    def get_last_visit(self, obj):
        from .models import Appointment
        last = obj.appointments.filter(status=Appointment.Status.COMPLETED).order_by("-date").first()
        return last.date.isoformat() if last else None


class AnamnesisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anamnesis
        fields = [
            "medical_history",
            "allergies",
            "medications",
            "chronic_diseases",
            "surgical_history",
            "family_history",
            "smoking",
            "alcohol",
            "pregnancy_status",
            "other_notes",
        ]


class PatientSerializer(serializers.ModelSerializer):
    """Hasta detay ve oluşturma."""

    anamnesis = AnamnesisSerializer(required=False)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "tckn",
            "birth_date",
            "address",
            "notes",
            "anamnesis",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        anamnesis_data = validated_data.pop("anamnesis", None)
        patient = Patient.objects.create(**validated_data)
        if anamnesis_data:
            Anamnesis.objects.create(patient=patient, **anamnesis_data)
        return patient

    def update(self, instance, validated_data):
        anamnesis_data = validated_data.pop("anamnesis", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if anamnesis_data is not None:
            anam, _ = Anamnesis.objects.get_or_create(patient=instance)
            for attr, value in anamnesis_data.items():
                setattr(anam, attr, value)
            anam.save()
        return instance


class DoctorMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ["id", "username", "full_name"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_phone = serializers.CharField(source="patient.phone", read_only=True)
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient",
            "patient_name",
            "patient_phone",
            "doctor",
            "doctor_name",
            "date",
            "time",
            "status",
            "notes",
            "treatment_type",
            "created_at",
        ]

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() or obj.doctor.username

    def validate(self, data):
        """F-008: Aynı hekime aynı saatte randevu çakışması kontrolü."""
        if self.instance:
            return data
        doctor = data.get("doctor")
        date = data.get("date")
        time = data.get("time")
        if doctor and date and time:
            existing = Appointment.objects.filter(
                doctor=doctor,
                date=date,
                time=time,
                status=Appointment.Status.SCHEDULED,
            ).exists()
            if existing:
                raise serializers.ValidationError(
                    "Bu hekime bu saatte zaten randevu kayıtlı."
                )
        return data


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Randevu oluşturma için."""

    class Meta:
        model = Appointment
        fields = [
            "patient",
            "doctor",
            "date",
            "time",
            "status",
            "notes",
            "treatment_type",
        ]

    def validate(self, data):
        doctor = data.get("doctor")
        date = data.get("date")
        time = data.get("time")
        if doctor and date and time:
            existing = Appointment.objects.filter(
                doctor=doctor,
                date=date,
                time=time,
                status=Appointment.Status.SCHEDULED,
            ).exists()
            if existing:
                raise serializers.ValidationError(
                    "Bu hekime bu saatte zaten randevu kayıtlı."
                )
        return data


class TreatmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentType
        fields = ["id", "name", "default_price", "is_active"]


class TreatmentSerializer(serializers.ModelSerializer):
    treatment_type_name = serializers.CharField(
        source="treatment_type.name", read_only=True
    )
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Treatment
        fields = [
            "id",
            "patient",
            "doctor",
            "doctor_name",
            "treatment_type",
            "treatment_type_name",
            "treatment_name",
            "tooth_number",
            "status",
            "notes",
            "date",
            "created_at",
        ]

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() or obj.doctor.username


class ClinicSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicSettings
        fields = ["id", "work_start_time", "work_end_time", "work_days"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "patient", "amount", "description", "payment_date", "created_at"]

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True)
    file_url = serializers.FileField(source="file", read_only=True)
    file_size = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ["id", "patient", "name", "file", "file_url", "file_size", "uploaded_by", "uploaded_by_name", "created_at"]
        read_only_fields = ["uploaded_by"]

    def get_file_size(self, obj):
        try:
            return obj.file.size
        except Exception:
            return 0
