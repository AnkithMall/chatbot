# Chat Application Frontend Documentation

This document provides an overview of the frontend logic and workflow used in the chat application. The frontend is built using React and Material-UI, with Axios for API requests.

## Key Components and Logic

### 1. **State Management**
   - `threads`: Stores the list of chat threads.
   - `selectedThread`: Stores the currently selected thread ID.
   - `messages`: Stores the messages for the selected thread.
   - `variables`: Stores the variables associated with the selected thread.
   - `loading`: Tracks the loading state for thread fetching.
   - `messageText`: Stores the current message text input.
   - `isFirstMessage`: Tracks whether the current message is the first in a thread (to handle agent takeover).

### 2. **Fetching Data**
   - **Threads**: Threads are fetched from the backend using Axios when the component mounts.
   - **Messages**: Messages are fetched when a thread is selected by the user.
   - **Variables**: Variables are fetched along with the messages for the selected thread.

### 3. **User Interactions**
   - **Selecting a Thread**: When a user selects a thread, the messages and variables for that thread are fetched and displayed.
   - **Sending a Message**: 
     - The message is sent to the backend.
     - If it is the first message in the thread, an agent takeover request is sent before the message.
     - The message list is then updated.

### 4. **Polling for Updates**
   - The application polls the backend for new messages every 5 seconds, ensuring that the chat interface stays up-to-date.

## Diagram: Frontend Workflow

```mermaid
graph TD
  A[Component Mount] --> B[Fetch Threads]
  B --> C{Threads Available?}
  C -- Yes --> D[Display Threads]
  C -- No --> E[Show Loading Indicator]

  D --> F[User Selects a Thread]
  F --> G[Fetch Messages for Thread]
  G --> H{Messages Available?}
  H -- Yes --> I[Display Messages]
  H -- No --> J[Show No Messages Available]

  I --> K[User Sends a Message]
  K --> L{Is First Message?}
  L -- Yes --> M[Agent Takeover]
  L -- No --> N[Post Message to Server]
  N --> O[Update Message List]
  M --> N
  K --> Q[Clear Input Field]

  F --> R[Fetch Variables for Thread]
  R --> S[Display Variables]
  
  I --> T[Polling for Messages]
  T --> G


# ChatBot Management Application

This documentation provides an overview of the chatbot management interface. The application allows users to create, update, and interact with chatbots.

## Key Components

### 1. **ChatBot Management**
   - **Create Chatbot:** 
     - Users can create a new chatbot by entering details like name, instructions, model, and tools in a modal form.
   - **Update Chatbot:**
     - Existing chatbots can be selected from the sidebar, and their details can be updated.
   - **List Chatbots:**
     - All available chatbots are displayed in a list on the sidebar for easy selection.

### 2. **Chat Interface**
   - **Message Sending:**
     - Users can chat with the selected chatbot. Messages are displayed in a chat window, and new threads are created if necessary.
   - **Polling for Updates:**
     - The chat window updates periodically to fetch new messages.

### 3. **Embed Code Generation**
   - **Generate Embed Code:**
     - Users can generate and copy an embed code to integrate the chatbot into other websites.

## Diagram: Application Workflow

```mermaid
graph TD
    A[Component Mount] --> B[Fetch Chatbots]
    B --> C{Chatbots Available?}
    C -- Yes --> D[Display Chatbots List]
    C -- No --> E[Show No Chatbots Available]
    
    D --> F[User Selects Chatbot]
    F --> G[Display Chatbot Details]
    G --> H[User Updates Chatbot Details]
    H --> I[Update Chatbot in Backend]

    F --> J[User Opens Chat Interface]
    J --> K{Thread Exists?}
    K -- No --> L[Create New Thread]
    L --> M[Update Thread ID]
    K -- Yes --> N[Load Chat Messages]

    M --> N
    N --> O[User Sends Message]
    O --> P[Post Message to Backend]
    P --> Q[Update Chat Messages]
    Q --> N
    
    F --> R[User Generates Embed Code]
    R --> S[Copy Embed Code to Clipboard]

    T[User Opens Create Chatbot Modal] --> U[Fill Chatbot Details]
    U --> V[Create Chatbot in Backend]
    V --> W[Add New Chatbot to List]
    W --> D
