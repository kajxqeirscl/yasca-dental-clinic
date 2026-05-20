from django.apps import AppConfig
from django.db.models import Lookup
from django.db.models.fields import CharField, TextField

class TurkishIContains(Lookup):
    """
    Custom lookup to fix Django's UPPER(...) cast on PostgreSQL which breaks
    Turkish ICU collations because the right-hand search term literal loses the collation.
    Forces native ILIKE on Postgres, falls back to Django's UPPER/LIKE for SQLite.
    """
    lookup_name = 'tr_icontains'
    
    def as_sql(self, compiler, connection):
        lhs, lhs_params = self.process_lhs(compiler, connection)
        rhs, rhs_params = self.process_rhs(compiler, connection)
        params = lhs_params + rhs_params
        if connection.vendor == 'postgresql':
            return f"{lhs} ILIKE {rhs}", params
        else:
            return f"UPPER({lhs}) LIKE UPPER({rhs})", params

    def get_prep_lookup(self):
        return f"%{self.rhs}%"

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import api.signals
        
        # Register the custom lookup
        CharField.register_lookup(TurkishIContains)
        TextField.register_lookup(TurkishIContains)
