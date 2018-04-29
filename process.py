from textblob import TextBlob
from config import keywords
import json
from shapely.geometry import shape, Point

def select_attributes(tweet_json, updated_tweet):
	updated_tweet['id'] = tweet_json['id']
	updated_tweet['id_str'] = tweet_json['id_str']
	updated_tweet['text'] = tweet_json['text']
	updated_tweet['source'] = tweet_json['source']
	updated_tweet['user'] = {}
	updated_tweet['user']['id_str'] = tweet_json['id_str']
	updated_tweet['user']['name'] = tweet_json['user']['name']
	updated_tweet['user']['description'] = tweet_json['user']['description']
	updated_tweet['coordinates'] = tweet_json['coordinates']
	updated_tweet['geo'] = tweet_json['geo']
	updated_tweet['timestamp_ms'] = tweet_json['timestamp_ms']

def reverseGeoLocation(updated_tweet, aus_polygon):
	# reverse geolocation of the suburb of each tweet
	# geolocator = Nominatim()
	# location = geolocator.reverse(str(updated_tweet["coordinates"]["coordinates"][1]) + ',' + str(updated_tweet["coordinates"]["coordinates"][0]))
	# updated_tweet['suburb'] = location.raw['address']['suburb']
	point = Point(updated_tweet["coordinates"]["coordinates"][0], updated_tweet["coordinates"]["coordinates"][1])
	print(point)
	for suburb, polygon in aus_polygon.items():
		# print(suburb)
		# print(polygon)
		if polygon.contains(point):
			updated_tweet["suburb"] = suburb
			print(suburb)


def identifyPolicies(updated_tweet):
	# identify whether there are policies keywords
	updated_tweet['policies_tags'] = []
	for keyword in keywords:
		if keyword in updated_tweet['text']:
			print(keyword)
			updated_tweet['policies_tags'].append(keyword)

def analysisSentiment(updated_tweet):
	# Utility function, TextBlob, to analysis sentiment of text
	sentiment = TextBlob(updated_tweet['text'])
	updated_tweet['sentiment'] = sentiment.sentiment.polarity

def process(tweet_json, aus_polygon):
	# add process here
	updated_tweet = {}

	select_attributes(tweet_json, updated_tweet)

	reverseGeoLocation(updated_tweet, aus_polygon)	

	identifyPolicies(updated_tweet)	

	analysisSentiment(updated_tweet)

	return updated_tweet

def read_map(map_file_name):
	aus_polygon = {}
	with open(map_file_name) as file:
		file_data = json.load(file)
		for feature in file_data["features"]:
			polygon = shape(feature['geometry'])
			# print(feature["properties"]["Name"])
			aus_polygon[feature["properties"]["Name"]] = polygon
		file.close()
	return aus_polygon

# print(read_map("./aus_lga.geojson.json"))

