import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
const socket = io(import.meta.env.VITE_BASE_URL_BACKEND_SERVER);

import {
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField
} from "@mui/material";

export const ChatMessages = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [variables, setVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  

  // Function to fetch and update threads
  const fetchThreads = async () => {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/threads`
      console.log(url);
      const response = await axios.get(url);
      console.log("data => ",response.data);
      setThreads(Array.isArray(response.data) ? response.data.reverse() : []);

    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch and update messages
  const fetchMessages = async (threadId) => {
    setVariables([]);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/threads/${threadId}/messages`);
      const response1 = await axios.get(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/get_variables/${threadId}`);
      setMessages(response.data.messages.reverse());
      setSelectedThread(threadId);
      if(response1.data.variables){
        setVariables(response1.data.variables.variables || []);  // Assuming the API returns a 'variables' object
      }else{
        setVariables([])
      }
    } catch (error) {
      console.error("There was an error fetching the messages!", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !messageText.trim()) return;

    try {
      if (isFirstMessage) {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/agent_takeover/${selectedThread}`);
        console.log(res);
        setIsFirstMessage(false);
       
      }

      await axios.post(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/chat/agent`, {
        thread_id: selectedThread,
        message: messageText,
        asst_id: "",  // Replace with the actual assistant ID if needed
      });

      setMessages(prevMessages => [
        ...prevMessages,
        { role: "agent", content: [{ text: { value: messageText } }] }
      ]);

      // Clear input field
      setMessageText('');
    } catch (error) {
      console.error("There was an error sending the message!", error);
    }
  };
  useEffect(() => {
    socket.on('thread_status_change', (data) => {
      console.log(data);
      if (data.thread_id === selectedThread) {
        // Update UI or fetch new messages based on the thread ID
        console.log(`Thread ${data.thread_id} status changed to ${data.status}`);
        alert(`Conversation TakeOver SuccessFull!`)
      }
    });

    socket.on(`lead_msg-${selectedThread}`,(data) => {
      console.log("Lead => ",data);
      setMessages((prevMessages) => [...prevMessages,data.message])
      console.log("messages",messages);
    })


    return () => {
      socket.off('thread_status_change');
      socket.off(`lead_msg-${selectedThread}`);
    };
  },[selectedThread])

  useEffect(()=>{
    fetchThreads();
    const eventSource = new EventSource(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/events/threads`);

    eventSource.onmessage = (event) => {
      console.log("sse event => ",event);
      //const validJsonString = event.data.replace(/'/g, '"');
      const data = JSON.parse(event.data);
      console.log("sse event data => ",data);
      data.operationType === "insert"&&setThreads((prevThreads)=> [data.fullDocument,...prevThreads])
      //const data = JSON.parse(event.data);
      // Assuming data contains the updated thread/message info
      // if (data.operationType === 'insert') {
      //   // Handle new threads or messages
      //   const newMessage = data.fullDocument;  // Change according to your data format
      //   setMessages((prevMessages) => [...prevMessages, newMessage]);
      // }
    };

    eventSource.onerror = (error) => {
      console.error("Error with SSE connection:", error);
      eventSource.close();
      // Optionally attempt to reconnect after a delay
  // setTimeout(() => {
  //   eventSource = new EventSource(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/events/threads`);
  // }, 5000); // Reconnect after 5 seconds
    };

    return () => {
      eventSource.close();  // Clean up when component unmounts
    };
  },[])
  // useEffect(() => {
  //   const messagePollingInterval = setInterval(() => {
  //     if (selectedThread) {
  //       fetchMessages(selectedThread);
  //     }
  //   }, 5000); 

  //   return () => {
  //     clearInterval(messagePollingInterval); // Clear message polling interval on component unmount
  //   };
  // }, [selectedThread]); // Re-run polling when selectedThread changes

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* First Section: Thread List */}
      <div style={{ width: '25%',height:'90vh',overflow:"scroll", borderRight: '1px solid #ccc', padding: '20px' }}>
        <Typography variant="h6">Threads</Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <List>
            {threads.filter(item => item.status === "active" || item.status === "agent_takeover").map(thread => (
              <ListItem button key={thread.id} onClick={() => fetchMessages(thread.id)}>
                <ListItemText primary={thread.id} />
              </ListItem>
            ))}
          </List>
        )}
      </div>

      {/* Second Section: Chat Messages */}
      <div style={{ width: '50%', borderRight: '1px solid #ccc', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6">Chat - {selectedThread} </Typography>
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
          {messages.length > 0 ? messages.map((message, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <Typography variant="body2" color={message.role === "user" ? "primary" : "textSecondary"}>
                {message.content.map((contentItem, i) => (
                  <span key={i}>{contentItem.text.value}</span>
                ))}
              </Typography>
            </div>
          )) : <Typography>No messages available</Typography>}
        </div>
        {/* Input Field and Send Button */}
        <div style={{ display: 'flex', marginTop: '10px' }}>
          <TextField
            fullWidth
            label="Type your message"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendMessage}
            style={{ marginLeft: '10px' }}
          >
            Send
          </Button>
        </div>
      </div>

      {/* Third Section: Variables */}
      <div style={{ width: '25%', padding: '20px' }}>
        <Typography variant="h6">Variables</Typography>
        <List>
          {Object.entries(variables).map(([name, value], index) => (
            <ListItem key={index}>
              <ListItemText primary={`${name}: ${value}`} />
            </ListItem>
          ))}
        </List>
      </div>
    </div>
  );
};
