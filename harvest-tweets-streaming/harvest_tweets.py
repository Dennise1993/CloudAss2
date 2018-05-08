#!/usr/bin/env python3

import logging
# import time
import pika
import json
import os
from tweepy import OAuthHandler
from tweepy.streaming import StreamListener
from tweepy import Stream

#logs for debegging
logging.basicConfig(level=logging.DEBUG)

# RabbitMQ server setup
ruser = os.environ['RABBITMQ_USER']
rpass = os.environ['RABBITMQ_PASS']
credentials = pika.PlainCredentials(ruser, rpass)
parameters = pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
connection = pika.BlockingConnection(parameters)
channel = connection.channel()
NEW_TWEET_QUEUE = 'new_tweets'
channel.queue_declare(queue=NEW_TWEET_QUEUE)

logging.info(os.environ)


# Tweeter listener with RabbitMQ channel embeded
class RabbitStreamListener(StreamListener):

    def on_status(self, status):
        print(status.text)

    def on_data(self, tweet):
        try:
            channel.basic_publish(
                exchange='',
                routing_key=NEW_TWEET_QUEUE,
                body=tweet)
            logging.info(f'Tweet published: {tweet}')
        except Exception as e:
            print(e)

    def on_error(self, status_code):
        print(status_code)

#Variables that contains the user credentials to access Twitter API
access_token = os.environ['ACCESS_TOKEN']
access_token_secret = os.environ['ACCESS_TOKEN_SECRET']
consumer_key = os.environ['CONSUMER_KEY']
consumer_secret = os.environ['CONSUMER_SECRET']

# Twitter authentication
auth = OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)
streamListener = RabbitStreamListener()

# Set up listerner
streamer = Stream(auth = auth, listener = streamListener)

# Convert coordinators from String to float list
locationsStr = os.environ['COORDINATORS']
locationsStrNoBrck = locationsStr[1:-1]
locationsNum = locationsStrNoBrck.split(',')
coordinator = []
for item in locationsNum:
    f = float(item)
    coordinator.append(f)
print(coordinator) # for debugging
streamer.filter(locations = coordinator)

# Disconnect RabbitMQ
connection.close()
