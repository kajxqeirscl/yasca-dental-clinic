"""
Admin.py smoke tests — Django admin'in framework iç dinamiklerini değil,
sadece her ``ModelAdmin``'in beklenen ``list_display``/``search_fields``
gibi yapılandırmaya sahip olduğunu doğrular. Bu sayede admin tarafında
yanlışlıkla alan silinmesi/yeniden adlandırılması yakalanır.
"""
import pytest
from django.contrib import admin
from django.contrib.contenttypes.models import ContentType

from api.models import (
    Appointment,
    ClinicSettings,
    CustomUser,
    Patient,
    Payment,
    Treatment,
    TreatmentType,
)


# Beklenen yapılandırma; admin.py ile birebir senkronize tutulmalı.
_EXPECTED = {
    CustomUser: {
        "list_display": ("username", "email", "first_name", "last_name", "role", "is_staff"),
        "list_filter": ("role", "is_staff", "is_active"),
    },
    Patient: {
        "list_display": ("full_name", "phone", "tckn"),
        "search_fields": ("first_name", "last_name", "phone"),
    },
    Appointment: {
        "list_display": ("patient", "doctor", "date", "time", "status"),
        "list_filter": ("status", "date"),
    },
    Treatment: {
        "list_display": ("patient", "treatment_type", "teeth", "status", "date"),
    },
    TreatmentType: {
        "list_display": ("name", "default_price", "is_active"),
    },
    ClinicSettings: {
        "list_display": ("work_start_time", "work_end_time"),
    },
    Payment: {
        "list_display": ("patient", "amount", "payment_date", "description"),
    },
}


class TestAdminRegistrations:
    @pytest.mark.parametrize("model", list(_EXPECTED.keys()))
    def test_model_registered(self, model):
        """Her model admin sitesine kayıtlı olmalı."""
        assert admin.site.is_registered(model), f"{model.__name__} admin'e kayıtlı değil"

    @pytest.mark.parametrize("model,config", list(_EXPECTED.items()))
    def test_list_display_matches_expected(self, model, config):
        model_admin = admin.site._registry[model]
        assert tuple(model_admin.list_display) == config["list_display"]

    def test_customuser_uses_useradmin_subclass(self):
        from django.contrib.auth.admin import UserAdmin
        from api.admin import CustomUserAdmin

        assert issubclass(CustomUserAdmin, UserAdmin)

    def test_patient_admin_has_anamnesis_inline(self):
        from api.admin import AnamnesisInline, PatientAdmin

        assert AnamnesisInline in PatientAdmin.inlines

    def test_clinic_settings_uses_custom_form(self):
        from api.admin import ClinicSettingsAdmin, ClinicSettingsForm

        assert ClinicSettingsAdmin.form is ClinicSettingsForm

    def test_clinic_settings_form_has_workdays_choices(self):
        from api.admin import ClinicSettingsForm

        form = ClinicSettingsForm()
        assert "work_days" in form.fields
        # 7 gün (Pazartesi-Pazar) tanımlı olmalı.
        assert len(ClinicSettingsForm.DAYS_CHOICES) == 7


@pytest.mark.django_db
class TestAuditLogContentType:
    """AuditLog admin için ContentType bağımlılığı sağlam mı."""

    def test_contenttype_resolves_for_registered_models(self):
        for model in _EXPECTED.keys():
            ct = ContentType.objects.get_for_model(model)
            assert ct is not None
            assert ct.app_label == "api"
