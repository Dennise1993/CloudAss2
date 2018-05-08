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
skip = 0
print('os.environ: ', os.environ['HARVEST_LIMIT'])
limitStr = os.environ['HARVEST_LIMIT']
limit = int(limitStr)
total_posts = skip + limit

while (skip + limit) <= total_posts:
    skipStr = str(skip)
    url = (f'http://45.113.232.90/couchdbro/twitter/_design/twitter/_view/'
           f'geoindex?include_docs=true&reduce=false&'
           f'skip={skipStr}&limit={limitStr}')
    r = requests.get(url, auth=("readonly", "ween7ighai9gahR6"))
    if r.status_code == requests.codes.ok:
        all_tweets_dict = r.json()
        total_posts = all_tweets_dict['total_rows']
        print('totalPosts: ', total_posts)
        tweets = all_tweets_dict["rows"]  # a list

        for tweet_line in tweets:
            # twID = tweetLine["id"]  # the tweeter id is displayed at "_id" in tweetLine['doc'], so extract it from tweetLine['id']
            tweet = tweet_line['doc']
            # tweet["id"] = twID
            message = json.dumps(tweet)
            channel.basic_publish(
                exchange='',
                routing_key=NEW_TWEET_QUEUE,
                body=message
            )
            logging.info(f'Tweet published:{tweet}')
            print(tweet["_id"])
        skip = skip + limit
    time.sleep(5)

# Disconnect RabbitMQ
connection.close()
