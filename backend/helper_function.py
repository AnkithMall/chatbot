import openai
import json
import requests
import time
import os
from dotenv import load_dotenv

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
    #print(f"functions => {functions}")
    #formatted_functions = format_functions(functions)
    #print(f"formatted functions => {formatted_functions}")
    
    chatbot_assis = client.beta.assistants.create(
        name=name,
        instructions=instruction,
        model=model,
        tools=functions
    )
    
    #print(chatbot_assis)
    return chatbot_assis.id
def update_assistant_helper(name=None, instruction=None, model=None, functions=None, asst_id=None):
    # Ensure that the assistant ID is provided
    if not asst_id:
        raise ValueError("Assistant ID is required")
    
    # Create a dictionary of the parameters
    update_params = {
        "assistant_id": asst_id,
        "name": name,
        "instructions": instruction,
        "model": model,
        "tools": functions
    }
    
    # Filter out any parameters that are None
    update_params = {key: value for key, value in update_params.items() if value is not None}
    
    # Update the assistant with the filtered parameters
    chatbot_assis = client.beta.assistants.update(**update_params)
    
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
            print(f"function name => {func_name}")

            arguments = json.loads(tool_call['function']['arguments'])
            print(f"function_name={func_name}\narguments={arguments}")
            output = {}
            if func_name == "lead_details":
                try:
                    url = "https://hook.eu2.make.com/it0fo3coyesfvpw99supz4n03c1vjsp1"
                    response = requests.post(url, json=arguments)
                    if response.status_code == 200:
                        output = response.json()
                        print(f"Output => {output}")
                except requests.exceptions.RequestException as e:
                    print("Error tool Call !", e)

                tools_output.append({"tool_call_id": tool_call['id'], "output": output.get("message", "")})
            else:
                raise ValueError(f"Unknown Function {func_name}")

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
