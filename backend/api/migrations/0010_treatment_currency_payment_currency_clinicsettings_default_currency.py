from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_remove_treatment_tooth_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='treatment',
            name='currency',
            field=models.CharField(
                choices=[('TRY', 'Türk Lirası (₺)'), ('USD', 'Amerikan Doları ($)')],
                default='TRY',
                max_length=3,
                verbose_name='Para Birimi',
            ),
        ),
        migrations.AddField(
            model_name='payment',
            name='currency',
            field=models.CharField(
                choices=[('TRY', 'Türk Lirası (₺)'), ('USD', 'Amerikan Doları ($)')],
                default='TRY',
                max_length=3,
                verbose_name='Para Birimi',
            ),
        ),
        migrations.AddField(
            model_name='clinicsettings',
            name='default_currency',
            field=models.CharField(
                choices=[('TRY', 'Türk Lirası (₺)'), ('USD', 'Amerikan Doları ($)')],
                default='TRY',
                max_length=3,
                verbose_name='Varsayılan Para Birimi',
            ),
        ),
    ]
