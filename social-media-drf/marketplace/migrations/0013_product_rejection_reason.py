from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0012_alter_usersubscription_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="rejection_reason",
            field=models.TextField(
                blank=True,
                help_text='Reason for rejection if the product status is "rejected"',
                null=True,
            ),
        ),
    ]
