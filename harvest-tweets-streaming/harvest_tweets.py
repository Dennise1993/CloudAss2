#!/usr/bin/env python3

import logging
import time
import pika
import json
import os

NEW_TWEET_QUEUE = 'new_tweets'

logging.basicConfig(level=logging.DEBUG)

credentials = pika.PlainCredentials(os.environ['RABBITMQ_USER'], 
    os.environ['RABBITMQ_PASS'])
parameters = pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
connection = pika.BlockingConnection(parameters)
channel = connection.channel()

channel.queue_declare(queue=NEW_TWEET_QUEUE)

i = 0
while True:
    message = json.dumps({
        'data': i,
    })

    channel.basic_publish(
        exchange='',
        routing_key=NEW_TWEET_QUEUE,
        body=message,
    )

    logging.info(f'Produced tweet: {message}')

    i += 1
    time.sleep(0.2)

connection.close()