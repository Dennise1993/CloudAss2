#!/usr/bin/env python3

import logging
import time
import pika
import json
import os
from tweepy import OAuthHandler
from tweepy.streaming import StreamListener
from tweepy import Stream

class TweetStreamListener(StreamListener):

    def on_status(self, status):
        print(status.text)

    def on_data(self, tweet):
        try:
            return tweet
        except Exception as e:
            print(e)

    def on_error(self, status_code):
        print(status_code)


NEW_TWEET_QUEUE = 'new_tweets'

logging.basicConfig(level=logging.DEBUG)

credentials = pika.PlainCredentials(os.environ['RABBITMQ_USER'], 
    os.environ['RABBITMQ_PASS'])
parameters = pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
connection = pika.BlockingConnection(parameters)
channel = connection.channel()

channel.queue_declare(queue=NEW_TWEET_QUEUE)

auth = OAuthHandler(os.environ['CONSUMER_KEY'], os.environ['CONSUMER_SECRET'])
auth.set_access_token(os.environ['ACCESS_TOKEN'], os.environ['ACCESS_TOKEN_SECRET'])

i = 0
while True:
    try:
        streamListener = TweetStreamListener()
        streamer = tweepy.Stream(auth = auth, listener = streamListener)
        message = streamer.filter(locations = os.environ['COORDINATORS'])
    except Exception as e:
        print('exists error')
        streamer.disconnect()
        sys.exit(1)

    channel.basic_publish(
        exchange='',
        routing_key=NEW_TWEET_QUEUE,
        body=message,
    )

    logging.info(f'Produced tweet: {message}')

    i += 1
    time.sleep(0.2)

connection.close()
