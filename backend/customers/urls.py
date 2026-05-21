from django.urls import path
from .views import RegisterClinicView

urlpatterns = [
    path('register/', RegisterClinicView.as_view(), name='register_clinic'),
]
