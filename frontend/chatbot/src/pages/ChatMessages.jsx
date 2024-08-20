import React, { useState } from 'react';
import { useThreads } from '../../util/hooks/useThreads';
import { useMessages } from '../../util/hooks/useMessages';
import { useChatContext } from '../../util/context/ChatContext';
import { CircularProgress, Button, List, ListItem, ListItemText, Typography, TextField } from "@mui/material";

export const ChatMessages = () => {
  const { selectedThread, setSelectedThread } = useChatContext();
  const { threads, loading } = useThreads();
  const { messages, variables, sendMessage } = useMessages(selectedThread);
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = () => {
    sendMessage(messageText);
    setMessageText('');
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <ThreadsList threads={threads} loading={loading} setSelectedThread={setSelectedThread} />
      <ChatWindow selectedThread={selectedThread} messages={messages} messageText={messageText} setMessageText={setMessageText} handleSendMessage={handleSendMessage} />
      <VariablesList variables={variables} />
    </div>
  );
};

const ThreadsList = ({ threads, loading, setSelectedThread }) => {
  const { selectedThread } = useChatContext();
  return (
  <div style={{ width: '25%', height: '90vh', overflow: "scroll", borderRight: '1px solid #ccc', padding: '20px' }}>
    <Typography variant="h6">Threads</Typography>
    {loading ? (
      <CircularProgress />
    ) : (
      <List>
        {threads.filter(item => item.status === "active" || item.status === "agent_takeover").map(thread => (
          <ListItem button key={thread.id} style={{
            backgroundColor: thread.id === selectedThread ? '#007bff' : 'transparent', // Background color when selected
            color: thread.id === selectedThread ? '#fff' : '#000' // Text color when selected
          }} onClick={() => setSelectedThread(thread.id)}>
            <ListItemText primary={thread.id} />
          </ListItem>
        ))}
      </List>
    )}
  </div>
)}

const ChatWindow = ({ selectedThread, messages, messageText, setMessageText, handleSendMessage }) => (
  <div style={{ width: '50%', borderRight: '1px solid #ccc', padding: '20px', display: 'flex', flexDirection: 'column' }}>
    <Typography variant="h6">Chat - {selectedThread}</Typography>
    <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
      {messages.length > 0 ? messages.map((message, index) => (
        <div key={index} style={{ marginBottom: '10px', textAlign: message.role === "agent" ? "right" : "left" }}>
          <Typography variant="body1" style={{ display: "inline-block", backgroundColor: message.role === "user" ? "#e0f7fa" : "#fff9c4", padding: "5px", borderRadius: "5px" }}>
            {message.content.map((contentItem, i) => (
              <span key={i}>{contentItem.text.value}</span>
            ))}
          </Typography>
        </div>
      )) : <Typography>No messages available</Typography>}
    </div>
    <div style={{ display: 'flex', marginTop: '10px' }}>
      <TextField fullWidth label="Type your message" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
      <Button variant="contained" color="primary" onClick={handleSendMessage} style={{ marginLeft: '10px' }}>Send</Button>
    </div>
  </div>
);

const VariablesList = ({ variables }) => (
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
);
