from pymongo import MongoClient, ASCENDING
import os
from dotenv import load_dotenv

load_dotenv()

db_client = MongoClient(os.environ.get("MONGODB_CONNECTION_STRING"))
db = db_client['chatbot_db']
tools_collection = db['function_collection']
tools_collection.create_index([("asst_id", ASCENDING)], unique=True)

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
