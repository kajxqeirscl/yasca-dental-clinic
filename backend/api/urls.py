from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r"patients", views.PatientViewSet, basename="patient")
router.register(r"appointments", views.AppointmentViewSet, basename="appointment")
router.register(r"treatments", views.TreatmentViewSet, basename="treatment")
router.register(r"treatment-types", views.TreatmentTypeViewSet, basename="treatment-type")
router.register(r"payments", views.PaymentViewSet, basename="payment")

urlpatterns = [
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", views.CurrentUserView.as_view(), name="current_user"),
    path("doctors/", views.DoctorListView.as_view(), name="doctors"),
    path("dashboard/today/", views.DashboardView.as_view(), name="dashboard_today"),
    path("settings/clinic/", views.ClinicSettingsView.as_view(), name="clinic_settings"),
    path("", include(router.urls)),
]
