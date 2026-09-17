from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_treatment_currency_payment_currency_clinicsettings_default_currency'),
    ]

    operations = [
        migrations.AddField(
            model_name='treatmenttype',
            name='currency',
            field=models.CharField(
                choices=[('TRY', 'Türk Lirası (₺)'), ('USD', 'Amerikan Doları ($)')],
                default='TRY',
                max_length=3,
                verbose_name='Para Birimi',
            ),
        ),
    ]
