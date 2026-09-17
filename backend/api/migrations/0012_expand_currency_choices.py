from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_treatmenttype_currency'),
    ]

    operations = [
        migrations.AlterField(
            model_name='clinicsettings',
            name='default_currency',
            field=models.CharField(
                choices=[('TRY', 'Türk Lirası (₺)'), ('USD', 'Amerikan Doları ($)'), ('EUR', 'Euro (€)'), ('GBP', 'İngiliz Sterlini (£)')],
                default='TRY',
                max_length=3,
                verbose_name='Varsayılan Para Birimi',
            ),
        ),
        migrations.AlterField(
            model_name='payment',
            name='currency',
            field=models.CharField(
                choices=[('TRY', 'Türk Lirası (₺)'), ('USD', 'Amerikan Doları ($)'), ('EUR', 'Euro (€)'), ('GBP', 'İngiliz Sterlini (£)')],
                default='TRY',
                max_length=3,
                verbose_name='Para Birimi',
            ),
        ),
        migrations.AlterField(
            model_name='treatment',
            name='currency',
            field=models.CharField(
                choices=[('TRY', 'Türk Lirası (₺)'), ('USD', 'Amerikan Doları ($)'), ('EUR', 'Euro (€)'), ('GBP', 'İngiliz Sterlini (£)')],
                default='TRY',
                max_length=3,
                verbose_name='Para Birimi',
            ),
        ),
        migrations.AlterField(
            model_name='treatmenttype',
            name='currency',
            field=models.CharField(
                choices=[('TRY', 'Türk Lirası (₺)'), ('USD', 'Amerikan Doları ($)'), ('EUR', 'Euro (€)'), ('GBP', 'İngiliz Sterlini (£)')],
                default='TRY',
                max_length=3,
                verbose_name='Para Birimi',
            ),
        ),
    ]