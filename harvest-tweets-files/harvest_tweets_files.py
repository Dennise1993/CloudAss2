#!/usr/bin/env python3

import logging
import pika
import json
import os

NEW_TWEET_QUEUE = 'new_tweets'

if __name__ == '__main__':
    # Logs for debugging
    logging.basicConfig(level=logging.DEBUG)

    # RabbitMQ server setup
    ruser = os.environ['RABBITMQ_USER']
    rpass = os.environ['RABBITMQ_PASS']
    credentials = pika.PlainCredentials(ruser, rpass)
    parameters = pika.ConnectionParameters(host='rabbitmq',
                                           credentials=credentials)
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()
    channel.queue_declare(queue=NEW_TWEET_QUEUE)

    # Load data from files
    cwd = os.getcwd()
    files_directory = cwd + '/Files'

    logging.debug(f'Files directory: {files_directory}')

    for file_name in os.listdir(files_directory):
        logging.info('Opened file: {file_name}')

        file_path = os.path.join(files_directory, file_name)
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                try:
                    tweet = json.loads(line)
                    message = json.dumps(tweet)
                    channel.basic_publish(
                        exchange='',
                        routing_key=NEW_TWEET_QUEUE,
                        body=message
                    )

                    tweet_id = tweet['id_str']
                    logging.info(f'Tweet published: {file_name}-{tweet_id}')
                except json.JSONDecodeError as e:
                    logging.exception(f'Failed to decode tweet: '
                                      f'{file_name}-{tweet_id}')
                    logging.exception(e)

    # Disconnect RabbitMQ
    connection.close()
