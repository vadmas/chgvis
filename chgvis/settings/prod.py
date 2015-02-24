try:
	from base import *
except ImportError:
	pass

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False
TEMPLATE_DEBUG = False

ALLOWED_HOSTS = ['localhost', '127.0.0.1','local.dev']

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

STATIC_ROOT = 'staticfiles'
STATIC_URL='/static/'

STATICFILES_DIRS = (
	os.path.join(BASE_DIR, 'static'),
)

print "Running prod, debug = {}".format(DEBUG)