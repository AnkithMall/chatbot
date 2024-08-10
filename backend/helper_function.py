import openai
import json
import requests
import time
import os
from dotenv import load_dotenv
from db_helper import get_tool,add_tool
import copy

load_dotenv()

client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

default_asst = "asst_fN72dShbo6g7z5okrGfO5eDB"

def object_to_dict(obj):
    if isinstance(obj, list):
        return [object_to_dict(item) for item in obj]
    elif hasattr(obj, "__dict__"):
        return {key: object_to_dict(value) for key, value in obj.__dict__.items()}
    else:
        return obj

def parse_required_action(action):
    action_dict = object_to_dict(action)
    return action_dict

def format_functions(functions):
    formatted_functions = []
    for function in functions:
        formatted_function = {
            "type": "function",
            "function": {
                "name": function["functionName"],
                "description": function["functionDescription"],
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        }
        
        for argument in function["arguments"]:
            formatted_function["function"]["parameters"]["properties"][argument["name"]] = {
                "type": "string",
                "description": argument["description"]
            }
            formatted_function["function"]["parameters"]["required"].append(argument["name"])
        
        formatted_functions.append(formatted_function)
    
    return formatted_functions

def create_assistant_helper(name, instruction, model, functions):
    print(f"incoming functions => {functions}")
    tools = copy.deepcopy(functions)
    for item in functions:
        if 'function' in item and 'url' in item['function']:
            del item['function']['url']
    print(f"\n\nFunctions => {functions}\n\n")
    chatbot_assis = client.beta.assistants.create(
        name=name,
        instructions=instruction,
        model=model,
        tools=functions
    )
    print(f"assistant created => {tools}")
    # Save functions and URLs to MongoDB
    for function in tools:
        print(f"function inside tool = > {function}")
        tool_data = {
            "asst_id": chatbot_assis.id,
            "tools": {
                "name": function['function']['name'],
                "description": function['function']['description'],
                "parameters": function['function']['parameters'],
                "url": function['function'].get('url', '')
            }
        }
        print(add_tool(tool_data))  # Save each function in MongoDB
    
    return chatbot_assis.id

def update_assistant_helper(name=None, instruction=None, model=None, functions=None, asst_id=None):
    if not asst_id:
        raise ValueError("Assistant ID is required")
    tools = copy.deepcopy(functions)
    for item in functions:
        if 'function' in item and 'url' in item['function']:
            del item['function']['url']
    update_params = {
        "assistant_id": asst_id,
        "name": name,
        "instructions": instruction,
        "model": model,
        "tools": functions
    }
    
    update_params = {key: value for key, value in update_params.items() if value is not None}
    
    chatbot_assis = client.beta.assistants.update(**update_params)
    
    # Update functions and URLs in MongoDB
    for function in tools:
        tool_data = {
            "asst_id": chatbot_assis.id,
            "tools": {
                "name": function['function']['name'],
                "description": function['function']['description'],
                "parameters": function['function']['parameters'],
                "url": function['function'].get('url', '')
            }
        }
        add_tool(tool_data)  # Update each function in MongoDB
    
    return chatbot_assis.id


def create_message(message, thread_id):
    return client.beta.threads.messages.create(
        thread_id=thread_id, role="user", content=message
    )

def run_thread(thread_id, assistant_id):
    return client.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=assistant_id
    )

def call_required_functions(run, required_actions):
    tools_output = []
    required_actions_dict = object_to_dict(required_actions)
    print(f"Required Actions => {required_actions_dict}")

    if 'submit_tool_outputs' in required_actions_dict:
        action = required_actions_dict['submit_tool_outputs']
        for tool_call in action['tool_calls']:
            func_name = tool_call['function']['name']
            #print(f"function name => {func_name}")

            arguments = json.loads(tool_call['function']['arguments'])
            print(f"function_name={func_name}\narguments={arguments}")
            output = {}

            # Retrieve the tool data, including the URL, from MongoDB
            tool_data = get_tool(run.assistant_id,func_name)
            print(f"tool data => {tool_data}\n arhuments => {arguments}\nrun => {run}\nassistant id => {run.assistant_id}")
            if tool_data["success"]:
                url = tool_data["tool"]["tools"]["url"]
                try:
                    response = requests.post(url, json=arguments)
                    if response.status_code == 200:
                        output = response.json()
                        print(f"Output => {output}")
                except requests.exceptions.RequestException as e:
                    print("Error tool Call !", e)
                tools_output.append({"tool_call_id": tool_call['id'], "output": output.get("message", "")})
            else:
                raise ValueError(f"Unknown Function {func_name} or URL not found")

    return client.beta.threads.runs.submit_tool_outputs(
        thread_id=run.thread_id,
        run_id=run.id,
        tool_outputs=tools_output
    )

def wait_for_run_completion(thread_id, run_id):
    response = ""
    while True:
        time.sleep(5)
        try:
            run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run_id)
            if run.status == "completed":
                messages = client.beta.threads.messages.list(thread_id=thread_id)
                last_message = messages.data[0]
                response = last_message.content[0].text.value
                print(f"Assistant Response: {response}")
                break
            elif run.status == "requires_action":
                output = call_required_functions(run, run.required_action)
                print(f"SUBMIT OUTPUT => {output}")
        except Exception as e:
            print(e)
            break
    return response
