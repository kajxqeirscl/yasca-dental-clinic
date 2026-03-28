from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import CustomUser

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
