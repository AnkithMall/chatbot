from pymongo import MongoClient,ASCENDING
import os
from dotenv import load_dotenv

load_dotenv()

db_client = MongoClient(os.environ.get("MONGODB_CONNECTION_STRING"))
print(os.environ.get("MONGODB_CONNECTION_STRING"))
db = db_client['chatbot_db']
tools_collection = db['tools_collection'] 
tools_collection.create_index([("function.name", ASCENDING)], unique=True)

print(db)

def add_tool(tool_data):
    try:
        # Insert the new tool document into the collection
        result = tools_collection.insert_one(tool_data)
        return {"success": True, "message": "Tool added successfully!", "id": str(result.inserted_id)}
    except Exception as e:
        return {"success": False, "message": str(e)}

def get_tool(tool_name):
    # Find the tool document by its name
    tool = tools_collection.find_one({"function.name": tool_name})
    
    if tool:
        return {"success": True, "tool": tool}
    else:
        return {"success": False, "message": "Tool not found"}

tool_data = {
    "type": "function",
    "function": {
        "name": "lead_details",
        "description": "Update the Lead details obtained from the client through the chat",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name of the Client or lead"
                },
                "SSN": {
                    "type": "string",
                    "description": "Social Security number of the client"
                },
                "dob": {
                    "type": "string",
                    "description": "Date of Birth of the client"
                }
            },
            "required": ["name", "SSN", "dob"]
        },
        "url": "https://api.example.com/lead_details"
    }
}

# Add the tool
add_result = add_tool({"asst_id":"","tools":tool_data})
print(add_result)

# Retrieve the tool by name
# get_result = get_tool("lead_details")
# print(get_result)