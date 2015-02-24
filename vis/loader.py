import json
import requests

from sets import Set
from json import JSONEncoder
from vis.models import Bar

#date processing
from dateutil import parser

class Loader(object):
	""" 
	Loader is a baseclass takes a URL, username, and password
	Good for checking password + username validity but must be 
	subclassed to do anything else

	load_bars method must be implemented by subclass
	"""
	
	#=======================================
	def __init__(self,url,username,password):
		self.url        = url
		self.username   = username
		self.password   = password
		self.parameters = {}
		self.request    = None
		self.bars       = []
	#=======================================

	#=======================================
	def status(self):
		""" 
		Check if username + password is valid
		code 200 == valid
		"""
		if self.request is None: self.make_request()
		return self.request.status_code
	#=======================================

	#=======================================
	def make_request(self):
		self.request = requests.get(self.url, params = self.parameters, auth=(self.username, self.password))
	#=======================================

	#=======================================
	def save_db(self):
		""" 
		Iterate through bars and save to database
		Will throw exception if called from baseclass
		"""
		if not bars: self.load_bars()

		for bar in self.bars:
			bar.save()
	#=======================================

	#=======================================
	def get_json(self):
		""" 
		Iterate through bars and make json
		Will throw exception if called from baseclass
		"""
		if not self.bars: self.load_bars()

		json_set = []

		for bar in self.bars:
			json_set.append(bar.to_json())

		return json_set
		# with open("vis/static/vis/data.json", "w") as outfile:
		# 	json.dump(json_set, outfile, indent=4)
	#=======================================

	#=======================================
	def load_bars(self):
		""" 
		Must be implemented by subclass
		"""
		raise NotImplementedError
	#=======================================


#------------------------------------------------------------------
#||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
#------------------------------------------------------------------

class JiraLoader(Loader):
	"""JiraLoader loads from jira site"""
	#=======================================
	def __init__(self,url,username,password,project,from_,to,release,sprint):
		
		Loader.__init__(self,url,username,password)
		
		# # Jira Query Language: More info here -> https://confluence.atlassian.com/display/JIRA/Advanced+Searching
		# Example:
		# jql = "project = CHGVIS AND created >= 2013/06/12 AND updated <= 2013/06/17"

		jql = "project = {}".format(project)

		if from_   is not None:
			jql += " AND created >= '{}'".format(from_)
		
		if to  is not None:
			jql += " AND updated <= '{}'".format(to)

		if release is not None:
			jql += " AND (fixVersion='{}' OR affectedVersion='{}')".format(release, release)
		
		if sprint  is not None:
			jql += " AND sprint = '{}'".format(release)

		params = {"jql":jql,
				  "fields":"issuetype,key,creator,created,status,description,updated,subtasks,summary,resolution,priority,parent",
				  "maxResults":-1}

		self.parameters = params
	#=======================================

	#=======================================
	def load_bars(self):
		
		if self.request is None: self.make_request()
		
		# Catch case where data return is empty
		try: data = self.request.json()["issues"]
		except KeyError: return

		# Note this is specific to JIRA JSON return format
		for entry in data:

			fields = entry["fields"]
			
			#description might be null
			description = fields["description"]
			if description is None: description = ''

			startdate   = parser.parse(fields["created"], ignoretz = True)
			enddate     = parser.parse(fields["updated"], ignoretz = True)
			link = []

			if "parent" in fields:
				link.append({
					"target": entry["fields"]["parent"]["key"],
					"time"  : startdate.strftime("%Y-%m-%d %H:%M:%S")
				})

			bar = Bar(
				title       = fields["summary"],
				subtitle    = fields["creator"]["displayName"],
				description = description,
				startdate   = startdate,
				enddate     = enddate,
				type        = fields["issuetype"]["name"],
				dataset     = self.url,
				link        = link,
				linkid      = entry["key"]
			)
			self.bars.append(bar)
	#=======================================

