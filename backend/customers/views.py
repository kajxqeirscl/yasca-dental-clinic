from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django_tenants.utils import schema_context
from .models import Client, Domain
from api.models import CustomUser

class RegisterClinicView(APIView):
    """
    SaaS Ana sayfasindan (Public) yeni klinik kaydi almak icin kullanilir.
    """
    permission_classes = [] # Herkese acik (Public)

    def post(self, request):
        data = request.data
        subdomain = data.get('subdomain')
        clinic_name = data.get('clinic_name')
        email = data.get('admin_email')
        password = data.get('admin_password')
        first_name = data.get('admin_first_name', '')
        last_name = data.get('admin_last_name', '')
        
        if not all([subdomain, clinic_name, email, password]):
            return Response({"error": "Lütfen gerekli tüm alanları doldurun."}, status=status.HTTP_400_BAD_REQUEST)
            
        domain_url = f"{subdomain.lower()}.localhost"
        
        # Alan adi musait mi kontrolu
        if Client.objects.filter(schema_name=subdomain.lower()).exists() or Domain.objects.filter(domain=domain_url).exists():
            return Response({"error": "Bu klinik adresi (subdomain) zaten kullanılıyor. Lütfen başka bir isim deneyin."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # 1. Yeni Kiraci (Tenant) Veritabanini Olustur
            # tenant.save() komutu 'migrate' komutunu tetikleyip tablolari kopyalar
            tenant = Client(schema_name=subdomain.lower(), name=clinic_name, is_active=True)
            tenant.save()
            
            # 2. Alan Adini (Domain) Kiraciya Bagla
            domain = Domain(domain=domain_url, tenant=tenant, is_primary=True)
            domain.save()
            
            # 3. Sadece bu klinigin veritabanina gir ve Admin hesabini olustur
            with schema_context(tenant.schema_name):
                CustomUser.objects.create_superuser(
                    username=email, # Geleneksel olarak emaili username yapiyoruz
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    role='admin'
                )
                
            return Response({
                "message": "Klinik başarıyla oluşturuldu! Lütfen yeni adresinize gidin.",
                "domain": domain_url,
                "login_url": f"http://{domain_url}:5173"
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CheckDomainView(APIView):
    """
    Girilen domainin sistemde var olup olmadığını kontrol eder.
    """
    permission_classes = []

    def get(self, request):
        subdomain = request.query_params.get('subdomain')
        if not subdomain:
            return Response({"error": "Subdomain gerekli."}, status=status.HTTP_400_BAD_REQUEST)
        
        domain_url = f"{subdomain.lower()}.localhost"
        
        # Domain modelinde bu domain var mı?
        exists = Domain.objects.filter(domain=domain_url).exists()
        
        if not exists:
            # Belki production için .yasca.com kontrolü de eklenebilir, şimdilik .localhost
            domain_url_prod = f"{subdomain.lower()}.yasca.com"
            exists = Domain.objects.filter(domain=domain_url_prod).exists()
            
        if exists:
            return Response({"message": "Domain geçerli", "exists": True}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Böyle bir klinik bulunamadı. Lütfen adresi kontrol edin.", "exists": False}, status=status.HTTP_404_NOT_FOUND)
