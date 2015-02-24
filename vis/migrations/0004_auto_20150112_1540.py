# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import jsonfield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('vis', '0003_bar_dataset'),
    ]

    operations = [
        migrations.AddField(
            model_name='bar',
            name='link',
            field=jsonfield.fields.JSONField(default=b'[{}]'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='bar',
            name='linkid',
            field=models.CharField(default=b'', max_length=200),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='bar',
            name='description',
            field=models.TextField(default=b''),
        ),
    ]
