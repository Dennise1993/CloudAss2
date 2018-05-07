#!/usr/bin/env python3

import logging
import pika
import json
import os
import time
import requests

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


skip = 0
limit = os.environ['HARVEST_LIMIT']
totalPosts = skip + limit


while (skip + limit) <= totalPosts:
    url = "http://45.113.232.90/couchdbro/twitter/_design/twitter/_view/geoindex?include_docs=true&reduce=false&skip="+str(skip)+"&limit="+str(limit)
    r = requests.get(url,auth=("readonly","ween7ighai9gahR6"))
    if r.status_code == requests.codes.ok:
        dict = r.json()
        totalPosts = dict['total_rows']
        print('totalPosts: ', totalPosts)
        tweets = dict["rows"]  # a list


        for tweetLine in tweets:
            # twID = tweetLine["id"]  # the tweeter id is displayed at "_id" in tweetLine['doc'], so extract it from tweetLine['id']
            tweet = tweetLine['doc']
            # tweet["id"] = twID
            tweetStr = json.dumps(tweet)
            channel.basic_publish(
                    exchange='',
                    routing_key=NEW_TWEET_QUEUE,
                    body=tweetStr)
            print(tweet["_id"])
        skip = skip + limit
    time.sleep(5)



# Disconnect RabbitMQ
connection.close()
