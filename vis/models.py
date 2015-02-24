from django.db import models
from jsonfield import JSONField 

# Create your models here.

class Bar(models.Model):
	"""A Bar represents a single entry on the timeline"""
	
	title       = models.TextField()
	subtitle    = models.TextField()
	description = models.TextField(default='')
	type        = models.CharField(max_length = 200, default='')
	startdate   = models.DateTimeField("Start Date")
	enddate     = models.DateTimeField("End Date")
	dataset     = models.CharField(max_length = 200, default='')
	link 	    = JSONField(default="[{}]")
	linkid 		= models.CharField(max_length = 200, default='') 
	#  Let django generate primary key ids for now and we'll query on linkid

	def to_json(self):	
		jsonEntry = {
	            "title"       : self.title,
	            "subtitle"    : self.subtitle,
	            "description" : self.description,
	            "type"        : self.type,
	            "startdate"   : str(self.startdate),
	            "enddate"     : str(self.enddate),
	            "link"        : self.link,
	            "id"          : self.linkid,
	    }
	  	return jsonEntry

	def __str__(self):
		return self.title