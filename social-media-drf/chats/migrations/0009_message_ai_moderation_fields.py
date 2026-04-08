from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chats", "0008_messagereaction"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="ai_moderated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="message",
            name="ai_moderation_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("approved", "Approved"),
                    ("review_required", "Review Required"),
                    ("rejected", "Rejected"),
                ],
                default="approved",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="message",
            name="moderation_rejection_reason",
            field=models.TextField(blank=True),
        ),
    ]
