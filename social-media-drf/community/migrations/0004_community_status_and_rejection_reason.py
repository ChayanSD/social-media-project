from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("community", "0003_alter_community_members_count"),
    ]

    operations = [
        migrations.AddField(
            model_name="community",
            name="rejection_reason",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="community",
            name="status",
            field=models.CharField(
                choices=[("approved", "Approved"), ("pending", "Pending"), ("rejected", "Rejected")],
                default="approved",
                max_length=10,
            ),
        ),
        migrations.AddIndex(
            model_name="community",
            index=models.Index(fields=["status"], name="community_co_status_5f206a_idx"),
        ),
    ]
