# Flask Chatbot Management Application

This application serves as the backend for managing chatbots and handling chat interactions using the OpenAI API. The application provides endpoints for creating and updating chatbots, managing chat threads, and sending and receiving messages.

## Key Features

### 1. **Thread Management**
   - **Create Thread (`/create_thread`)**:
     - Generates a new chat thread using the OpenAI API and registers it in the database.
   - **Get Threads (`/threads`)**:
     - Retrieves the list of chat threads from the database.
   - **Get Messages (`/threads/<thread_id>/messages`)**:
     - Fetches messages for a specific thread from the OpenAI API or the database, depending on the thread status.

### 2. **Chatbot Management**
   - **Create Chatbot (`/create_assistant`)**:
     - Allows users to create a new chatbot by specifying its name, instructions, model, and associated tools (with URLs).
   - **Update Chatbot (`/update_assistant`)**:
     - Updates an existing chatbot’s details.
   - **List Chatbots (`/chatbots`)**:
     - Fetches a list of all available chatbots.

### 3. **Chat Functionality**
   - **Send Message (`/chat`)**:
     - Sends a message to a chatbot. The application checks the thread's status (active or agent takeover) and routes the message accordingly.
   - **Agent Takeover (`/agent_takeover/<thread_id>`)**:
     - Handles the transition of a thread to agent takeover mode.

### 4. **Serve Embedded Chatbot**
   - **Serve Embedded Chatbot (`/chatbot`)**:
     - Serves an HTML template with an embedded chatbot, allowing users to integrate the chatbot into their websites.

### 5. **Variable Management**
   - **Fetch Variables (`/get_variables/<thread_id>/`)**:
     - Retrieves variables associated with a specific chat thread.

## Architecture Diagram

```mermaid
graph TD
    subgraph User Interaction
        A[User Initiates Request]
        B[User Sends Message]
        C[User Creates/Updates Chatbot]
        D[User Requests Chatbot List]
    end

    subgraph Flask Application
        E[Flask Server]
        F[Create Thread]
        G[Create/Update Assistant]
        H[Send Message]
        I[Fetch Messages]
        J[Fetch Variables]
        K[Agent Takeover]
    end

    subgraph OpenAI API
        L[OpenAI API]
    end

    subgraph Database
        M[Database]
    end

    A --> E
    B --> H
    C --> G
    D --> E
    E --> F
    F --> M
    G --> L
    H --> L
    I --> M
    H --> M
    J --> M
    K --> M

