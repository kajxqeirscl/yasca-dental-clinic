from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import time


class Clinic(models.Model):
    """Klinik tanımı süper ana tablo. Multi-Tenancy."""

    name = models.CharField("Klinik Adı", max_length=150)
    address = models.TextField("Adres", blank=True)
    phone = models.CharField("Telefon", max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Klinik"
        verbose_name_plural = "Klinikler"

    def __str__(self):
        return self.name


class CustomUser(AbstractUser):
    """Klinik personeli: Admin, Hekim veya Asistan."""

    class Role(models.TextChoices):
        ADMIN = "admin", "Yönetici"
        DOCTOR = "doctor", "Hekim"
        ASSISTANT = "assistant", "Asistan"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ASSISTANT,
    )
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        verbose_name="Klinik",
    )

    class Meta:
        verbose_name = "Kullanıcı"
        verbose_name_plural = "Kullanıcılar"

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    def get_role_display(self):
        return dict(self.Role.choices).get(self.role, self.role)

    @property
    def is_hekim(self):
        return self.role == self.Role.DOCTOR

    @property
    def is_asistan(self):
        return self.role == self.Role.ASSISTANT

    @property
    def is_yonetici(self):
        return self.role == self.Role.ADMIN or self.is_superuser


class Patient(models.Model):
    """Hasta kaydı. F-003: Ad, Soyad, Telefon zorunlu; TC ve Doğum Tarihi opsiyonel."""
    
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="patients",
    )

    first_name = models.CharField("Ad", max_length=100)
    last_name = models.CharField("Soyad", max_length=100)
    phone = models.CharField("Telefon", max_length=20)
    tckn = models.CharField("TC Kimlik No", max_length=11, blank=True)
    birth_date = models.DateField("Doğum Tarihi", null=True, blank=True)
    address = models.TextField("Adres", blank=True)
    notes = models.TextField("Notlar", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hasta"
        verbose_name_plural = "Hastalar"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Anamnesis(models.Model):
    """Hasta anamnezi. Patient ile 1-1 ilişki."""

    patient = models.OneToOneField(
        Patient, on_delete=models.CASCADE, related_name="anamnesis"
    )
    medical_history = models.TextField("Tıbbi Geçmiş", blank=True)
    allergies = models.TextField("Alerjiler", blank=True)
    medications = models.TextField("Kullandığı İlaçlar", blank=True)
    chronic_diseases = models.TextField("Kronik Hastalıklar", blank=True)
    surgical_history = models.TextField("Geçirdiği Ameliyatlar", blank=True)
    family_history = models.TextField("Aile Öyküsü", blank=True)
    smoking = models.CharField("Sigara", max_length=100, blank=True)
    alcohol = models.CharField("Alkol", max_length=100, blank=True)
    pregnancy_status = models.CharField("Gebelik Durumu", max_length=100, blank=True)
    other_notes = models.TextField("Diğer Notlar", blank=True)

    class Meta:
        verbose_name = "Anamnez"
        verbose_name_plural = "Anamnezler"

    def __str__(self):
        return f"Anamnez: {self.patient}"


class TreatmentType(models.Model):
    """Tedavi türleri ve varsayılan fiyatları. F-020."""
    
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="treatment_types",
    )

    name = models.CharField("Tedavi Türü", max_length=100)
    default_price = models.DecimalField(
        "Varsayılan Fiyat", max_digits=10, decimal_places=2, default=0
    )
    is_active = models.BooleanField("Aktif", default=True)

    class Meta:
        verbose_name = "Tedavi Türü"
        verbose_name_plural = "Tedavi Türleri"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Appointment(models.Model):
    """Randevu kaydı. F-006, F-007, F-008, F-009, F-019."""

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Planlandı"
        COMPLETED = "completed", "Tamamlandı"
        CANCELLED = "cancelled", "İptal"
        NO_SHOW = "no_show", "Gelmedi"
        
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="appointments",
    )

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="appointments"
    )
    doctor = models.ForeignKey(
        CustomUser, on_delete=models.PROTECT, related_name="appointments"
    )
    date = models.DateField("Tarih")
    time = models.TimeField("Saat")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SCHEDULED
    )
    notes = models.TextField("Notlar", blank=True)
    treatment_type = models.CharField("İşlem", max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Randevu"
        verbose_name_plural = "Randevular"
        ordering = ["date", "time"]

    def __str__(self):
        return f"{self.patient} - {self.date} {self.time}"


class Treatment(models.Model):
    """Tedavi kaydı. F-010, F-011, F-018."""

    class Status(models.TextChoices):
        PLANNED = "planned", "Yapılacak"
        COMPLETED = "completed", "Tamamlanmış"
        
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="sc_treatments",
    )

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="treatments"
    )
    doctor = models.ForeignKey(
        CustomUser, on_delete=models.PROTECT, related_name="treatments"
    )
    treatment_type = models.ForeignKey(
        TreatmentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="treatments",
    )
    treatment_name = models.CharField("İşlem Adı", max_length=200, blank=True)
    tooth_number = models.CharField("Diş No (FDI)", max_length=10, blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.COMPLETED
    )
    notes = models.TextField("Notlar", blank=True)
    date = models.DateField("Tarih")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tedavi"
        verbose_name_plural = "Tedaviler"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        name = self.treatment_type.name if self.treatment_type else self.treatment_name
        return f"{self.patient} - {name} ({self.date})"


class ClinicSettings(models.Model):
    """Klinik ayarları. F-022."""

    clinic = models.OneToOneField(
        Clinic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="settings",
    )
    work_start_time = models.TimeField("Çalışma Başlangıç", default=time(9, 0))
    work_end_time = models.TimeField("Çalışma Bitiş", default=time(18, 0))
    work_days = models.JSONField(
        "Çalışılabilecek Günler", 
        default=list,
        blank=True,
        help_text="Örn: 1,2,3,4,5,6 (1=Pzt, 0=Paz)"
    )

    class Meta:
        verbose_name = "Klinik Ayarı"
        verbose_name_plural = "Klinik Ayarları"

    def __str__(self):
        return "Klinik Ayarları"

    @classmethod
    def get_settings(cls, clinic=None):
        if clinic is None:
            obj, _ = cls.objects.get_or_create(pk=1) # Fallback for now
            return obj
        obj, _ = cls.objects.get_or_create(clinic=clinic)
        return obj


class Payment(models.Model):
    """Ödeme kaydı. F-014, F-015."""
    
    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="payments",
    )

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="payments"
    )
    amount = models.DecimalField("Tutar", max_digits=10, decimal_places=2)
    description = models.CharField("Açıklama", max_length=255, blank=True)
    payment_date = models.DateField("Ödeme Tarihi")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Ödeme"
        verbose_name_plural = "Ödemeler"
        ordering = ["-payment_date"]

    def __str__(self):
        return f"{self.patient} - {self.amount} TL ({self.payment_date})"
