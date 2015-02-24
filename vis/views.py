from django.shortcuts import get_object_or_404, render
from django.views.generic import View, FormView, TemplateView
# from django.utils import simplejson

from django.core.urlresolvers import reverse
import json
import requests 

from vis.forms import SimpleForm
from vis.loader import Loader, JiraLoader
from vis.models import Bar

class MainView(FormView):
	template_name = 'vis/index.html'
	form_class = SimpleForm
	success_url = 'timeline'

	def form_valid(self, form, **kwargs):
		# This method is called when valid form data has been POSTed.
		# It should return an HttpResponse.

		# Save form information to session 
		self.request.session['cleaned_data'] = form.cleaned_data

		return super(MainView, self).form_valid(form)

class TimelineView(TemplateView):
	template_name = 'timeline'


	def get_context_data(self, **kwargs):
		context = super(TimelineView, self).get_context_data(**kwargs)
		data    = self.request.session['cleaned_data']

		loader = JiraLoader( data['databaseURL'], data['username'], data['password'], data["project"], 
							 data["from_"],       data["to"],       data["release"],  data["sprint" ])
		
		# context['data'] = loader.get_json();
		context['data'] = json.dumps(loader.get_json())

		return context

class Detail(View):
	def get(self, request):
		bar = get_object_or_404(Bar, pk=bar_id)
		return render(request, 'vis/detail.html', {'bar': bar})