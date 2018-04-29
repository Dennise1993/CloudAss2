FROM python:3

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y libgeos-dev

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "./remove_duplicate_tweets.py"]