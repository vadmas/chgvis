from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'chgvis.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^vis/', include('vis.urls', namespace="vis")),
    url(r'^admin/', include(admin.site.urls)),
)
