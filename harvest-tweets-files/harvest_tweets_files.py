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
        logging.info(f'Opened file: {file_name}')

        file_path = os.path.join(files_directory, file_name)
        with open(file_path, 'r', encoding='utf-8') as file:
            try:
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
                    except Exception as e:
                        logging.exception(f'Failed to decode tweet: '
                                          f'{file_name}-{tweet_id}')
                        logging.exception(e)
                        logging.info(f'ERROR in json.loads(): {line}')
                        continue

            except UnicodeDecodeError as e:
                logging.exception(f'Failed to decode a line: '
                                  f'{line}')
                logging.exception(e)
                logging.info(f'ERROR in read a line in file: {line}')
                continue


    # Disconnect RabbitMQ
    connection.close()
