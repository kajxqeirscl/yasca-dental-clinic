from django.db import models
from django_tenants.models import TenantMixin, DomainMixin

class Client(TenantMixin):
    """
    Her bir kliniği temsil eden PostgreSQL Tenant (Kiracı) modeli.
    Her Client oluşturulduğunda ona özel izole bir şema açılır.
    """
    name = models.CharField("Klinik Adı", max_length=100)
    created_on = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    # auto_create_schema, model kaydedildiğinde otomatik PostgreSQL şemasını yaratır
    auto_create_schema = True

    def __str__(self):
        return self.name

class Domain(DomainMixin):
    """
    Her kliniğin bağlandığı alt alan adı (Örn: acibadem.yasca.com)
    """
    pass
