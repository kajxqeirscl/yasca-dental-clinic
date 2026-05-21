from django.urls import path, include

urlpatterns = [
    # Ana sistemde (Public) sadece SaaS ile ilgili (Kayıt vb.) endpointler calisir
    path('api/public/', include('customers.urls')),
]
