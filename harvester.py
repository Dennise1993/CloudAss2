'''
	this script is to get the tweets and store them into couchdb without duplication
	it is only for one VM with its local couchdb without RabbitMQ

	author: qiulei zhang

	date: 18, April, 2018
'''

'''
	task 1: get the tweets
	task 2: connect with couchdb
	task 3: process the tweet
	task 4: write the tweets into couchdb without duplication
'''
import config
from tweepy import OAuthHandler
import tweepy
import couchdb
import sys
from twitterStream import TweetStreamListener
from twitterSearch import SearchTweets
import process


def connect_database(url, db_name):
	try:
		couch = couchdb.Server(url)
		# check whether the database exists in the couchdb
		if db_name in couch:
			db = couch[db_name]
		else:
			db = couch.create(db_name)
	except Exception as e:
		print(Exception)
		sys.exit(1)
	return db


if __name__=='__main__':
	if len(sys.argv) != config.NUM_ARGS:
	 	print("Please input the correct arguments: <mode(search or stream)>")
	 	sys.exit(1)

	mode = sys.argv[1] 
	# get twitter authorization
	auth = OAuthHandler(config.consumer_key, config.consumer_secret)
	auth.set_access_token(config.access_token, config.access_token_secret)
	db = connect_database(config.server_url, config.db_name)

	aus_polygon = process.read_map("./aus_lga.geojson.json")

	print("be ready to collect tweets")
	if mode == 'stream':
		try:
			streamListener = TweetStreamListener(db, aus_polygon)
			streamer = tweepy.Stream(auth = auth, listener = streamListener)
			streamer.filter(locations = config.coordinators)
		except Exception as e:
			print("exists error")
			streamer.disconnect()
			sys.exit(1)

	elif mode == 'search':
		api = tweepy.API(
            			auth, wait_on_rate_limit=True, wait_on_rate_limit_notify=True
        				)
		search_tweets =  SearchTweets(db, api)
		search_tweets.search()