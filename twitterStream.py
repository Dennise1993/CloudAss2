
import process
import json
from tweepy.streaming import StreamListener
from tweepy import Stream
import couchdb

def save_tweet(doc, db):
	# use id_str of tweet as the key of the table
	doc['_id'] = doc['id_str']
	db.save(doc)

class TweetStreamListener(StreamListener):
	def __init__(self, db, aus_polygon):
		self.db = db
		self.aus_polygon = aus_polygon

	def on_status(self, status):
		print(status.text)

	def on_data(self, tweet):
		try:
			# convert the tweet into json type
			tweet_json = json.loads(tweet)

			# process tweet
			updated_tweet = process.process(tweet_json, self.aus_polygon)

			# save the tweet into the couchdb
			save_tweet(updated_tweet, self.db)
			print("add tweet: " + tweet_json["id_str"])
		except Exception as e:
			print(e)

		#remove duplication	
		except couchdb.http.ResourceConflict:
			print("already exists this tweet")

	def on_error(self, status_code):
		print(status_code)