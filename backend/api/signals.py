from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from .models import CustomUser, Anamnesis, AuditLog
from .middleware import get_current_user, get_current_request

@receiver(post_save, sender=CustomUser)
def assign_user_to_role_group(sender, instance, created, **kwargs):
    group_name = ""
    if instance.role == CustomUser.Role.DOCTOR:
        group_name = "Hekim"
    elif instance.role == CustomUser.Role.ASSISTANT:
        group_name = "Asistan"
    elif instance.role == CustomUser.Role.ADMIN:
        group_name = "Yönetici"
        
    if group_name:
        group, _ = Group.objects.get_or_create(name=group_name)
        
        # Only modify groups if not already in exactly this group
        current_groups = list(instance.groups.values_list('name', flat=True))
        if [group_name] != current_groups:
            instance.groups.clear()
            instance.groups.add(group)
            
        # Give admin staff access if missing
        if instance.role == CustomUser.Role.ADMIN and not instance.is_staff:
            post_save.disconnect(assign_user_to_role_group, sender=CustomUser)
            instance.is_staff = True
            instance.save(update_fields=['is_staff'])
            post_save.connect(assign_user_to_role_group, sender=CustomUser)


@receiver(pre_save, sender=Anamnesis)
def capture_old_anamnesis(sender, instance, **kwargs):
    """Güncelleme yapılmadan önce veritabanındaki eski anamnez değerlerini hafızaya alır."""
    if instance.pk:
        try:
            instance._old_instance = Anamnesis.objects.get(pk=instance.pk)
        except Anamnesis.DoesNotExist:
            instance._old_instance = None
    else:
        instance._old_instance = None


@receiver(post_save, sender=Anamnesis)
def log_anamnesis_changes(sender, instance, created, **kwargs):
    """Anamnez (Sağlık Geçmişi) oluşturma veya güncellemelerini log tablosuna yazar."""
    user = get_current_user()
    request = get_current_request()
    
    # IP Adresini Çek
    ip_address = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')

    changes = {}
    # Loglanacak tıbbi geçmiş alanları
    fields = [
        "medical_history", "allergies", "medications", "chronic_diseases",
        "surgical_history", "family_history", "smoking", "alcohol",
        "pregnancy_status", "other_notes"
    ]
    
    if created:
        action = AuditLog.Action.CREATE
        for field in fields:
            val = getattr(instance, field)
            if val:
                changes[field] = {"old": None, "new": str(val)}
    else:
        action = AuditLog.Action.UPDATE
        old_inst = getattr(instance, '_old_instance', None)
        if not old_inst:
            return
        for field in fields:
            old_val = getattr(old_inst, field)
            new_val = getattr(instance, field)
            if old_val != new_val:
                changes[field] = {"old": str(old_val), "new": str(new_val)}

    # Sadece gerçek bir değişiklik varsa logla
    if changes:
        AuditLog.objects.create(
            user=user,
            action=action,
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.pk,
            changes=changes,
            ip_address=ip_address
        )
