from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from django_tenants.utils import schema_context
from django.conf import settings
from .models import Client, Domain
from api.models import CustomUser

class RegisterClinicView(APIView):
    """
    SaaS Ana sayfasindan (Public) yeni klinik kaydi almak icin kullanilir.
    """
    permission_classes = [] # Herkese acik (Public)

    def post(self, request):
        data = request.data
        subdomain = data.get('subdomain', '').lower().strip()
        clinic_name = data.get('clinic_name')
        email = data.get('admin_email')
        password = data.get('admin_password')
        first_name = data.get('admin_first_name', '')
        last_name = data.get('admin_last_name', '')
        
        if not all([subdomain, clinic_name, email, password]):
            return Response({"error": "Lütfen gerekli tüm alanları doldurun."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Alan adi musait mi kontrolu
        if Client.objects.filter(schema_name=subdomain).exists():
            return Response({"error": "Bu klinik adresi (subdomain) zaten kullanılıyor. Lütfen başka bir isim deneyin."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # 1. Yeni Kiraci (Tenant) Veritabanini Olustur
            tenant = Client(schema_name=subdomain, name=clinic_name, is_active=True)
            tenant.save()
            
            # 2. Localhost domain (gelistirme icin)
            Domain.objects.get_or_create(
                domain=f"{subdomain}.localhost",
                defaults={'tenant': tenant, 'is_primary': True}
            )
            
            # 3. Production domain (Railway / custom domain)
            if settings.PRODUCTION_DOMAIN != 'localhost':
                Domain.objects.get_or_create(
                    domain=f"{subdomain}.{settings.PRODUCTION_DOMAIN}",
                    defaults={'tenant': tenant, 'is_primary': False}
                )
            
            # 4. Sadece bu klinigin veritabanina gir ve Admin hesabini olustur
            with schema_context(tenant.schema_name):
                CustomUser.objects.create_superuser(
                    username=email,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    role='admin'
                )
            
            # Canlı ortamda path tabanlı login URL döndür
            login_url = f"/app/{subdomain}"
                
            return Response({
                "message": "Klinik başarıyla oluşturuldu! Lütfen yeni adresinize gidin.",
                "domain": subdomain,
                "login_url": login_url
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            from django.db import IntegrityError
            if isinstance(e, IntegrityError) and 'customers_client_schema_name_key' in str(e):
                return Response({"error": "Bu klinik adresi (subdomain) zaten kullanılıyor. Lütfen başka bir isim deneyin."}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CheckDomainView(APIView):
    """
    Girilen domainin sistemde var olup olmadığını kontrol eder.
    """
    permission_classes = []
    renderer_classes = [JSONRenderer]

    def get(self, request):
        subdomain = request.query_params.get('subdomain', '').lower().strip()
        if not subdomain:
            return Response({"error": "Subdomain gerekli."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Schema adına göre kontrol (en güvenilir yöntem)
        exists = Client.objects.filter(schema_name=subdomain).exists()
            
        if exists:
            return Response({"message": "Domain geçerli", "exists": True}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Böyle bir klinik bulunamadı. Lütfen adresi kontrol edin.", "exists": False}, status=status.HTTP_404_NOT_FOUND)

