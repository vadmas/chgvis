from django import forms
from crispy_forms.helper import FormHelper 
from crispy_forms.layout import Submit, Layout, Field, Div, HTML
from crispy_forms.bootstrap import (
	PrependedText, PrependedAppendedText, FormActions, TabHolder, Tab)

from jsonview.decorators import json_view
from vis.loader import Loader



class SimpleForm(forms.Form):

	# databaseURL = forms.ChoiceField(
	# 	choices = (
	# 		('https://splubc.atlassian.net/rest/api/2/search', "https://splubc.atlassian.net/rest/api/2/search"),
	# 	),
	# 	initial = 'option_one',
	# 	widget = forms.Select,
	# )

	databaseURL = forms.CharField(
		initial= "https://splubc.atlassian.net/rest/api/2/search",
		label= "Database Url"
	)

	# project = forms.ChoiceField(
	# 	choices = (
	# 		('CHGVIZ', "CHGVIZ"), 
	# 		('CMDREC', 'CMDREC')
	# 	),
	# 	initial = 'option_one',
	# 	widget = forms.Select,
	# )

	project = forms.CharField(
		label= "Project",
		initial="CHGVIZ"
	)

	username = forms.CharField(
		label    = "Username",
	)
	
	password = forms.CharField(
		label    = "Password", 
		widget   = forms.PasswordInput
	)

	from_ = forms.DateField(
		widget   = forms.TextInput(attrs={'class':'datepicker'}),
		required = False
	)

	to = forms.DateField(
		widget   = forms.TextInput(attrs={'class':'datepicker'}),
		required = False
	)

	release = forms.FloatField(
		widget = forms.NumberInput(),
		min_value = 0,
		required = False
	)

	sprint = forms.IntegerField(
		widget = forms.NumberInput(),
		min_value = 0,
		required = False
	)

	helper = FormHelper()
	helper.form_method = 'POST'
	helper.form_id = 'auth_form'

	helper.layout = Layout(
		"databaseURL",
		"project",
		"username",
		"password",
		Div(
			Div('from_',css_class='col-md-3',),
			Div('to',css_class='col-md-3',),
			Div('release',css_class='col-md-3',),
			Div('sprint',css_class='col-md-3',),
			css_class='row',
			)
		)

	helper.add_input(Submit('save', 'Get Data', css_class='btn-primary'))

	def get_context_data(self, **kwargs):
		context = super(MainView, self).get_context_data(**kwargs)
		context['pagetitle'] = 'My special Title'
		return context

	def clean(self):
		cleaned_data = super(SimpleForm, self).clean()
		databaseURL = cleaned_data.get("databaseURL")
		username = cleaned_data.get("username")
		password = cleaned_data.get("password")
		_from = cleaned_data.get("_from")
		to = cleaned_data.get("to")


		if databaseURL and username and password:	
			
			loader = Loader(
				cleaned_data['databaseURL'],
				cleaned_data['username'],
				cleaned_data['password']
			)
		
			if loader.status() != 200:
				raise forms.ValidationError("Bad request")
		
		if _from and to and to < _from:
			raise forms.ValidationError("Bad date range")
