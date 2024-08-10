import requests
import openai
from dotenv import find_dotenv , load_dotenv
import os
import time
import json


load_dotenv()
#model="gpt-"

client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


functions = {
                'name': 'lead_details', 
                'description': 'Update the Lead details obtained from the client through the chat', 
                'url': 'https://hook.eu2.make.com/it0fo3coyesfvpw99supz4n03c1vjsp1', 
                'arguments': [
                                {
                                    'name': 'name', 
                                    'description': 'Name of the Client or lead'
                                }, 
                                {
                                    'name': 'ssn', 
                                    'description': 'ssn of the Client or lead'
                                }
                            ]
            }

asst = {
            'name': 'tst-asst', 
            'instruction': 'You are a debt specialist. You will ask the following details to the customer: Name, SSN, DOB. You have to ask these details sequentially, one at a time.also you need to initiate the chat', 
            'model': 'gpt-4o', 
            'functions': [
                            {
                                'functionName': 'lead_details', 
                                'functionDescription': 'Update the Lead details obtained from the client through the chat', 
                                'functionUrl': 'https://hook.eu2.make.com/it0fo3coyesfvpw99supz4n03c1vjsp1', 
                                'arguments': [
                                    {
                                        'name': 'name', 
                                        'description': 'Name of the Client or lead'
                                    }, 
                                    {
                                        'name': 'ssn', 
                                        'description': 'ssn of the Client or lead'
                                    }
                                ]
                            }, 
                            {
                                'functionName': 'debt_details', 
                                'functionDescription': 'Update the debt details obtained from the client through the chat', 
                                'functionUrl': 'https://hook.eu2.make.com/it0fo3coyesfvpw99supz4n03c1vjsp1', 
                                'arguments': [
                                                {
                                                    'name': 'name', 
                                                    'description': 'Name of the Client or lead'
                                                }, 
                                                {
                                                    'name': 'debt', 
                                                    'description': 'debt of the Client or lead'
                                                }
                                ]
                            }
            ]
        }

tool = [
            {
                'type': 'function', 
                'function': {
                                'description': 'jbfrvjr', 
                                'name': 'hbfevh', 
                                'parameters': {
                                                    'properties': {
                                                                        'jnefk': {
                                                                            'description': '', 
                                                                            'type': 'string'
                                                                            }
                                                                }, 
                                                    'required': ['jnefk'], 
                                                    'type': 'object'
                                            }, 
                                'url': 'https://hook.eu2.make.com/it0fo3coyesfvpw99supz4n03c1vjsp1'
                            }
            }
        ]
asst_list = client.beta.assistants.list()
print(tool[0]['function']['url'])