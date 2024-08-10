from flask import Flask, request, jsonify
from flask_cors import CORS
from helper_function import create_assistant_helper, create_message, run_thread, wait_for_run_completion, object_to_dict,update_assistant_helper
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

    # Interact with OpenAI's API
    msg = create_message(message, thread_id)
    run_detail = run_thread(thread_id, asst_id)
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

@app.route('/chatbot/<assistant_id>', methods=['GET'])
def serve_chatbot(assistant_id):
    return f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chatbot</title>
        <style>
            body, html {{ margin: 0; padding: 0; height: 100%; overflow: hidden; }}
            #chatbot-container {{
                position: fixed;
                bottom: 0;
                right: 0;
                width: 100%;
                height: 100%;
                border: none;
                z-index: 1000;
            }}
        </style>
    </head>
    <body>
        <div id="chatbot-container"></div>
        <script>
            (function() {{
                var threadId = null;
                async function createThread() {{
                    const response = await fetch('/create_thread', {{ method: 'POST' }});
                    const data = await response.json();
                    threadId = data.thread_id;
                }}
                
                async function sendMessage(message) {{
                    const response = await fetch('/chat', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify({{
                            thread_id: threadId,
                            message: message,
                            asst_id: '{assistant_id}'
                        }})
                    }});
                    const result = await response.json();
                    return result.run_id;
                }}

                // Initialize the chatbot
                createThread();
                
                // For demonstration purposes, automatically send a welcome message
                setTimeout(() => {{
                    sendMessage("Hello, how can I assist you today?");
                }}, 1000);
            }})();
        </script>
    </body>
    </html>
    '''



if __name__ == '__main__':
    app.run(debug=True)
