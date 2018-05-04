#!/usr/bin/env python3
import enchant
import json
import logging
import os
from functools import lru_cache

import pika
from shapely.geometry import shape, Point
from textblob import TextBlob
import html2text

#global variable
updated_tweet = {}


def select_attributes(tweet_json, updated_tweet):

    # get basic tweet info
    updated_tweet['created_at'] = tweet_json["created_at"]
    updated_tweet['id'] = tweet_json['id']
    updated_tweet['id_str'] = tweet_json['id_str']
    updated_tweet['text'] = tweet_json['text']
    if "extended_tweet" in tweet_json:
        updated_tweet['text'] = tweet_json['extended_tweet']['full_text']

    # get the device type from "source" attribute
    txt = html2text.html2text(tweet_json['source'])
    updated_tweet['source'] = txt.split(']')[0][1:]  # value e.g. Twitter Web Client", "Twitter for Android"

    # get user info
    updated_tweet['user'] = {}
    updated_tweet['user']['id'] = tweet_json['id']
    updated_tweet['user']['id_str'] = tweet_json['id_str']
    updated_tweet['user']['screen_name'] = tweet_json['user']['screen_name']
    updated_tweet['user']['geo_enabled'] = tweet_json['user']['geo_enabled']

    # get coordinates
    updated_tweet['coordinates'] = tweet_json['coordinates']

    if 'retweeted_status' in tweet_json:
        updated_tweet['retweeted_status'] = tweet_json['retweeted_status']
    if 'quoted_status' in tweet_json:
        updated_tweet['quoted_status'] = tweet_json['quoted_status']



def reverseGeoLocation(updated_tweet, aus_polygon):
    # reverse geolocation of the suburb of each tweet
    point = Point(updated_tweet["coordinates"]["coordinates"][0], updated_tweet["coordinates"]["coordinates"][1])
    for suburb, polygon in aus_polygon.items():
        if polygon.contains(point):
            updated_tweet["suburb"] = suburb


def identifyPoliticalTweets(updated_tweet):
    # identify whether there are policies keywords
    updated_tweet['politicalHashtag'] = []
    environKeywords = os.environ['POLITICS_KEY_WORDS']
    keywords = environKeywords.split(',')

    for keyword in keywords:
        if keyword in json.dumps(updated_tweet):
            updated_tweet['politicalHashtag'].append(keyword)

def identifyJunkFoodTweets(updated_tweet):
    # identify whether there are policies keywords
    updated_tweet['junkFoodList'] = []
    junkFoodFile = os.environ['JUNK_FOOD_KEY_WORDS_FILE']

    junkFoodItems = []
    f = open(junkFoodFile,'r')
    lines = f.readlines()
    for line in lines:
        junkFoodItems.append(line[:-1].lower())
    f.close()


    for keyword in junkFoodItems:
        if keyword in updated_tweet['text'].lower():
            updated_tweet['junkFoodList'].append(keyword)
    print('Hey KAN! This the the junk food list: ',updated_tweet['junkFoodList'])  # for debugging



def analysisSentiment(updated_tweet):
    # Utility function, TextBlob, to analysis sentiment of text
    sentiment = TextBlob(updated_tweet['text'])
    updated_tweet['sentiment'] = sentiment.sentiment.polarity

def analysisSpelling(updated_tweet):
    dic = enchant.Dict("en_US")
    incorrect = 0
    astr = json.dumps(updated_tweet["text"])
    alist = str.split(" ")

    for word in alist:
        if not dic.check(word):
            incorrect = incorrect + 1

    rate = 1 - incorrect/len(alist)
    updated_tweet["spellingrate"] = "{:.1%}".format(rate)

def process(tweet_json, aus_polygon):
    # add process here

    updated_tweet = {}

    select_attributes(tweet_json, updated_tweet)

    reverseGeoLocation(updated_tweet, aus_polygon)

    identifyPoliticalTweets(updated_tweet)

    identifyJunkFoodTweets(updated_tweet)

    analysisSentiment(updated_tweet)

    return updated_tweet


@lru_cache(maxsize=None)
def read_map(map_file_name):
    ausPolygon = {}
    with open(map_file_name) as file:
        file_data = json.load(file)
        for feature in file_data["features"]:
            if str(feature['geometry']) != 'None':
                polygon = shape(feature['geometry'])
                suburb = feature["properties"]["SA2_NAME16"]
                ausPolygon[suburb] = polygon
        file.close()
    return ausPolygon


def do_consume(ch, method, properties, body):
    message = json.loads(body)
    logging.info(f'Our consumed tweet: {message}')
    aus_polygon = read_map("./SA2_2016_AUST (2).json")

    # reset
    global updated_tweet
    updated_tweet = {}

    if str(message["coordinates"]) != 'None':
        updated_tweet = process(message, aus_polygon)
        print('Hey Kan, updated tweet with coordinates is here: ',updated_tweet)  #for debugging
    else:
        updated_tweet['id'] = message['id']
        print('Tweets has no coordinates: ',updated_tweet) #for debugging

    ch.basic_ack(delivery_tag=method.delivery_tag)

    #push it into second queue
    channel.basic_publish(
           exchange='',
           routing_key=UPDATED_TWEET_QUEUE,
           body=json.dumps(updated_tweet))

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    # Set up RabbitMQ Server
    credentials = pika.PlainCredentials(os.environ['RABBITMQ_USER'],
                                        os.environ['RABBITMQ_PASS'])
    parameters = pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Two queues
    TWEET_QUEUE = 'new_tweets'
    UPDATED_TWEET_QUEUE = 'updated_tweets'

    #Declear a new queue
    UPDATED_TWEET_QUEUE = 'updated_tweets'
    channel.queue_declare(queue=UPDATED_TWEET_QUEUE)

    # Take message out of tweeter streaming queue
    channel.queue_declare(queue=TWEET_QUEUE)
    channel.basic_qos(prefetch_count=3)
    channel.basic_consume(do_consume, queue=TWEET_QUEUE)

    channel.start_consuming()
