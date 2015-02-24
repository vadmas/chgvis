import multiprocessing
import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'chgvis.settings.dev'

bind = '127.0.0.1:8001'
# workers = multiprocessing.cpu_count() * 2 + 1
# daemon = False
# pidfile = 'gunicorn_process_id.txt'
# pythonpath = '.'
accesslog = 'gunicorn_access_log.txt'
# errorlog = 'gunicorn_error_log.txt'
