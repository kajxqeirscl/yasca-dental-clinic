from django.db import models
from django.contrib.auth.models import AbstractUser


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
