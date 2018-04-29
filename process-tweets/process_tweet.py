#!/usr/bin/env python3

import logging
import time
import pika
import json
import os
from geopy.geocoders import Nominatim
from textblob import TextBlob
from shapely.geometry import shape, Point
from functools import lru_cache

TWEET_QUEUE = 'new_tweets'
UPDATED_TWEET_QUEUE = 'updated_tweets'

def select_attributes(tweet_json, updated_tweet):
	updated_tweet['created_at'] = tweet_json["created_at"]
	updated_tweet['id'] = tweet_json['id']
	updated_tweet['id_str'] = tweet_json['id_str']
	updated_tweet['text'] = tweet_json['text']
	# if true, use retweeted_status
	updated_tweet['truncated'] = tweet_json['truncated']
	if "in_reply_to_status_id_str" in tweet_json:
		updated_tweet['in_reply_to_status_id_str'] = tweet_json['in_reply_to_status_id_str']
	updated_tweet['user'] = {}
	updated_tweet['user']['id'] = tweet_json['id']
	updated_tweet['user']['id_str'] = tweet_json['id_str']
	updated_tweet['user']['screen_name'] = tweet_json['user']['screen_name']
	updated_tweet['user']['geo_enabled'] = tweet_json['user']['geo_enabled']
	if "coordinates" in tweet_json:
		updated_tweet['coordinates'] = tweet_json['coordinates']

	

def reverseGeoLocation(updated_tweet, aus_polygon):
	# reverse geolocation of the suburb of each tweet
	# geolocator = Nominatim()
	# location = geolocator.reverse(str(updated_tweet["coordinates"]["coordinates"][1]) + ',' + str(updated_tweet["coordinates"]["coordinates"][0]))
	# updated_tweet['suburb'] = location.raw['address']['suburb']
	if "coordinates" in updated_tweet:
		point = Point(updated_tweet["coordinates"]["coordinates"][0], updated_tweet["coordinates"]["coordinates"][1])
		for suburb, polygon in aus_polygon.items():
			if polygon.contains(point):
				updated_tweet["suburb"] = suburb


def identifyPoliticalTweets(updated_tweet):
	# identify whether there are policies keywords
	updated_tweet['politicalHashtag'] = []
	for keyword in os.environ["KEY_WORDS"]:
		if keyword in json.dumps(updated_tweet):
			updated_tweet['politicalHashtag'].append(keyword)

def analysisSentiment(updated_tweet):
	# Utility function, TextBlob, to analysis sentiment of text
	sentiment = TextBlob(updated_tweet['text'])
	updated_tweet['sentiment'] = sentiment.sentiment.polarity

def process(tweet_json, aus_polygon):
	# add process here
	updated_tweet = {}

	select_attributes(tweet_json, updated_tweet)

	reverseGeoLocation(updated_tweet, aus_polygon)	

	identifyPoliticalTweets(updated_tweet)	

	analysisSentiment(updated_tweet)

	return updated_tweet

@lru_cache(maxsize=None)
def read_map(map_file_name):
    aus_polygon = {}
    with open(map_file_name) as file:
        for feature in file_data["features"]:
            polygon = shape(feature['geometry'])
            # print(feature["properties"]["Name"])
            aus_polygon[feature["properties"]["Name"]] = polygon
    return aus_polygon

def do_consume(ch, method, properties, body):
    message = json.loads(body)
    aus_polygon = read_map("./aus_lga.geojson.json")
    updated_tweet = process(message, aus_polygon)
    logging.info(f'Consumed tweet: {updated_tweet}')
    ch.basic_ack(delivery_tag=method.delivery_tag)


if __name__ == '__main__':
	logging.basicConfig(level=logging.DEBUG)

	credentials = pika.PlainCredentials(os.environ['RABBITMQ_USER'], 
	    os.environ['RABBITMQ_PASS'])
	parameters = pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
	connection = pika.BlockingConnection(parameters)
	channel = connection.channel()

	channel.queue_declare(queue=TWEET_QUEUE)
	channel.queue_declare(queue=UPDATED_TWEET_QUEUE)

	channel.basic_qos(prefetch_count=3)
	channel.basic_consume(do_consume, queue=TWEET_QUEUE)

	channel.start_consuming()

	channel.basic_publish(
	        exchange='',
	        routing_key=UPDATED_TWEET_QUEUE,
	        body=updated_tweet,
	    )
