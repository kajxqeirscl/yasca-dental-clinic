from rest_framework import serializers
from django.utils import timezone
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
    AuditLog,
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

    anamnesis = AnamnesisSerializer(required=False, allow_null=True)
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
    treatment_name = serializers.SerializerMethodField()
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
            "treatment",
            "treatment_name",
            "created_at",
        ]

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() or obj.doctor.username

    def get_treatment_name(self, obj):
        if not obj.treatment:
            return None
        return obj.treatment.treatment_type.name if obj.treatment.treatment_type else obj.treatment.treatment_name

    def validate(self, data):
        """F-008: Aynı hekime aynı saatte randevu çakışması kontrolü."""
        doctor = data.get("doctor", getattr(self.instance, "doctor", None))
        date = data.get("date", getattr(self.instance, "date", None))
        time = data.get("time", getattr(self.instance, "time", None))
        
        # Geçmiş tarih ve saat kontrolü backend'de katı olarak engellenmeyecek,
        # Frontend tarafında kullanıcıya uyarı (confirmation) olarak sunulacak.
        
        treatment = data.get("treatment", getattr(self.instance, "treatment", None))
        if treatment and treatment.status == "completed":
            if not self.instance or getattr(self.instance, "treatment", None) != treatment:
                raise serializers.ValidationError({"treatment": "Tamamlanmış bir tedaviye yeni randevu eklenemez."})

        if doctor and date and time:
            existing = Appointment.objects.filter(
                doctor=doctor,
                date=date,
                time=time,
                status=Appointment.Status.SCHEDULED,
                is_active=True
            )
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
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
            "treatment",
        ]

    def validate(self, data):
        doctor = data.get("doctor", getattr(self.instance, "doctor", None))
        date = data.get("date", getattr(self.instance, "date", None))
        time = data.get("time", getattr(self.instance, "time", None))
        
        # Geçmiş tarih ve saat kontrolü backend'de katı olarak engellenmeyecek,
        # Frontend tarafında kullanıcıya uyarı (confirmation) olarak sunulacak.

        treatment = data.get("treatment", getattr(self.instance, "treatment", None))
        if treatment and treatment.status == "completed":
            if not self.instance or getattr(self.instance, "treatment", None) != treatment:
                raise serializers.ValidationError({"treatment": "Tamamlanmış bir tedaviye yeni randevu eklenemez."})

        if doctor and date and time:
            existing = Appointment.objects.filter(
                doctor=doctor,
                date=date,
                time=time,
                status=Appointment.Status.SCHEDULED,
                is_active=True
            )
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            
            if existing.exists():
                raise serializers.ValidationError(
                    "Bu hekime bu saatte zaten randevu kayıtlı."
                )
        return data


class TreatmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentType
        fields = ["id", "name", "category", "default_price", "is_active"]

    def validate(self, data):
        name = data.get("name", getattr(self.instance, "name", None))
        request = self.context.get("request")
        user = request.user if request else None

        if name and user:
            # Aynı isimde başka aktif tedavi türü var mı kontrol et
            qs = TreatmentType.objects.filter(name__iexact=name, is_active=True)
            if user.role == CustomUser.Role.DOCTOR:
                qs = qs.filter(doctor=user)
            else:
                qs = qs.filter(doctor__isnull=True)
                
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
                
            if qs.exists():
                raise serializers.ValidationError({"name": "Bu isimde bir tedavi türü zaten mevcut."})
        return data


class TreatmentSerializer(serializers.ModelSerializer):
    treatment_type_name = serializers.CharField(
        source="treatment_type.name", read_only=True
    )
    treatment_type_category = serializers.CharField(
        source="treatment_type.category", read_only=True
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
            "treatment_type_category",
            "treatment_name",
            "tooth_number",
            "status",
            "notes",
            "date",
            "price",
            "created_at",
        ]

    def validate(self, data):
        patient = data.get("patient", getattr(self.instance, "patient", None))
        date = data.get("date", getattr(self.instance, "date", None))
        tooth_number = data.get("tooth_number", getattr(self.instance, "tooth_number", None))
        treatment_type = data.get("treatment_type", getattr(self.instance, "treatment_type", None))
        
        # Aynı hastaya, aynı gün, aynı dişe, aynı tedavi türü eklenmesini engelle
        if patient and date and treatment_type and tooth_number:
            qs = Treatment.objects.filter(
                patient=patient,
                date=date,
                tooth_number=tooth_number,
                treatment_type=treatment_type,
                is_active=True
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            
            if qs.exists():
                raise serializers.ValidationError(
                    "Bu hastaya aynı gün aynı dişe bu tedavi zaten eklenmiş."
                )
                
        return data

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name() or obj.doctor.username


class ClinicSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicSettings
        fields = ["id", "work_start_time", "work_end_time", "work_days", "allow_international_numbers", "default_country"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "patient", "treatment", "amount", "description", "payment_date", "created_at"]

    def validate(self, data):
        """Tedaviye bağlı ödemelerde toplam ödemenin tedavi fiyatını aşmasını engelle."""
        treatment = data.get("treatment", getattr(self.instance, "treatment", None))
        amount = data.get("amount", getattr(self.instance, "amount", 0))

        if treatment and amount:
            from decimal import Decimal
            treatment_price = treatment.price or Decimal("0")
            # Bu tedaviye yapılmış mevcut ödemelerin toplamını hesapla
            existing_payments = Payment.objects.filter(
                treatment=treatment,
                is_active=True
            )
            # Düzenleme modundaysa kendi ödemesini hariç tut
            if self.instance:
                existing_payments = existing_payments.exclude(pk=self.instance.pk)

            total_paid = sum(p.amount for p in existing_payments)
            remaining = treatment_price - total_paid

            if amount > remaining:
                raise serializers.ValidationError({
                    "amount": f"Ödeme tutarı kalan borcu ({remaining:.2f} ₺) aşamaz."
                })

        return data

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


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password', 'is_active']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.get_full_name', read_only=True, default='Sistem')
    user_email = serializers.CharField(source='user.email', read_only=True, default='')
    model_name = serializers.CharField(source='content_type.model', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'username', 'user_email', 'action', 'model_name', 'object_id', 'changes', 'ip_address', 'created_at']

