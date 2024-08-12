import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
      const response = await axios.get(`${import.meta.env.BASE_URL_BACKEND_SERVER}/threads`);
      setThreads(response.data);
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch and update messages
  const fetchMessages = async (threadId) => {
    try {
      const response = await axios.get(`${import.meta.env.BASE_URL_BACKEND_SERVER}/threads/${threadId}/messages`);
      const response1 = await axios.get(`${import.meta.env.BASE_URL_BACKEND_SERVER}/get_variables/${threadId}`);
      setMessages(response.data.messages.reverse());
      setSelectedThread(threadId);
      setVariables(response1.data.variables.variables || []);  // Assuming the API returns a 'variables' object
    } catch (error) {
      console.error("There was an error fetching the messages!", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !messageText.trim()) return;

    try {
      if (isFirstMessage) {
        await axios.get(`${import.meta.env.BASE_URL_BACKEND_SERVER}/agent_takeover/${selectedThread}`);
        setIsFirstMessage(false);
      }

      await axios.post(`${import.meta.env.BASE_URL_BACKEND_SERVER}/chat`, {
        thread_id: selectedThread,
        message: messageText,
        asst_id: "your-assistant-id-here",  // Replace with the actual assistant ID if needed
      });

      setMessages(prevMessages => [
        ...prevMessages,
        { role: "user", content: [{ text: { value: messageText } }] }
      ]);

      // Clear input field
      setMessageText('');
    } catch (error) {
      console.error("There was an error sending the message!", error);
    }
  };

  useEffect(() => {
    // Fetch threads on component mount
    fetchThreads();

    // Set up polling for threads and messages
    const threadPollingInterval = setInterval(fetchThreads, 20000); // Poll threads every 5 seconds
    const messagePollingInterval = setInterval(() => {
      if (selectedThread) {
        fetchMessages(selectedThread);
      }
    }, 5000); // Poll messages every 5 seconds

    return () => {
      clearInterval(threadPollingInterval); // Clear thread polling interval on component unmount
      clearInterval(messagePollingInterval); // Clear message polling interval on component unmount
    };
  }, [selectedThread]); // Re-run polling when selectedThread changes

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* First Section: Thread List */}
      <div style={{ width: '25%', borderRight: '1px solid #ccc', padding: '20px' }}>
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
                  <p key={i}>{contentItem.text.value}</p>
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
