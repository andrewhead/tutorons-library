from defaults import *


SECRET_KEY = open(SECRET_KEY_FILE).read()
DEBUG = True
TEMPLATE_DEBUG = True
ALLOWED_HOSTS = []

LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'level': 'WARNING',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.request': {
            'handlers': ['console'],
            'propagate': True,
            'level': 'WARNING',
        },
    },
}
