from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """Sadece yönetici rolündekiler erişebilir."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsAdminOrDoctorUser(permissions.BasePermission):
    """Hekim veya yönetici erişebilir. Asistanlar erişemez."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'doctor'])
