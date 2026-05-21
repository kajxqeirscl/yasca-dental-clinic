from django.urls import path
from .views import RegisterClinicView, CheckDomainView

urlpatterns = [
    path('register/', RegisterClinicView.as_view(), name='register_clinic'),
    path('check-domain/', CheckDomainView.as_view(), name='check_domain'),
]
