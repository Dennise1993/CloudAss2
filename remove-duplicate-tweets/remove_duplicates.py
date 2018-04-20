#!/usr/bin/env python3

import logging
import time
import pika
import json
import os

TWEET_QUEUE = 'new_tweets'

logging.basicConfig(level=logging.DEBUG)

credentials = pika.PlainCredentials(os.environ['RABBITMQ_USER'], 
    os.environ['RABBITMQ_PASS'])
parameters = pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
connection = pika.BlockingConnection(parameters)
channel = connection.channel()

channel.queue_declare(queue=TWEET_QUEUE)

def do_consume(ch, method, properties, body):
    message = json.loads(body)
    logging.info(f'Consumed tweet: {message}')
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=3)
channel.basic_consume(do_consume, queue=TWEET_QUEUE)

channel.start_consuming()