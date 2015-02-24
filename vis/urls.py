from django.conf.urls import patterns, url
from vis.views import MainView, TimelineView

urlpatterns = patterns('',
	#ex: /vis
	# url(r'^$', TemplateView.as_view(template_name="vis/timeline.html"), name='timeline'),
	url(r'^$', MainView.as_view(), name='mainview'),
	url(r'timeline', TimelineView.as_view(template_name="vis/timeline.html"), name='timeline'),
	
	#ex: /vis/1
	# url(r'^(?P<bar_id>\d+)/$', Detail.as_view(), name="detail"),
)

