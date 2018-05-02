#!/usr/bin/env python3

import logging
import pika
import json
import tweepy
import os
from tweepy import OAuthHandler

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


#Variables that contains the user credentials to access Twitter API
access_token = os.environ['ACCESS_TOKEN']
access_token_secret = os.environ['ACCESS_TOKEN_SECRET']
consumer_key = os.environ['CONSUMER_KEY']
consumer_secret = os.environ['CONSUMER_SECRET']

auth = OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)

api = tweepy.API(auth)

while True:
    for line in api.search(geocode = os.environ['SEARCH_RANGE'], rpp = 1000):
        print(str(line))
        channel.basic_publish(
                exchange='',
                routing_key=NEW_TWEET_QUEUE,
                body=line)
    time.sleep(5.05)

# Disconnect RabbitMQ
connection.close()
