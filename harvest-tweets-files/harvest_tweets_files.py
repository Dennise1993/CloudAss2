#!/usr/bin/env python3

import logging
import pika
import json
import os
import time

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


#Load data from files
cwd = os.getcwd()
path = cwd + '/Files'
print("Path:", path)
for fileName in os.listdir(path):
    print('file name: ', fileName)

    try:
        with open(os.path.join(path, fileName), 'r') as file:
            try:
                for line in file:
                    try:
                        tweet = json.loads(line)
                        tweetStr = json.dumps(tweet)
                        channel.basic_publish(
                            exchange='',
                            routing_key=NEW_TWEET_QUEUE,
                            body=tweetStr)
                        print("Tweet from:",fileName, "tweet is: ",tweetStr[:50])
                    except:
                        print("Hey Kan, error occurs here: ", fileName)
                        continue

            except UnicodeDecodeError:
                continue


    except FileNotFoundError:
        print("this file not found:", fileName)
        continue


# Disconnect RabbitMQ
connection.close()
