#!/usr/bin/env python3

import logging
import pika
import json
import os
import couchdb

UPDATED_TWEET_QUEUE = 'updated_tweets'
COUCHDB_TWEET_DATABASE = 'tweets'

logging.basicConfig(level=logging.DEBUG)


def do_consume(ch, method, properties, body):
    """Consume a tweet from RabbitMQ."""
    message = json.loads(body)
    logging.info(f'Consumed tweet: {message}')

    # Only save the tweet in the DB if we don't have it already
    message_id = message.pop(id)
    if message_id not in db:
        db[message_id] = message
        logging.info(f'Added tweet {message_id} to the database.')
    else:
        logging.info(f'Tweet {message_id} is already in the database. '
                     f'Skipping.')
    ch.basic_ack(delivery_tag=method.delivery_tag)


if __name__ == '__main__':
    # RabbitMQ Setup
    credentials = pika.PlainCredentials(os.environ['RABBITMQ_USER'],
                                        os.environ['RABBITMQ_PASS'])
    parameters = pika.ConnectionParameters(host='rabbitmq',
                                           credentials=credentials)
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    channel.queue_declare(queue=UPDATED_TWEET_QUEUE)

    # CouchDB Setup
    couch = couchdb.Server('http://couchdb:5984/')
    couch.resource.credentials = (os.environ['COUCHDB_USER'],
                                  os.environ['COUCHDB_PASSWORD'])
    if COUCHDB_TWEET_DATABASE in couch:
        db = couch[COUCHDB_TWEET_DATABASE]
    else:
        db = couch.create(COUCHDB_TWEET_DATABASE)

    channel.basic_qos(prefetch_count=3)
    channel.basic_consume(do_consume, queue=UPDATED_TWEET_QUEUE)

    channel.start_consuming()