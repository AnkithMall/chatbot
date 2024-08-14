from pymongo import MongoClient, ASCENDING
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

db_client = MongoClient(os.environ.get("MONGODB_CONNECTION_STRING"))
db = db_client['chatbot_db']
tools_collection = db['function_collection']
tools_collection.create_index([("asst_id", ASCENDING)], unique=True)
threads_collection = db['threads_collection']
variable_collection = db['variable_collection']
message_collection = db['message_collection']

def transfer_message_to_db(thread_id,messages):
    record = { "thread_id":thread_id,"messages":object_to_dict(messages.data)}
    try:
        result = message_collection.update_one(
            {},
            {"$set": record},
            upsert=True
        )
        print(f"message list => {messages}")
        print(result)
        return {"success": True, "message": "Message List added/updated successfully!", "id": str(result.upserted_id)}
    except Exception as e:
        return {"success": False, "message": str(e)}

def change_thread_status(thread_id,status):
    
    try:
        result = threads_collection.update_one(
            {"id":thread_id},
            {"$set": {"status":status}},
            upsert=False
        )
        
        return {"success": True, "message": "Message List added/updated successfully!", "id": str(result.upserted_id)}
    except Exception as e:
        return {"success": False, "message": str(e)}
    
def get_thread_status(thread_id):
    try:
        # Fetch the thread with the given thread_id
        thread = threads_collection.find_one({"id": thread_id})
        
        if thread:
            # Return the status if the thread is found
            return {"success": True, "status": thread.get("status"), "message": "Thread status retrieved successfully!"}
        else:
            # Return a message if the thread is not found
            return {"success": False, "message": "Thread not found"}
    except Exception as e:
        return {"success": False, "message": str(e)}
    
def add_message_to_thread(thread_id, new_message):
    try:
        # Add the new message to the start of the thread's messages array
        result = message_collection.update_one(
            {"thread_id": thread_id},  # Find the document with the specified thread_id
            {"$push": {"messages": {"$each": [new_message], "$position": 0}}}  # Push the new message to the beginning of the messages array
        )
        
        if result.matched_count > 0:
            # If the document was found and updated, return success
            return {"success": True, "message": "Message added to thread successfully!"}
        else:
            # If no document was found with the given thread_id
            return {"success": False, "message": "Thread not found"}
    except Exception as e:
        # Handle any exceptions that may occur
        return {"success": False, "message": str(e)}

    
def fetch_messages_by_thread_id(thread_id):
    try:
        # Fetch the document corresponding to the given thread_id
        thread = message_collection.find_one({"thread_id": thread_id}, {"_id": 0, "messages": 1})

        if thread and "messages" in thread:
            # Return the list of messages if found
            return {"success": True, "messages": thread["messages"]}
        else:
            # Return a message if the thread or messages are not found
            return {"success": False, "message": "No messages found for the given thread_id"}
    except Exception as e:
        return {"success": False, "message": str(e)}




def add_tool(tool_data):
    print(f"\n\ntool data => {tool_data}\n\n")
    try:
        # Insert or update the tool document based on function name
        result = tools_collection.update_one(
            {"asst_id": tool_data["asst_id"], "tools.name": tool_data["tools"]["name"]},
            {"$set": tool_data},
            upsert=True
        )
        print(result)
        return {"success": True, "message": "Tool added/updated successfully!", "id": str(result.upserted_id)}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_tool(asst_id,tool_name):
    tool = tools_collection.find_one({"asst_id": asst_id, "tools.name": tool_name})
    print(f"tool from db => {tool}\nasst_id => {asst_id}\n tool_name: {tool_name}")
    if tool:
        return {"success": True, "tool": tool}
    else:
        return {"success": False, "message": "Tool not found"}

def object_to_dict(obj):
    if isinstance(obj, list):
        return [object_to_dict(item) for item in obj]
    elif hasattr(obj, "__dict__"):
        return {key: object_to_dict(value) for key, value in obj.__dict__.items()}
    else:
        return obj
    
def register_thread(thread):
    print(thread)
    try:
        thread_dict = object_to_dict(thread)
        # Update the dictionary with the new status
        thread_dict.update({"status": "active"})
        # Insert or update the tool document based on function name
        result = threads_collection.update_one(
            {"id": thread.id},
            {"$set": thread_dict  },
            upsert=True
        )
        print(f"regist{result}")
        return {"success": True, "message": "thread added/updated successfully!", "id": str(result.upserted_id)}
    except Exception as e:
        return {"success": False, "message": str(e)}
    
def get_threads():
   
    threads = list(threads_collection.find({}))
    #print(threads)
    for thread in threads:
        thread['_id'] = str(thread['_id'])
    #print(threads)
    
    return threads if threads else {"success": False, "message": "threads not found"}

def register_variables(thread_id,variables):
    #print(thread)
    try:
        # Insert or update the tool document based on function name
        result = variable_collection.update_one(
            {"thread_id": thread_id},
            {"$set": { "thread_id":thread_id,"variables":variables}},
            upsert=True
        )
        print(result)
        return {"success": True, "message": "thread added/updated successfully!", "id": str(result.upserted_id)}
    except Exception as e:
        return {"success": False, "message": str(e)}
    
def fetch_variables(thread_id):
    variables = variable_collection.find_one({"thread_id": thread_id})
    print(f"variables from db => {variables}")

    if variables:
        # Only attempt to delete the '_id' key if variables is not None
        if '_id' in variables:
            del variables['_id']
        return {"success": True, "variables": variables}
    else:
        return {"success": False, "message": "Variable not found"}
