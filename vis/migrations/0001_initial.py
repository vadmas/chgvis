# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Bar',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('title', models.TextField()),
                ('subtitle', models.TextField()),
                ('description', models.TextField()),
                ('startdate', models.DateTimeField(verbose_name=b'Start Date')),
                ('enddate', models.DateTimeField(verbose_name=b'End Date')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
