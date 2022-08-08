import multiprocessing

workers = multiprocessing.cpu_count()

bind = "0.0.0.0:80"
keepalive = 120
errorlog = '-'
pidfile = '/tmp/fastapi.pid'
loglevel = 'error'