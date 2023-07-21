# Generated by Django 4.1.5 on 2023-06-09 14:54

from django.db import migrations, models


def bump_rjs_rollingstock_version(apps, schema_editor):
    RollingStock = apps.get_model("osrd_infra", "RollingStock")
    RollingStock.objects.filter(version="3.1").update(version="3.2")


def bump_rjs_rollingstock_version_reverse(apps, schema_editor):
    RollingStock = apps.get_model("osrd_infra", "RollingStock")
    RollingStock.objects.filter(version="3.2").update(version="3.1")


class Migration(migrations.Migration):
    dependencies = [
        ("osrd_infra", "0033_rollingstock_locked"),
    ]

    operations = [
        migrations.AddField(
            model_name="rollingstock",
            name="electrical_power_startup_time",
            field=models.FloatField(
                default=None,
                help_text="The time the train takes before actually using electrical power (in s). Is null if the train is not electric.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="rollingstock",
            name="raise_pantograph_time",
            field=models.FloatField(
                default=None,
                help_text="The time it takes to raise this train's pantograph in s. Is null if the train is not electric.",
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="rollingstock",
            name="version",
            field=models.CharField(default="3.2", editable=False, max_length=16),
        ),
        migrations.RunPython(bump_rjs_rollingstock_version, bump_rjs_rollingstock_version_reverse),
    ]
