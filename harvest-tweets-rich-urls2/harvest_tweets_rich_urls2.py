#!/usr/bin/env python3

import logging
import pika
import json
import os
import time
import requests

NEW_TWEET_QUEUE = 'new_tweets'

# Logs for debugging
logging.basicConfig(level=logging.DEBUG)

# RabbitMQ server setup
ruser = os.environ['RABBITMQ_USER']
rpass = os.environ['RABBITMQ_PASS']
credentials = pika.PlainCredentials(ruser, rpass)
parameters = pika.ConnectionParameters(host='rabbitmq',
                                       credentials=credentials)
connection = pika.BlockingConnection(parameters)
channel = connection.channel()
channel.queue_declare(queue=NEW_TWEET_QUEUE)

# Tweet retrieval settings
# Tweet retrieval settings
skip = 0
limitStr = os.environ['LIMIT']
limit = int(limitStr)
total_posts = skip + limit

start_key_area= os.environ['START_KEY_AREA']
start_year = os.environ['START_YEAR']
start_month= os.environ['START_MONTH']
start_day= os.environ['START_DAY']

end_key_area = os.environ['END_KEY_AREA']
end_year = os.environ['END_YEAR']
end_month = os.environ['END_MONTH']
end_day = os.environ['END_DAY']

sleep_time = int(os.environ['SLEEP_TIME'])

while (skip + limit) <= total_posts:
    skipStr = str(skip)
    url = (f'http://45.113.232.90/couchdbro/twitter/_design/twitter/_view/'
           f'geoindex?include_docs=true&reduce=false&'
           f'skip={skipStr}&limit={limitStr}&'
           f'start_key=[%22{start_key_area}%22,{start_year},{start_month},{start_day}]&'
           f'end_key=[%22{end_key_area}%22,{end_year},{end_month},{end_day}]')

    r = requests.get(url, auth=("readonly", "ween7ighai9gahR6"))

    if r.status_code == requests.codes.ok:
        all_tweets_dict = r.json()
        total_posts = all_tweets_dict['total_rows']
        print('total Posts: ', total_posts)
        tweets = all_tweets_dict["rows"]  # a list

        for tweet_line in tweets:
            tweet = tweet_line['doc']
            message = json.dumps(tweet)
            print('Tweet to be published: ', message)

            channel.basic_publish(
                exchange='',
                routing_key=NEW_TWEET_QUEUE,
                body=message
            )

            logging.info(f'Tweet published:{tweet}')
        skip = skip + limit
    time.sleep(sleep_time)

# Disconnect RabbitMQ
connection.close()
