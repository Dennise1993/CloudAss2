#!/usr/bin/env python3
import json
import logging
import os
from functools import lru_cache

import pika
from shapely.geometry import shape, Point
from textblob import TextBlob
import html2text

TWEET_QUEUE = 'new_tweets'
UPDATED_TWEET_QUEUE = 'updated_tweets'


def select_attributes(updated_tweet, tweet_json):
    """Grab the desired tweets from a tweet, and save it in updated_tweet."""

    # Get basic tweet info
    updated_tweet['created_at'] = tweet_json["created_at"]
    updated_tweet['id'] = tweet_json['id_str']
    updated_tweet['text'] = tweet_json['text']
    if "extended_tweet" in tweet_json:
        updated_tweet['text'] = tweet_json['extended_tweet']['full_text']

    # Get the device type from "source" attribute
    # e.g. Twitter Web Client", "Twitter for Android"
    txt = html2text.html2text(tweet_json['source'])
    updated_tweet['source'] = txt.split(']')[0][1:]

    # Get user info
    updated_tweet['user'] = {}
    updated_tweet['user']['id'] = tweet_json['user']['id_str']
    updated_tweet['user']['screen_name'] = tweet_json['user']['screen_name']
    updated_tweet['user']['geo_enabled'] = tweet_json['user']['geo_enabled']

    # Get coordinates
    updated_tweet['coordinates'] = tweet_json['coordinates']

    if 'retweeted_status' in tweet_json:
        updated_tweet['retweeted_status'] = tweet_json['retweeted_status']
    if 'quoted_status' in tweet_json:
        updated_tweet['quoted_status'] = tweet_json['quoted_status']

    # Remove CouchDB ID if it exists
    updated_tweet.pop('_id', None)


def reverse_geo_location(updated_tweet, aus_polygon, aus_region):
    """Perform reverse geolocation on a given tweet to identify its suburb,
    and insert it into the tweet.
    """
    point = Point(updated_tweet["coordinates"]["coordinates"][0],
                  updated_tweet["coordinates"]["coordinates"][1])
    for suburb, polygon in aus_polygon.items():
        if polygon.contains(point):
            updated_tweet["suburb"] = suburb
            break

    if "suburb" in updated_tweet:
        for suburb, region in aus_region.items():
            if suburb == updated_tweet["suburb"]:
                updated_tweet["region"] = region
                break
    else:
        updated_tweet["suburb"] = None


def identify_political_tweets(updated_tweet):
    """Inserts a list of found political hashtags into a given tweet, if it
    has any.
    """
    found_political_tags = []
    political_keywords = [
        pk.lower() for pk in os.environ['POLITICS_KEY_WORDS'].split(',')
    ]

    for keyword in political_keywords:
        if keyword in updated_tweet['text'].lower():
            found_political_tags.append(keyword)

    if len(found_political_tags) > 0:
        updated_tweet['politicalHashtag'] = found_political_tags


def identify_junk_food_tweets(updated_tweet):
    """Inserts a list of found junk food into a given tweet, if it has any."""
    found_junk_food = []
    junk_food_file = os.environ['JUNK_FOOD_KEY_WORDS_FILE']

    junk_food_items = read_junk_food_items(junk_food_file)

    for keyword in junk_food_items:
        if keyword in updated_tweet['text'].lower():
            found_junk_food.append(keyword)

    if len(found_junk_food) > 0:
        updated_tweet['junkFoodList'] = found_junk_food


def analysis_sentiment(updated_tweet):
    # Utility function, TextBlob, to analysis sentiment of text
    sentiment = TextBlob(updated_tweet['text'])
    updated_tweet['sentiment'] = sentiment.sentiment.polarity


def process(tweet_json, aus_polygon, aus_region):
    """Process and analyse a tweet from Twitter."""

    updated_tweet = {}

    # Grab the tweet attributes that we want
    select_attributes(updated_tweet, tweet_json)

    # Determine the suburb and region for which the tweet was sent in
    reverse_geo_location(updated_tweet, aus_polygon, aus_region)

    # Identify whether the tweet is political
    identify_political_tweets(updated_tweet)

    # Identify whether the tweet is related to junk food
    identify_junk_food_tweets(updated_tweet)

    # Analyse the sentiment of the tweet
    analysis_sentiment(updated_tweet)

    return updated_tweet


@lru_cache(maxsize=None)
def read_suburb_map(map_file_name):
    """Read in the geographic regions for each suburb."""
    aus_polygon = {}
    # TODO - check all these != 'None'
    with open(map_file_name) as file:
        file_data = json.load(file)
        for feature in file_data["features"]:
            if str(feature['geometry']) != 'None':
                polygon = shape(feature['geometry'])
                suburb = feature["properties"]["SA2_NAME16"]
                aus_polygon[suburb] = polygon

    return aus_polygon

@lru_cache(maxsize=None)
def read_region_map(map_file_name):
    """Read in the geographic regions for each suburb."""
    aus_region = {}
    with open(map_file_name) as file:
        file_data = json.load(file)
        for feature in file_data["features"]:
            if feature['geometry'] is not None:
                region = feature["properties"]["GCC_NAME16"]
                suburb = feature["properties"]["SA2_NAME16"]
                aus_region[suburb] = region

    return aus_region


@lru_cache(maxsize=None)
def read_junk_food_items(junk_food_file_name):
    """Read in a sequence of junk food items, and returns a set of them."""
    junk_food_items = set()
    with open(junk_food_file_name) as file:
        for item in file.readlines():
            junk_food_items.add(item[::-1].lower())

    return junk_food_items


def do_consume(ch, method, properties, body):
    message = json.loads(body)
    aus_polygon = read_suburb_map("./SA2_2016_AUST (2).json")
    aus_region = read_region_map("./SA2_2016_AUST (2).json")

    # We only want tweets with geospatial coordinates
    if 'coordinates' in message:
        if message['coordinates'] is not None:
            logging.info(f'Processing tweet: {message}')
            # Process the tweet
            updated_tweet = process(message, aus_polygon, aus_region)
            logging.info(f'Processed tweet: {updated_tweet}')
            if updated_tweet["suburb"] is not None:
                # Push the processed tweet to the processed message queue
                channel.basic_publish(
                    exchange='',
                    routing_key=UPDATED_TWEET_QUEUE,
                    body=json.dumps(updated_tweet),
                )
        else:
            logging.info('No coordinate data. Skipping tweet: {}'
                         .format(message['id_str']))

    else:
        logging.info('Coordinate attribute does not exist. Skipping tweet: {}'
                     .format(message['id_str']))

    ch.basic_ack(delivery_tag=method.delivery_tag)


if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    # Setup RabbitMQ connection
    credentials = pika.PlainCredentials(os.environ['RABBITMQ_USER'],
                                        os.environ['RABBITMQ_PASS'])
    parameters = pika.ConnectionParameters(host='rabbitmq',
                                           credentials=credentials)
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Setup RabbitMQ queues
    channel.queue_declare(queue=TWEET_QUEUE)
    channel.queue_declare(queue=UPDATED_TWEET_QUEUE)

    # Setup RabbitMQ channel
    channel.basic_qos(prefetch_count=3)
    channel.basic_consume(do_consume, queue=TWEET_QUEUE)

    channel.start_consuming()
