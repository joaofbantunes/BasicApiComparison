FROM python:3.10

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip3 install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./app /code/app

CMD ["gunicorn", "app.main:app", "-k", "uvicorn.workers.UvicornWorker", "-c", "app/fastapi_conf.py"]
