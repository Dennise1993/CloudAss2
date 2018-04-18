'''
	this script is to get the tweets and store them into couchdb without duplication
	it is only for one VM with its local couchdb without RabbitMQ

	author: qiulei zhang

	date: 18, April, 2018
'''

'''
	task 1: get the tweets
	task 2: connect with couchdb
	task 3: write the tweets into couchdb without duplication
'''

from tweepy import OAuthHandler
from tweepy.streaming import StreamListener
from tweepy import Stream
import couchdb
import sys
import json

# authorization twitter
consumer_key = "rnTkKGP6DxU9mMWW2OLqJMmFm"
consumer_secret = "yfVdaJQ8gMx8qmXB3SsLihgvYT1pAf1ym0sVqJFxcdqM9tpPlH"
access_token = "985810706086768640-ZFr3TOIbf7A2jOX4VMc3JF9TnFIQOJz"
access_token_secret = "l2nfGcETTkTTeUjzK6w5iwAx7kDSvg85TSdcxkcE5url4"

# the url of the couchdb
# the type is http://[yourDatabaseName]:[yourPassword]@localhost:5984
server_url = "http://admin:admin@localhost:5984/"
db_name = "ccc_ass2"

# the coordinator of Melbourne,just for testing
coordinators = [144.5937, -37.9994, 145.4013, -37.5113]

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
		sys.exit(2)
	return db

db = connect_database(server_url, db_name)

def save_tweet(doc, db):
	# use id_str of tweet as the key of the table
	doc['_id'] = doc['id_str']
	db.save(doc)

class TweetListener(StreamListener):
	def on_status(self, status):
		print(status.text)

	def on_data(self, tweet):
		try:
			# convert the tweet into json type
			tweet_json = json.loads(tweet)

			#########################################

			# add process here

			#########################################

			# save the tweet into the couchdb
			save_tweet(tweet_json, db)
			print("add tweet: " + tweet_json["id_str"])
		except Exception as e:
			print(e)

		#remove duplication	
		except couchdb.http.ResourceConflict:
			print("already exists this tweet")

	def on_error(self, status_code):
		print(status_code)


# get twitter authorization
auth = OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)

print("be ready to collect tweet")
streamer = Stream(auth, TweetListener())
streamer.filter(locations = coordinators)