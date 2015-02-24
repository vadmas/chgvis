# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vis', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='bar',
            name='type',
            field=models.CharField(default=b'', max_length=200),
            preserve_default=True,
        ),
    ]
