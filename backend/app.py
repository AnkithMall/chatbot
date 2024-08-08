from flask import Flask, request, jsonify
from flask_cors import CORS
from helper_function import create_assistant_helper, create_message, run_thread, wait_for_run_completion, object_to_dict
import openai
import os
from dotenv import load_dotenv

load_dotenv()

client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
app = Flask(__name__)
CORS(app)

default_asst = "asst_fN72dShbo6g7z5okrGfO5eDB"

@app.route('/create_thread', methods=['POST'])
def create_thread():
    #return client.beta.threads.create().id
    thread_id = client.beta.threads.create().id
    return jsonify({"thread_id": thread_id}), 201

@app.route('/create_assistant', methods=['POST'])
def create_assistant():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request"}), 400

    print(data)

    # Extract message details from the request body
    asst_name = data["name"]
    instruction = data["instruction"]
    asst_model = data["model"]
    asst_func = data["tools"]
    assistant_id = create_assistant_helper(asst_name, instruction, asst_model, asst_func)
    
    return jsonify({"assistant_id": assistant_id}), 201

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request"}), 400

    thread_id = data.get("thread_id")
    message = data.get("message")

    if not thread_id or not message:
        return jsonify({"error": "Invalid request body"}), 400

    # Interact with OpenAI's API
    msg = create_message(message, thread_id)
    run_detail = run_thread(thread_id, default_asst)
    wait_for_run_completion(thread_id, run_detail.id)
    return {"run_id": run_detail.id}, 200

@app.route('/chatbots', methods=['GET'])
def chatbots():
    asst_list = client.beta.assistants.list()
    asst_list_dict = object_to_dict(asst_list.data)
    return jsonify(asst_list_dict),200

@app.route('/threads/<thread_id>/messages', methods=['GET'])
def get_messages(thread_id):
    if not thread_id:
        return jsonify({"error": "Invalid thread ID"}), 400

    print(f"theead => {thread_id}\n")
    # Fetch messages from the thread using your chat client or database
    messages = object_to_dict(client.beta.threads.messages.list(thread_id).data)
    print(messages)
    return jsonify({"messages": messages}), 200



if __name__ == '__main__':
    app.run(debug=True)
