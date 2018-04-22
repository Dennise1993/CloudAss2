
#Import the necessary methods from tweepy library
from tweepy.streaming import StreamListener
from tweepy import OAuthHandler
from tweepy import Stream

#Variables that contains the user credentials to access Twitter API
access_token = "985478504593543168-QV3GTlI9wdWzZsEgs4nPCfdCjmWaj1q"
access_token_secret = "Numt0PYvFXyndnezremzfdKt6M2TyRX8ZNdK0PxBkslOg"
consumer_key = "nFvx9ZIAJLdURJEcyzKcJX9bp"
consumer_secret = "DXFArg8gxgxPZPlBLU9lQ8BgFQ0XG5Q0iSZGYuWQ4e3skoCccs"


#This is a basic listener that just prints received tweets to stdout.
class StdOutListener(StreamListener):

    def on_data(self, data):
        print(data)
        return True

    def on_error(self, status):
        print(status)


if __name__ == '__main__':

    #This handles Twitter authetification and the connection to Twitter Streaming API
    myListener = StdOutListener()
    auth = OAuthHandler(consumer_key, consumer_secret)
    auth.set_access_token(access_token, access_token_secret)

    stream = Stream(auth, myListener)

    stream.filter(locations=[110.096982, -44.551835, 153.369916, -10.512868])

