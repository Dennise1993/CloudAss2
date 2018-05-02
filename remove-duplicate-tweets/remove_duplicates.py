#!/usr/bin/env python3

import logging
import time
import pika
import json
import os
import couchdb

TWEET_QUEUE = 'new_tweets'
COUCHDB_TWEET_DATABASE = 'tweets'

logging.basicConfig(level=logging.DEBUG)

# RabbitMQ Setup
credentials = pika.PlainCredentials(os.environ['RABBITMQ_USER'], 
    os.environ['RABBITMQ_PASS'])
parameters = pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
connection = pika.BlockingConnection(parameters)
channel = connection.channel()

channel.queue_declare(queue=TWEET_QUEUE)

# CouchDB Setup
couch = couchdb.Server('http://couchdb:5984/')
if COUCHDB_TWEET_DATABASE in couch:
    db = couch[COUCHDB_TWEET_DATABASE]
else:
    db = couch.create(COUCHDB_TWEET_DATABASE)

def do_consume(ch, method, properties, body):
    message = json.loads(body)
    db.save(message)
    logging.info(f'Consumed tweet: {message}')
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=3)
channel.basic_consume(do_consume, queue=TWEET_QUEUE)

channel.start_consuming()