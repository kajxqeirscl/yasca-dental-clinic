from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser,
    Patient,
    Anamnesis,
    Appointment,
    Treatment,
    TreatmentType,
    ClinicSettings,
    Payment,
)


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Rol', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Rol', {'fields': ('role',)}),
    )


class AnamnesisInline(admin.StackedInline):
    model = Anamnesis
    can_delete = True
    verbose_name_plural = "Anamnez"


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'tckn')
    search_fields = ('first_name', 'last_name', 'phone')
    inlines = [AnamnesisInline]


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'date', 'time', 'status')
    list_filter = ('status', 'date')
    search_fields = ('patient__first_name', 'patient__last_name')


@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'treatment_type', 'tooth_number', 'status', 'date')
    list_filter = ('status', 'date')


@admin.register(TreatmentType)
class TreatmentTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'default_price', 'is_active')


@admin.register(ClinicSettings)
class ClinicSettingsAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not ClinicSettings.objects.exists()


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'amount', 'payment_date', 'description')
