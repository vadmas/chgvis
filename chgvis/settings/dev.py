try:
	from base import *
except ImportError:
	print "Import Error"
	pass
# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
TEMPLATE_DEBUG = True
