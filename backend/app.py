from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from helper_function import create_assistant_helper, create_message, run_thread, wait_for_run_completion, object_to_dict,update_assistant_helper,handle_thread_cancel
import openai
import os
from dotenv import load_dotenv
from db_helper import register_thread,get_threads,fetch_variables,get_thread_status,add_message_to_thread,fetch_messages_by_thread_id,stream_threads,change_thread_status
load_dotenv()
from datetime import datetime
from flask_socketio import SocketIO, emit

client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

default_asst = "asst_fN72dShbo6g7z5okrGfO5eDB"

@app.route('/terminate_chat/<thread_id>/<end_code>', methods=['POST'])
def terminate_chat(thread_id,end_code):
    status = ""
    if end_code == 1 :
        status = "inactive_chat"
    elif end_code == 2 :
        status = "window_closed"
    elif end_code == 3 :
        status = "network_error"
    elif end_code == 4 :
        status = "ended_by_assistant"

    return change_thread_status(thread_id,status),200


@app.route('/create_thread', methods=['POST'])
def create_thread():
    #return client.beta.threads.create().id
    thread = client.beta.threads.create()
    thread_id = thread.id
    register_result=register_thread(thread)
    #print(f"registered result => {register_result}")
    return jsonify({"thread_id": thread_id}), 201

@app.route('/create_assistant', methods=['POST'])
def create_assistant():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request"}), 400

    asst_name = data["name"]
    instruction = data["instruction"]
    asst_model = data["model"]
    asst_func = data["tools"]  # Should now include URL for each function
    
    assistant_id = create_assistant_helper(asst_name, instruction, asst_model, asst_func)
    
    return jsonify({"assistant_id": assistant_id}), 201

@app.route('/update_assistant', methods=['POST'])
def update_assistant():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request"}), 400

    asst_id = data.get("asst_id")
    asst_name = data.get("name")
    instruction = data.get("instruction")
    asst_model = data.get("model")
    asst_func = data.get("tools")  # Should now include URL for each function

    try:
        assistant_id = update_assistant_helper(asst_name, instruction, asst_model, asst_func, asst_id)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    
    return jsonify({"assistant_id": assistant_id}), 200


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request"}), 400

    thread_id = data.get("thread_id")
    message = data.get("message")
    asst_id = data.get("asst_id")
    if not thread_id or not message:
        return jsonify({"error": "Invalid request body"}), 400
    thread_status = get_thread_status(thread_id)
    if thread_status['status'] == "active":
        # Interact with OpenAI's API
        msg = create_message(message, thread_id)
        run_detail = run_thread(thread_id, asst_id)
        wait_for_run_completion(thread_id, run_detail.id)
        #db_update=register_thread(thread_id)
        #print(f"db update result => {db_update}")
        socketio.emit(f"lead_chats-{thread_id}",{"thread_id":thread_id})
        return {"run_id": run_detail.id}, 200
    elif thread_status['status'] == "agent_takeover":
        new_message = {
            "assistant_id": "agent-default",
            "content": [{"text": {"annotations": [], "value": message}, "type": "text"}],
            "role": "user",
            "created_at": int(datetime.now().timestamp())  # You can replace this with the current timestamp if needed
        }
        # Add message to the DB message list
        add_message_result = add_message_to_thread(thread_id, new_message)
        socketio.emit(f"lead_msg-{thread_id}",{"thread_id":thread_id,"message":new_message})
        return add_message_result, 200

@app.route('/chat/agent', methods=['POST'])
def agent_chat():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request"}), 400

    thread_id = data.get("thread_id")
    message = data.get("message")
    asst_id = data.get("asst_id")
    if not thread_id or not message:
        return jsonify({"error": "Invalid request body"}), 400
    thread_status = get_thread_status(thread_id)
    
    if thread_status['status'] == "agent_takeover":
        new_message = {
            "assistant_id": "agent-default",
            "content": [{"text": {"annotations": [], "value": message}, "type": "text"}],
            "role": "agent",
            "created_at": int(datetime.now().timestamp())  # You can replace this with the current timestamp if needed
        }
        # Add message to the DB message list
        add_message_result = add_message_to_thread(thread_id, new_message)
        socketio.emit(f"agent_msg-{thread_id}",{"thread_id":thread_id,"message":new_message})
        return add_message_result, 200
    return 404


@app.route('/chatbots', methods=['GET'])
def chatbots():
    asst_list = client.beta.assistants.list()
    asst_list_dict = object_to_dict(asst_list.data)
    return jsonify(asst_list_dict),200

@app.route('/threads/<thread_id>/messages', methods=['GET'])
def get_messages(thread_id):
    if not thread_id:
        return jsonify({"error": "Invalid thread ID"}), 400

    # Fetch the thread status
    thread_status = get_thread_status(thread_id)
    
    if not thread_status['success']:
        return jsonify({"error": thread_status['message']}), 404
    print(f"thread_status => {thread_status['status']}")
    if thread_status['status'] == "active":
        # Fetch messages directly from the chat client or database for active threads
        try:
            messages = object_to_dict(client.beta.threads.messages.list(thread_id).data)

            print(f"messages => {messages}")
            return jsonify({"messages": messages}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    elif thread_status['status'] == "agent_takeover":
        # Fetch messages from the database for threads with agent takeover status
        messages = fetch_messages_by_thread_id(thread_id)
        if messages['success']:
            return jsonify({"messages": messages['messages']}), 200
        else:
            return jsonify({"error": messages['message']}), 404

    else:
        return jsonify({"error": "Invalid thread status"}), 400


@app.route('/chatbot', methods=['GET'])
def serve_chatbot():
    assistant_id = request.args.get('assistant_id')
    if not assistant_id:
        return "Assistant ID is required", 400
    with open('./embedded_chatbot.html', 'r') as file:
        chatbot_html = file.read()
    return chatbot_html.replace("{{assistant_id}}", assistant_id)

@app.route('/threads',methods=['GET'])
def get_threads_from_db():
    threads = get_threads()
    #print(threads)
    return jsonify(threads), 200

@app.route('/get_variables/<thread_id>/',methods=['GET'])
def get_variables(thread_id):
    #print(thread_id)
    fetched_var=fetch_variables(thread_id)
    return jsonify(fetched_var),200

@app.route('/agent_takeover/<thread_id>',methods=['GET'])
def agent_takeover(thread_id):
    #print(f"takeover the thread => {thread_id}")
    # Notify clients about the thread status change
    takeover = handle_thread_cancel(thread_id)
    print(f"takeover {takeover}")
    if isinstance(takeover, dict) and takeover.get('deleted'):
        socketio.emit('thread_status_change', {'thread_id': thread_id, 'status': 'agent_takeover'})
        return {"message": "Agent takeover successful."}, 200
    if isinstance(takeover, dict) and takeover.get('message') == "thread already cancelled":
        return takeover, 200
    return {"message": "Agent takeover failed."},500

@socketio.on('connect')
def handle_connect():
    print("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")



@app.route('/events/threads')
def sse():
    return Response(stream_threads(), mimetype='text/event-stream')


if __name__ == '__main__':
    #app.run(debug=True,threaded=True)
    socketio.run(app, debug=True)
