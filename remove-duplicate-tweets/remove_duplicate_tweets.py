#!/usr/bin/env python3

import logging
import time
import pika
import json
import os
import couchdb
from functools import lru_cache


TWEET_QUEUE = 'updated_tweets'

@lru_cache(maxsize=None)
def connect_database(url, db_name):
	try:
		couch = couchdb.Server(url)
		# check whether the database exists in the couchdb
		if db_name in couch:
			db = couch[db_name]
		else:
			db = couch.create(db_name)
	except Exception as e:
		print(Exception)
		sys.exit(1)
	return db

def save_tweet(doc, db):
	# use id_str of tweet as the key of the table
	doc['_id'] = doc['id_str']
	db.save(doc)

def do_consume(ch, method, properties, body):
    store_message = json.loads(body)
    db = connect_database(os.environ['SERVER_URL'], os.environ['DB_NAME'])
    save_tweet(store_message, db)
    logging.info(f'Consumed tweet: {store_message}')
    ch.basic_ack(delivery_tag=method.delivery_tag)

if __name__ == '__main__':
	logging.basicConfig(level=logging.DEBUG)

	credentials = pika.PlainCredentials(os.environ['RABBITMQ_USER'], 
	    os.environ['RABBITMQ_PASS'])
	parameters = pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
	connection = pika.BlockingConnection(parameters)
	channel = connection.channel()

	channel.queue_declare(queue=TWEET_QUEUE)

	channel.basic_qos(prefetch_count=1)
	channel.basic_consume(do_consume, queue=TWEET_QUEUE)

	channel.start_consuming()
