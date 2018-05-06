#!/usr/bin/env python3

import logging
import pika
import json
import tweepy
import os
import time
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


#Load data from Rich's geo-tagged tweets files
def loadRichFiles(path):
    # path = '/Users/kan/Documents/Test/Files'
    for fileName in os.listdir(path):
    print('file name: ', fileName)

    with open(path + '/'+fileName, 'r') as file:
        lines = json.load(file)

        tweets = lines["rows"]

        for tweetLine in tweets:
            tweet = tweetLine['doc']
            tweetStr = json.dumps(tweet)

            channel.basic_publish(
                    exchange='',
                    routing_key=NEW_TWEET_QUEUE,
                    body=tweetStr)


def loadRichLink():
    skip = 100
    limit = 2

    url = "http://45.113.232.90/couchdbro/twitter/_design/twitter/_view/geoindex?include_docs=true&reduce=false&skip="+str(skip)+"&limit="+str(limit)
    r = requests.get(url,auth=("readonly","ween7ighai9gahR6"))

    if r.status_code == requests.codes.ok:
        dict = r.json()
        tweets = dict["rows"]  # a list

        for tweetLine in tweets:

            tweet = tweetLine['doc']

            print(json.dumps(tweet))
            print("tweetLine[doc] class: ", tweetLine["doc"].__class__)

            print(tweet["_id"])












# Disconnect RabbitMQ
connection.close()
