from api.models import AuditLog
from django.contrib.contenttypes.models import ContentType

class AuditLogMixin:
    """
    ModelViewSet sınıflarına eklenerek CREATE, UPDATE ve DELETE işlemlerini
    otomatik olarak AuditLog tablosuna kaydeder.
    """

    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return self.request.META.get('REMOTE_ADDR')

    def sanitize_changes(self, changes):
        if not changes:
            return changes
        # Şifre ve diğer son derece gizli alanları log veritabanında maskeliyoruz
        sensitive_keys = ['password', 'is_superuser', 'is_staff', 'groups', 'user_permissions', 'last_login']
        sanitized = {}
        for k, v in changes.items():
            if k in sensitive_keys:
                sanitized[k] = {"old": "[GİZLENDİ]", "new": "[GİZLENDİ]"}
            else:
                sanitized[k] = v
        return sanitized

    def log_action(self, action, instance, changes=None):
        if hasattr(self.request, 'user') and self.request.user.is_authenticated:
            user = self.request.user
        else:
            user = None
            
        changes = self.sanitize_changes(changes)
        
        AuditLog.objects.create(
            user=user,
            action=action,
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.pk,
            changes=changes,
            ip_address=self.get_client_ip()
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        
        # Sadece izin verilen (serialize edilen) alanları logluyoruz
        changes = {k: {"old": None, "new": str(v)} for k, v in serializer.validated_data.items()}
        self.log_action(AuditLog.Action.CREATE, instance, changes=changes)

    def perform_update(self, serializer):
        # Güncellenecek kaydın eski halini alalım
        instance = self.get_object()
        
        old_data = {}
        for key in serializer.validated_data.keys():
            if hasattr(instance, key):
                val = getattr(instance, key)
                old_data[key] = val
        
        # Güncelleme işlemini yap
        updated_instance = serializer.save()
        
        # Neler değişti?
        changes = {}
        for key, new_val in serializer.validated_data.items():
            old_val = old_data.get(key)
            if old_val != new_val:
                changes[key] = {"old": str(old_val), "new": str(new_val)}
                
        # Eğer bir değişiklik varsa logla
        if changes:
            self.log_action(AuditLog.Action.UPDATE, updated_instance, changes=changes)

    def perform_destroy(self, instance):
        if hasattr(instance, "is_active"):
            instance.is_active = False
            instance.save(update_fields=['is_active'])
            self.log_action(AuditLog.Action.DELETE, instance, changes={"is_active": {"old": "True", "new": "False"}})
        elif hasattr(instance, "status") and hasattr(instance.__class__, "Status") and hasattr(instance.__class__.Status, "CANCELLED"):
            old_status = instance.status
            instance.status = instance.__class__.Status.CANCELLED
            instance.save(update_fields=['status'])
            self.log_action(AuditLog.Action.DELETE, instance, changes={"status": {"old": str(old_status), "new": "CANCELLED"}})
        else:
            self.log_action(AuditLog.Action.DELETE, instance)
            instance.delete()
