import config
import tweepy
import couchdb
import json

def save_tweet(doc, db):
	# use id_str of tweet as the key of the table
	doc['_id'] = doc['id_str']
	db.save(doc)

class SearchTweets():

	def __init__(self, db, api):
		self.db = db
		self.api = api

	def search(self):
		for keyword in config.keywords:
			while True:
				try:
					print(config.GEOCODE)
					tweets = self.api.search(q = keyword, geocode = config.GEOCODE)

					for tweet in tweets:
						tweet_json = tweet._json
						print(tweet_json)
						# save_tweet(tweet_json, self.db)
				except Exception as e:
					print(e)
				#remove duplication	
				except couchdb.http.ResourceConflict:
					print("already exists this tweet")
		 		